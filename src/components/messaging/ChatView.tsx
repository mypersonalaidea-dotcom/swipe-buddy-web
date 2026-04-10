import { useEffect, useRef } from "react";
import { ArrowLeft, MoreVertical, Flag, User as UserIcon, ShieldOff, Trash2 } from "lucide-react";
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

  if (!conversation) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-b from-muted/10 to-muted/5">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto shadow-inner">
            <UserIcon className="h-9 w-9 text-primary/60" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-foreground">Your Messages</h3>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-sm">
              Select a conversation to start chatting
            </p>
          </div>
        </div>
      </div>
    );
  }

  const otherParticipant = conversation.participants.find(p => p.userId !== user?.id);
  const isOnline = otherParticipant ? isUserOnline(otherParticipant.userId) : false;
  const lastSeen = otherParticipant ? getUserLastSeen(otherParticipant.userId) : null;
  const isTyping = otherParticipant ? typingUsers.has(otherParticipant.userId) : false;

  const messages = data?.pages.flatMap((page: any) => page.messages).reverse() || [];

  // Group messages by date
  const groupedMessages = messages.reduce<Record<string, MessagePayload[]>>((groups, message) => {
    const date = new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric",
    }).format(new Date(message.createdAt));
    
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
          onClick={() => otherParticipant && onViewProfile(otherParticipant.userId)}
        >
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm group-hover:ring-primary/30 transition-all">
              <AvatarImage src={otherParticipant?.profilePictureUrl || undefined} className="object-cover" />
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
              <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => otherParticipant && onViewProfile(otherParticipant.userId)}>
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
                  const isFirstInGroup = !prevMsg || prevMsg.senderId !== message.senderId;
                  const isLastInGroup = !nextMsg || nextMsg.senderId !== message.senderId;
                  
                  return (
                    <MessageBubble 
                      key={message.id || message.tempId}
                      message={message}
                      isSentByMe={message.senderId === user?.id}
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
