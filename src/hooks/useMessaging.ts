import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { playNotificationSound } from "@/lib/sounds";
import type { 
  ConversationPayload, 
  ConversationsResponse, 
  MessagePayload, 
  MessagesResponse,
  NewMessageEvent,
  MessageSentEvent,
  MessageDeliveredEvent,
  MessageSeenEvent,
  TypingEvent,
  ConversationUpdatedEvent
} from "@/lib/types/messaging";

export function useConversations() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data } = await api.get<ConversationsResponse>("/messages/conversations");
      return data.data;
    },
  });

  useEffect(() => {
    if (!socket) return;

    const handleConversationUpdated = (payload: ConversationUpdatedEvent) => {
      queryClient.setQueryData<ConversationPayload[]>(["conversations"], (old) => {
        if (!old) return old; // Requires a fresh fetch, or we could fetch the specific conversation
        
        const exists = old.some(c => c.id === payload.conversationId);
        if (exists) {
          // Replace it and sort
          return old
            .map(c => c.id === payload.conversationId ? { ...c, last_message: payload.last_message, last_message_at: payload.last_message.created_at } : c)
            .sort((a, b) => {
              const aTime = a.last_message?.created_at || a.created_at;
              const bTime = b.last_message?.created_at || b.created_at;
              return new Date(bTime).getTime() - new Date(aTime).getTime();
            });
        }
        
        // If not exists, we ideally fetch it but for now we'll just invalidate
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        return old;
      });
    };

    socket.on("conversation_updated", handleConversationUpdated);
    return () => {
      socket.off("conversation_updated", handleConversationUpdated);
    };
  }, [socket, queryClient]);

  return query;
}

export function useMessages(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam }) => {
      if (!conversationId) return { messages: [], nextCursor: null, hasMore: false };
      const url = pageParam 
        ? `/messages/conversations/${conversationId}?cursor=${pageParam}` 
        : `/messages/conversations/${conversationId}`;
      const { data } = await api.get<MessagesResponse>(url);
      return data.data;
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!conversationId,
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post<{ data: { conversation: ConversationPayload, isNew: boolean } }>("/messages/conversations", { other_user_id: userId });
      return data.data.conversation;
    },
    onSuccess: (newConversation) => {
      queryClient.setQueryData<ConversationPayload[]>(["conversations"], (old) => {
        if (!old) return [newConversation];
        if (old.some(c => c.id === newConversation.id)) return old; // Already exists
        return [newConversation, ...old];
      });
    }
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversationId: string) => {
      await api.delete(`/messages/conversations/${conversationId}`);
      return conversationId;
    },
    onSuccess: (conversationId) => {
      queryClient.setQueryData<ConversationPayload[]>(["conversations"], (old) => {
        if (!old) return old;
        return old.filter(c => c.id !== conversationId);
      });
    }
  });
}

// ─── Real-Time Messaging Hook ────────────────────────────────────────────────

export function useChat(activeConversationId: string | null) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  // Join/leave conversation room
  useEffect(() => {
    if (!socket || !activeConversationId) return;
    
    socket.emit("join_conversation", { conversationId: activeConversationId });
    setTypingUsers(new Set()); // Reset typing state on room change
    
    // Mark as read when entering
    socket.emit("mark_read", { conversationId: activeConversationId });
    
    return () => {
      socket.emit("leave_conversation", { conversationId: activeConversationId });
    };
  }, [socket, activeConversationId]);
  
  // Real-time events
  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (payload: NewMessageEvent) => {
      const targetConvId = payload.conversationId || payload.message.conversation_id;
      // Play sound if message is not in the active conversation, or if window is hidden
      if (targetConvId !== activeConversationId || document.hidden) {
        // Assume notify sound plays
        playNotificationSound();
      }
      
      // Update messages list if this conversation is loaded
      queryClient.setQueryData(["messages", targetConvId], (old: any) => {
        if (!old) return old;
        const newPages = [...old.pages];
        if (newPages.length > 0) {
          // Prevent doubling if message already exists (from optimistic UI + message_sent)
          const alreadyExists = newPages.some(page => page.messages.some((m: MessagePayload) => m.id === payload.message.id));
          if (!alreadyExists) {
            // Prepend to first page
            newPages[0] = {
              ...newPages[0],
              messages: [payload.message, ...newPages[0].messages]
            };
          }
        }
        return { ...old, pages: newPages };
      });
      
      // Mark as read immediately if we are in this conversation and window is active
      if (targetConvId === activeConversationId && !document.hidden) {
        socket.emit("mark_read", { conversationId: activeConversationId });
      }
    };
    
    const handleMessageSent = (payload: MessageSentEvent) => {
      queryClient.setQueryData(["messages", payload.message.conversation_id], (old: any) => {
        if (!old) return old;
        const newPages = old.pages.map((page: any) => ({
          ...page,
          messages: page.messages.map((m: MessagePayload) => 
            m.tempId === payload.tempId ? payload.message : m
          )
        }));
        return { ...old, pages: newPages };
      });
    };
    
    const handleMessageDelivered = (payload: MessageDeliveredEvent) => {
      queryClient.setQueryData(["messages", payload.conversationId], (old: any) => {
        if (!old) return old;
        const newPages = old.pages.map((page: any) => ({
          ...page,
          messages: page.messages.map((m: MessagePayload) => 
            m.id === payload.messageId && m.delivery_status !== "seen" 
              ? { ...m, delivery_status: "delivered" as const } 
              : m
          )
        }));
        return { ...old, pages: newPages };
      });
    };
    
    const handleMessageSeen = (payload: MessageSeenEvent) => {
      queryClient.setQueryData(["messages", payload.conversationId], (old: any) => {
        if (!old) return old;
        const newPages = old.pages.map((page: any) => ({
          ...page,
          messages: page.messages.map((m: MessagePayload) => 
            m.delivery_status !== "seen"
              ? { ...m, delivery_status: "seen" as const } 
              : m
          ) // Marking all previously unseen messages as seen
        }));
        return { ...old, pages: newPages };
      });
    };
    
    const handleTyping = (payload: TypingEvent) => {
      if (payload.conversationId !== activeConversationId) return;
      if (payload.userId === user?.id) return; // Ignore our own typing events
      
      setTypingUsers(prev => {
        const next = new Set(prev);
        if (payload.isTyping) next.add(payload.userId);
        else next.delete(payload.userId);
        return next;
      });
    };
    
    socket.on("new_message", handleNewMessage);
    socket.on("message_sent", handleMessageSent);
    socket.on("message_delivered", handleMessageDelivered);
    socket.on("message_seen", handleMessageSeen);
    socket.on("typing", handleTyping);
    
    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_sent", handleMessageSent);
      socket.off("message_delivered", handleMessageDelivered);
      socket.off("message_seen", handleMessageSeen);
      socket.off("typing", handleTyping);
    };
  }, [socket, activeConversationId, queryClient, user?.id]);
  
  // Actions
  const sendMessage = useCallback((content: string, mediaUrl?: string, replyToId?: string) => {
    if (!socket || !activeConversationId || !user) return;
    
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const optimisticMessage: MessagePayload = {
      id: tempId,
      conversation_id: activeConversationId,
      sender: {
        id: user.id,
        name: user.name || "Me",
        profile_picture_url: (user as any).profile_picture_url || null,
      },
      content: content || null,
      message_type: "text",
      media_url: mediaUrl || null,
      delivery_status: "sending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tempId
    };
    
    // Add optimistic message to UI
    queryClient.setQueryData(["messages", activeConversationId], (old: any) => {
      if (!old) return { pages: [{ messages: [optimisticMessage], nextCursor: null, hasMore: false }], pageParams: [null] };
      
      const newPages = [...old.pages];
      if (newPages.length > 0) {
        newPages[0] = {
          ...newPages[0],
          messages: [optimisticMessage, ...newPages[0].messages]
        };
      }
      return { ...old, pages: newPages };
    });
    
    // Send to server
    socket.emit("send_message", {
      conversationId: activeConversationId,
      content,
      mediaUrl,
      replyToId,
      tempId
    });
    
  }, [socket, activeConversationId, queryClient, user]);
  
  // Add debounced typing status
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const notifyTyping = useCallback(() => {
    if (!socket || !activeConversationId) return;
    
    socket.emit("typing_start", { conversationId: activeConversationId });
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing_stop", { conversationId: activeConversationId });
    }, 3000);
  }, [socket, activeConversationId]);
  
  return {
    sendMessage,
    notifyTyping,
    typingUsers
  };
}
