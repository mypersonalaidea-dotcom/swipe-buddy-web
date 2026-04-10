import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ConversationList } from "@/components/messaging/ConversationList";
import { ChatView } from "@/components/messaging/ChatView";
import { useConversations, useStartConversation, useChat } from "@/hooks/useMessaging";
import { ConversationPayload } from "@/lib/types/messaging";
import { Loader2 } from "lucide-react";

export const MessagePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const { data: conversations, isLoading: isLoadingConversations } = useConversations();
  const { mutate: startConversation, isPending: startingConversation } = useStartConversation();
  
  const selectedConversationId = searchParams.get("conversation");
  const targetUserId = searchParams.get("newChat"); // Requesting to chat with specific user
  
  // Track all typing status locally to pass to list view. `useChat` hook handles tracking for active window.
  const [globalTypingTracker, setGlobalTypingTracker] = useState<Map<string, Set<string>>>(new Map());
  
  const activeConversation = conversations?.find((c: ConversationPayload) => c.id === selectedConversationId) || null;

  useEffect(() => {
    if (targetUserId) {
      // User clicked "Message" on someone's profile
      startConversation(targetUserId, {
        onSuccess: (conversation) => {
          setSearchParams({ activeView: "messages", conversation: conversation.id });
        },
        onError: () => {
          setSearchParams({ activeView: "messages" }); // Clear newChat on error to unblock UI
        }
      });
    }
  }, [targetUserId, startConversation, setSearchParams]);

  const handleSelectConversation = (id: string) => {
    setSearchParams({ activeView: "messages", conversation: id });
  };

  const handleBackToList = () => {
    setSearchParams({ activeView: "messages" });
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/dashboard?profile=${userId}`);
  };

  if (isLoadingConversations || startingConversation) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      <ConversationList 
        conversations={conversations || []}
        selectedId={selectedConversationId}
        onSelect={handleSelectConversation}
        typingUsersByConv={globalTypingTracker}
      />
      <ChatView 
        conversation={activeConversation}
        onBack={handleBackToList}
        onViewProfile={handleViewProfile}
      />
    </div>
  );
};
