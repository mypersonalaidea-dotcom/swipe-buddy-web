import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MoreVertical, Paperclip, Smile, Send, ArrowLeft, Filter, Check, CheckCheck, Clock, Image as ImageIcon, Flag, User, ShieldOff, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type FilterType = "all" | "sent-first" | "received-first";
type MessageStatus = "sending" | "sent" | "delivered" | "read";

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  initiatedByMe: boolean;
  profileId?: string;
  typing?: boolean;
  lastSeen?: string;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  sent: boolean;
  status: MessageStatus;
  date: string; // for grouping: "Today", "Yesterday", etc.
  replyTo?: string;
}

const mockConversations: Conversation[] = [
  { id: "1", name: "Priya Sharma", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", lastMessage: "Hey! Is the room still available?", timestamp: "10:30 AM", unread: 2, online: true, initiatedByMe: false, profileId: "1", typing: true, lastSeen: "Online" },
  { id: "2", name: "Rahul Verma", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", lastMessage: "Sure, let's meet tomorrow", timestamp: "9:15 AM", unread: 0, online: false, initiatedByMe: true, profileId: "2", lastSeen: "Last seen 2h ago" },
  { id: "3", name: "Ananya Patel", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", lastMessage: "The flat looks great!", timestamp: "Yesterday", unread: 0, online: true, initiatedByMe: false, profileId: "3", lastSeen: "Online" },
  { id: "4", name: "Vikram Singh", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face", lastMessage: "What's the rent?", timestamp: "Yesterday", unread: 1, online: false, initiatedByMe: true, profileId: "4", lastSeen: "Last seen yesterday" },
  { id: "5", name: "Neha Gupta", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face", lastMessage: "Thanks for the info", timestamp: "Monday", unread: 0, online: false, initiatedByMe: true, profileId: "5", lastSeen: "Last seen 3d ago" },
  { id: "6", name: "Arjun Reddy", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", lastMessage: "I'm interested in the 2BHK", timestamp: "Monday", unread: 0, online: true, initiatedByMe: false, profileId: "6", lastSeen: "Online" },
];

const filterOptions: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sent-first", label: "You messaged first" },
  { id: "received-first", label: "They messaged first" },
];

const mockMessages: Message[] = [
  { id: "1", content: "Hey! I saw your listing for the flat in Koramangala", timestamp: "10:00 AM", sent: false, status: "read", date: "Today" },
  { id: "2", content: "Hi! Yes, it's still available. Are you looking for a room?", timestamp: "10:05 AM", sent: true, status: "read", date: "Today" },
  { id: "3", content: "Yes, I'm looking for a private room. Is the one you listed still open?", timestamp: "10:10 AM", sent: false, status: "read", date: "Today" },
  { id: "4", content: "Yes it is! It's a fully furnished room with attached bathroom. Rent is ₹15,000 per month including maintenance.", timestamp: "10:15 AM", sent: true, status: "read", date: "Today" },
  { id: "5", content: "That sounds perfect! Can I visit this weekend?", timestamp: "10:20 AM", sent: false, status: "read", date: "Today" },
  { id: "6", content: "Sure! Saturday afternoon works for me. I'll share the exact location.", timestamp: "10:25 AM", sent: true, status: "delivered", date: "Today" },
  { id: "7", content: "Hey! Is the room still available?", timestamp: "10:30 AM", sent: false, status: "read", date: "Today" },
];

// Status icon component
const MessageStatusIcon = ({ status, className }: { status: MessageStatus; className?: string }) => {
  switch (status) {
    case "sending":
      return <Clock className={cn("w-3.5 h-3.5", className)} />;
    case "sent":
      return <Check className={cn("w-3.5 h-3.5", className)} />;
    case "delivered":
      return <CheckCheck className={cn("w-3.5 h-3.5", className)} />;
    case "read":
      return <CheckCheck className={cn("w-3.5 h-3.5 text-blue-400", className)} />;
    default:
      return null;
  }
};

// Typing indicator component
const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-3 py-2">
    <div className="flex gap-1">
      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
    </div>
    <span className="text-xs text-muted-foreground ml-1">typing</span>
  </div>
);

export const MessagePage = () => {
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on message changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation]);

  const handleViewProfile = (profileId?: string) => {
    if (profileId) {
      navigate(`/dashboard?profile=${profileId}`);
    }
  };

  const filteredConversations = mockConversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === "sent-first") return conv.initiatedByMe;
    if (activeFilter === "received-first") return !conv.initiatedByMe;
    return true;
  });

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      setMessageInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Group messages by date
  const groupedMessages = mockMessages.reduce<Record<string, Message[]>>((groups, message) => {
    const date = message.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="h-screen flex bg-background">
      {/* Conversations Sidebar */}
      <div className={cn(
        "w-full md:w-[380px] border-r border-border/50 flex flex-col bg-card/80 backdrop-blur-sm",
        selectedConversation && "hidden md:flex"
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
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 border-l-3 border-transparent",
                  selectedConversation?.id === conversation.id
                    ? "bg-primary/8 border-l-primary"
                    : "hover:bg-muted/40"
                )}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm">
                    <AvatarImage src={conversation.avatar} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                      {conversation.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.online && (
                    <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-card shadow-sm" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "font-semibold text-sm truncate",
                      conversation.unread > 0 ? "text-foreground" : "text-foreground/80"
                    )}>
                      {conversation.name}
                    </span>
                    <span className={cn(
                      "text-[11px] shrink-0 ml-2",
                      conversation.unread > 0 ? "text-primary font-medium" : "text-muted-foreground"
                    )}>
                      {conversation.timestamp}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      {conversation.initiatedByMe && (
                        <CheckCheck className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          conversation.unread === 0 ? "text-blue-400" : "text-muted-foreground/50"
                        )} />
                      )}
                      <p className={cn(
                        "text-sm truncate",
                        conversation.unread > 0
                          ? "text-foreground/70 font-medium"
                          : "text-muted-foreground"
                      )}>
                        {conversation.typing ? (
                          <span className="text-primary italic">typing...</span>
                        ) : (
                          conversation.lastMessage
                        )}
                      </p>
                    </div>
                    {conversation.unread > 0 && (
                      <span className="ml-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-sm shrink-0">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !selectedConversation && "hidden md:flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3 bg-card/90 backdrop-blur-sm shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden rounded-full"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer group"
                onClick={() => handleViewProfile(selectedConversation.profileId)}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm group-hover:ring-primary/30 transition-all">
                    <AvatarImage src={selectedConversation.avatar} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-semibold">
                      {selectedConversation.name.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConversation.online && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border-2 border-card" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                    {selectedConversation.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.typing ? (
                      <span className="text-primary font-medium">typing...</span>
                    ) : selectedConversation.online ? (
                      <span className="text-emerald-500">Online</span>
                    ) : (
                      selectedConversation.lastSeen || "Last seen recently"
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
                    <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => handleViewProfile(selectedConversation.profileId)}>
                      <User className="h-4 w-4 mr-2" />
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
                    <DropdownMenuItem className="rounded-lg cursor-pointer text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 bg-gradient-to-b from-muted/10 to-muted/5">
              <div className="px-4 py-4 max-w-3xl mx-auto space-y-1">
                {Object.entries(groupedMessages).map(([date, messages]) => (
                  <div key={date}>
                    {/* Date Separator */}
                    <div className="flex items-center justify-center my-4">
                      <span className="px-3 py-1 bg-muted/60 text-muted-foreground text-[11px] font-medium rounded-full shadow-sm backdrop-blur-sm">
                        {date}
                      </span>
                    </div>

                    {/* Messages for this date */}
                    <div className="space-y-1">
                      {messages.map((message, index) => {
                        const prevMessage = index > 0 ? messages[index - 1] : null;
                        const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;
                        const isFirstInGroup = !prevMessage || prevMessage.sent !== message.sent;
                        const isLastInGroup = !nextMessage || nextMessage.sent !== message.sent;

                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              message.sent ? "justify-end" : "justify-start",
                              isLastInGroup ? "mb-3" : "mb-0.5"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[75%] sm:max-w-[65%] px-3 py-2 shadow-sm relative group transition-all",
                                message.sent
                                  ? cn(
                                    "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground",
                                    isFirstInGroup && isLastInGroup && "rounded-2xl rounded-br-md",
                                    isFirstInGroup && !isLastInGroup && "rounded-2xl rounded-br-md",
                                    !isFirstInGroup && isLastInGroup && "rounded-2xl rounded-tr-md rounded-br-md",
                                    !isFirstInGroup && !isLastInGroup && "rounded-xl rounded-r-md",
                                  )
                                  : cn(
                                    "bg-card text-card-foreground border border-border/30",
                                    isFirstInGroup && isLastInGroup && "rounded-2xl rounded-bl-md",
                                    isFirstInGroup && !isLastInGroup && "rounded-2xl rounded-bl-md",
                                    !isFirstInGroup && isLastInGroup && "rounded-2xl rounded-tl-md rounded-bl-md",
                                    !isFirstInGroup && !isLastInGroup && "rounded-xl rounded-l-md",
                                  )
                              )}
                            >
                              <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                              <div className={cn(
                                "flex items-center justify-end gap-1 mt-1 -mb-0.5",
                                message.sent ? "text-primary-foreground/60" : "text-muted-foreground"
                              )}>
                                <span className="text-[10px]">
                                  {message.timestamp}
                                </span>
                                {message.sent && (
                                  <MessageStatusIcon status={message.status} />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {selectedConversation.typing && (
                  <div className="flex justify-start mb-2">
                    <div className="bg-card border border-border/30 rounded-2xl rounded-bl-md shadow-sm">
                      <TypingIndicator />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="px-3 py-3 border-t border-border/50 bg-card/90 backdrop-blur-sm">
              <div className="flex items-end gap-2 max-w-3xl mx-auto">
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-primary/10 h-9 w-9 transition-all">
                    <Smile className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                  <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-primary/10 h-9 w-9 transition-all">
                    <Paperclip className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                  <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-primary/10 h-9 w-9 transition-all">
                    <ImageIcon className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  </Button>
                </div>
                <Textarea
                  placeholder="Type a message..."
                  className="min-h-[40px] max-h-[120px] resize-none bg-muted/20 border-border/30 rounded-xl focus-visible:ring-primary/30 text-sm transition-all"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  rows={1}
                />
                <Button
                  size="icon"
                  className={cn(
                    "shrink-0 rounded-full h-9 w-9 transition-all duration-200 shadow-sm",
                    messageInput.trim()
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground scale-100"
                      : "bg-muted text-muted-foreground scale-95"
                  )}
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-muted/10 to-muted/5">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto shadow-inner">
                <Send className="h-9 w-9 text-primary/60" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">Your Messages</h3>
                <p className="text-muted-foreground text-sm mt-1.5 max-w-sm">
                  Select a conversation to start chatting with your potential flatmates
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
