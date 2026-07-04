import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, MoreVertical, Flag, User as UserIcon, ShieldOff, Trash2, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSocket } from "@/contexts/SocketContext";
import { ConversationPayload, MessagePayload } from "@/lib/types/messaging";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { useMessages, useChat, useDeleteConversation } from "@/hooks/useMessaging";
import { Loader2 } from "lucide-react";

interface ChatViewProps {
  conversation: ConversationPayload | null;
  onBack: () => void;
  onViewProfile: (userId: string) => void;
}

export function ChatView({ conversation, onBack, onViewProfile }: ChatViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { isUserOnline, getUserLastSeen } = useSocket();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMessages(conversation?.id || null);
  const { sendMessage, notifyTyping, typingUsers } = useChat(conversation?.id || null);
  const { mutate: deleteConversation, isPending: isDeleting } = useDeleteConversation();

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom on first load or new message (we're keeping it simple for now)
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.pages[0]?.messages.length]);
  
  // Handle auto-sending initial message from profile card
  const initialMessage = searchParams.get("message");
  useEffect(() => {
    if (initialMessage && conversation?.id && sendMessage) {
      sendMessage(initialMessage);
      // Clear the message from URL to prevent re-sending on refresh
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("message");
      setSearchParams(newParams, { replace: true });
    }
  }, [conversation?.id, initialMessage, sendMessage, setSearchParams, searchParams]);

  if (!conversation) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-rose-50/50 via-white to-pink-50/50 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl" />
        
        <div className="text-center space-y-6 relative z-10 animate-fade-in max-w-md px-6">
          <div className="relative inline-block">
            <div className="absolute -inset-2 bg-gradient-to-r from-rose-400 to-pink-500 rounded-full blur opacity-30 animate-pulse"></div>
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center mx-auto shadow-xl ring-8 ring-white">
              <MessageCircle className="h-12 w-12 text-rose-500" />
            </div>
            <div className="absolute -top-3 -right-3 animate-bounce" style={{ animationDuration: '2s' }}>
              <Sparkles className="w-8 h-8 text-yellow-400 fill-yellow-400/20" />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Your Messaging Board
            </h3>
            <p className="text-gray-500 text-[15px] leading-relaxed mx-auto max-w-[280px]">
              Dive into conversations! Select a chat from the sidebar to connect with potential flatmates.
            </p>
          </div>
          <div className="pt-4 flex justify-center gap-2 text-sm text-gray-400">
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
              <ShieldOff className="w-3.5 h-3.5" /> End-to-end secure
            </span>
          </div>
        </div>
      </div>
    );
  }

  const otherParticipant = conversation.other_user;
  const isOnline = otherParticipant ? isUserOnline(otherParticipant.id) : false;
  const lastSeen = otherParticipant ? getUserLastSeen(otherParticipant.id) : null;
  const isTyping = otherParticipant ? typingUsers.has(otherParticipant.id) : false;

  const messages = data?.pages.flatMap((page: any) => page.messages).reverse() || [];

  // Group messages by date
  const groupedMessages = messages.reduce<Record<string, MessagePayload[]>>((groups, message) => {
    const date = new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }).format(new Date(message.created_at));
    
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className={cn("flex-1 flex flex-col h-full bg-background")}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3 bg-card/90 backdrop-blur-sm shadow-sm">
        <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div
          className="flex items-center gap-3 flex-1 cursor-pointer group"
          onClick={() => otherParticipant && onViewProfile(otherParticipant.id)}
        >
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm group-hover:ring-primary/30 transition-all">
              <AvatarImage src={otherParticipant?.profile_picture_url || undefined} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                {otherParticipant?.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-card" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
              {otherParticipant?.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isTyping ? (
                <span className="text-primary font-medium">typing...</span>
              ) : isOnline ? (
                <span className="text-emerald-500">Online</span>
              ) : (
                lastSeen ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(lastSeen)) : "Offline"
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 transition-all">
                <MoreVertical className="h-4.5 w-4.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-border/50">
              <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => otherParticipant && onViewProfile(otherParticipant.id)}>
                <UserIcon className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg cursor-pointer">
                <ShieldOff className="h-4 w-4 mr-2" />
                Block User
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive focus:text-destructive">
                <Flag className="h-4 w-4 mr-2" />
                Report User
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="rounded-lg cursor-pointer text-destructive focus:text-destructive"
                onClick={() => {
                  deleteConversation(conversation.id);
                  onBack();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea 
        className="flex-1 bg-gradient-to-b from-muted/10 to-muted/5" 
        onScrollCapture={handleScroll}
        ref={scrollRef}
      >
        <div className="px-4 py-4 max-w-3xl mx-auto space-y-1">
          {isLoading && (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
          
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="flex items-center justify-center my-4">
                <span className="px-3 py-1 bg-muted/60 text-muted-foreground text-[11px] font-medium rounded-full shadow-sm backdrop-blur-sm">
                  {date}
                </span>
              </div>
              <div className="space-y-1">
                {(msgs as MessagePayload[]).map((message, index) => {
                  const prevMsg = index > 0 ? (msgs as MessagePayload[])[index - 1] : null;
                  const nextMsg = index < (msgs as MessagePayload[]).length - 1 ? (msgs as MessagePayload[])[index + 1] : null;
                  const isFirstInGroup = !prevMsg || prevMsg.sender.id !== message.sender.id;
                  const isLastInGroup = !nextMsg || nextMsg.sender.id !== message.sender.id;
                  
                  return (
                    <MessageBubble 
                      key={message.id || message.tempId}
                      message={message}
                      isSentByMe={message.sender.id === user?.id}
                      isFirstInGroup={isFirstInGroup}
                      isLastInGroup={isLastInGroup}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start mb-2">
              <div className="bg-card border border-border/30 rounded-2xl rounded-bl-md shadow-sm">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput onSendMessage={sendMessage} onTyping={notifyTyping} isLoading={isDeleting} />
    </div>
  );
}
