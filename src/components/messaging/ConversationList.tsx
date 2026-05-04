import { Search, Filter, CheckCheck, Pin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useState, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationPayload } from "@/lib/types/messaging";
import { useSocket } from "@/contexts/SocketContext";

type FilterType = "all" | "unread" | "pinned";

const formatChatTime = (dateStr: string | null | undefined) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) return `${diffInSeconds}s`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  if (diffInHours < 48) return "Yesterday";
  
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (diffInHours < 24 * 7) return days[date.getDay()];
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ── SUB-COMPONENTS ──────────────────────────────────────────────────────────

const FilterChip = ({ 
  label, 
  active, 
  count, 
  onClick 
}: { 
  label: string; 
  active: boolean; 
  count?: number; 
  onClick: () => void; 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all shrink-0",
      active 
        ? "bg-[#E11D48] text-white shadow-sm" 
        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
    )}
  >
    {label}
    {count !== undefined && count > 0 && (
      <span className={cn(
        "flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
        active ? "bg-white text-[#E11D48]" : "bg-[#E11D48] text-white"
      )}>
        {count}
      </span>
    )}
  </button>
);

const ConversationCard = memo(({ 
  conversation, 
  selected, 
  onSelect, 
  isOnline, 
  isTyping, 
  user 
}: { 
  conversation: ConversationPayload; 
  selected: boolean; 
  onSelect: (id: string, pId: string) => void;
  isOnline: boolean;
  isTyping?: boolean;
  user: any;
}) => {
  const otherParticipant = conversation.other_user;
  if (!otherParticipant) return null;

  const lastActivity = conversation.last_message?.created_at || conversation.last_message_at || conversation.created_at;
  const timeDisplay = formatChatTime(lastActivity);
  const isInitiatedByMe = conversation.last_message?.sender_id === user?.id;

  return (
    <div
      onClick={() => onSelect(conversation.id, otherParticipant.id)}
      className={cn(
        "group relative flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-all mx-1.5 rounded-2xl mb-0.5",
        selected 
          ? "bg-rose-50/60" 
          : "hover:bg-gray-50"
      )}
    >
      {/* Selected State Left Bar */}
      {selected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#E11D48] rounded-r-full" />
      )}

      {/* Avatar Section */}
      <div className="relative shrink-0">
        <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
          <AvatarImage src={otherParticipant.profile_picture_url || undefined} className="object-cover" />
          <AvatarFallback className="bg-rose-100 text-[#E11D48] font-bold text-xs">
            {otherParticipant.name.split(" ").map(n => n[0]).join("")}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
        )}
      </div>

      {/* Content Section */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {/* Row 1: Name + Time — using grid for guaranteed column sizing */}
        <div className="grid grid-cols-[1fr_auto] items-baseline gap-2">
          <h4 className={cn(
            "font-bold text-[15px] truncate",
            conversation.unread_count > 0 ? "text-gray-900" : "text-gray-800"
          )}>
            {otherParticipant.name}
          </h4>
          <span className={cn(
            "text-[11px] font-medium whitespace-nowrap",
            conversation.unread_count > 0 ? "text-[#E11D48]" : "text-gray-400"
          )}>
            {timeDisplay}
          </span>
        </div>

        {/* Row 2: Message Preview + Badge */}
        <div className="grid grid-cols-[1fr_auto] items-center gap-2 mt-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {isInitiatedByMe && conversation.last_message && (
              <CheckCheck className={cn(
                "w-3.5 h-3.5 shrink-0",
                conversation.last_message.delivery_status === "seen" ? "text-blue-500" : "text-gray-300"
              )} />
            )}
            <p className={cn(
              "text-[13px] truncate",
              conversation.unread_count > 0 ? "text-gray-700 font-medium" : "text-gray-500"
            )}>
              {isTyping ? (
                <span className="text-[#E11D48] italic">typing...</span>
              ) : conversation.last_message ? (
                conversation.last_message.message_type === 'image' ? "Sent an image" : conversation.last_message.content
              ) : "Start chatting"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {conversation.muted && <Pin className="w-3 h-3 text-gray-300 rotate-45" />}
            {conversation.unread_count > 0 && (
              <span className="bg-[#E11D48] text-white text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-sm">
                {conversation.unread_count}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

ConversationCard.displayName = "ConversationCard";

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────

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

  const unreadTotal = conversations.reduce((acc, conv) => acc + conv.unread_count, 0);

  const filteredConversations = conversations.filter(conv => {
    const participant = conv.other_user;
    if (!participant) return false;
    
    const matchesSearch = participant.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (activeFilter === "unread") return conv.unread_count > 0;
    if (activeFilter === "pinned") return conv.muted; // Assuming muted/pinned logic for now
    
    return true;
  });

  return (
    <div className={cn(
      "w-full md:w-[320px] border-r border-gray-100 flex flex-col bg-white h-full shadow-sm",
      selectedId && "hidden md:flex"
    )}>
      {/* Search Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="relative mb-5">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="h-4.5 w-4.5" />
          </div>
          <Input
            placeholder="Search conversations..."
            className="h-11 pl-11 pr-4 bg-gray-50/50 border-gray-100 rounded-full text-[15px] focus-visible:ring-rose-100 transition-all placeholder:text-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Section */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-2">
            <FilterChip 
              label="All" 
              active={activeFilter === "all"} 
              onClick={() => setActiveFilter("all")} 
            />
            <FilterChip 
              label="Unread" 
              active={activeFilter === "unread"} 
              count={unreadTotal}
              onClick={() => setActiveFilter("unread")} 
            />
            <FilterChip 
              label="Pinned" 
              active={activeFilter === "pinned"} 
              onClick={() => setActiveFilter("pinned")} 
            />
          </div>
          <Button variant="ghost" size="icon" className="rounded-full text-gray-400 hover:text-gray-600 shrink-0">
            <Filter className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="py-2">
          {filteredConversations.length === 0 ? (
            <div className="px-10 py-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 text-gray-300 mb-4">
                <Search className="h-8 w-8" />
              </div>
              <p className="text-gray-500 font-medium">No conversations found</p>
              <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationCard 
                key={conversation.id}
                conversation={conversation}
                selected={selectedId === conversation.id}
                onSelect={onSelect}
                isOnline={isUserOnline(conversation.other_user?.id || "")}
                isTyping={typingUsersByConv.get(conversation.id)?.has(conversation.other_user?.id || "")}
                user={user}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
