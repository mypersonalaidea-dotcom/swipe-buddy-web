import { Search, Filter, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationPayload } from "@/lib/types/messaging";
import { useSocket } from "@/contexts/SocketContext";

type FilterType = "all" | "unread";
const filterOptions: { id: FilterType; label: string }[] = [
  { id: "all", label: "All Messages" },
  { id: "unread", label: "Unread" },
];

interface ConversationListProps {
  conversations: ConversationPayload[];
  selectedId: string | null;
  onSelect: (id: string, participantId: string | null) => void;
  typingUsersByConv: Map<string, Set<string>>;
}

export function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect,
  typingUsersByConv
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const { user } = useAuth();
  const { isUserOnline } = useSocket();

  const filteredConversations = conversations.filter(conv => {
    const participant = conv.other_user;
    if (!participant) return false;
    
    const matchesSearch = participant.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeFilter === "unread") return conv.unread_count > 0;
    
    return true;
  });

  return (
    <div className={cn(
      "w-full md:w-[380px] border-r border-border/50 flex flex-col bg-card/80 backdrop-blur-sm h-full",
      selectedId && "hidden md:flex"
    )}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Messages
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-primary/10 transition-all">
                <Filter className="h-4 w-4" />
                <span className="text-sm">{filterOptions.find(f => f.id === activeFilter)?.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl shadow-lg border-border/50">
              {filterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  onClick={() => setActiveFilter(option.id)}
                  className={cn(
                    "rounded-lg cursor-pointer transition-colors",
                    activeFilter === option.id && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-10 bg-muted/30 border-border/30 rounded-xl focus-visible:ring-primary/30 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const otherParticipant = conversation.other_user;
              if (!otherParticipant) return null;
              
              const isOnline = isUserOnline(otherParticipant.id);
              const isTyping = typingUsersByConv.get(conversation.id)?.has(otherParticipant.id);
              
              // Formatting time
              const lastActivity = conversation.last_message_at || conversation.created_at;
              const timeDisplay = new Intl.DateTimeFormat("en-US", {
                hour: "numeric", minute: "2-digit", hour12: true
              }).format(new Date(lastActivity));

              const isInitiatedByMe = conversation.last_message?.sender_id === user?.id;

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 border-l-3 border-transparent",
                    selectedId === conversation.id
                      ? "bg-primary/8 border-l-primary"
                      : "hover:bg-muted/40"
                  )}
                  onClick={() => onSelect(conversation.id, otherParticipant.id)}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                      <AvatarImage src={otherParticipant.profile_picture_url || undefined} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                        {otherParticipant.name.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-card shadow-sm" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "font-semibold text-sm truncate",
                        conversation.unread_count > 0 ? "text-foreground" : "text-foreground/80"
                      )}>
                        {otherParticipant.name}
                      </span>
                      <span className={cn(
                        "text-[11px] shrink-0 ml-2",
                        conversation.unread_count > 0 ? "text-primary font-medium" : "text-muted-foreground"
                      )}>
                        {timeDisplay}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {isInitiatedByMe && conversation.last_message && (
                          <CheckCheck className={cn(
                            "w-3.5 h-3.5 shrink-0",
                            conversation.last_message.delivery_status === "seen" ? "text-blue-400" : "text-muted-foreground/50"
                          )} />
                        )}
                        <p className={cn(
                          "text-sm truncate",
                          conversation.unread_count > 0
                            ? "text-foreground/70 font-medium"
                            : "text-muted-foreground"
                        )}>
                          {isTyping ? (
                            <span className="text-primary italic">typing...</span>
                          ) : conversation.last_message ? (
                            // Wait, wait! `message_type === 'image'` should probably be checked, but we have `last_message.content`
                            // We don't have `media_url` on `last_message` per backend payload, but we have `message_type`
                            conversation.last_message.message_type === 'image' ? "Sent an image" : conversation.last_message.content
                          ) : "Start chatting"}
                        </p>
                      </div>
                      
                      {conversation.unread_count > 0 && conversation.last_message?.sender_id !== user?.id && (
                        <span className="ml-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-sm shrink-0">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
