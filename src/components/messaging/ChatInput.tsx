import { useState, useRef } from "react";
import { Send, Smile, Image as ImageIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (content: string, mediaUrl?: string) => void;
  onTyping: () => void;
  isLoading?: boolean;
}

export function ChatInput({ onSendMessage, onTyping, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Future: simple state for media placeholder hook
  // const [mediaFile, setMediaFile] = useState<File | null>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim()); // In future update params here for media
      setMessage("");
      
      // Auto-grow reset workaround
      if (inputRef.current) {
        inputRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onTyping();
    }
  };

  const handleMediaUploadClick = () => {
    // Media upload will be integrated here (e.g., using Cloudinary utility or existing MediaUpload component)
    alert("Media upload coming in next step!");
  };

  return (
    <div className="px-3 py-3 border-t border-border/50 bg-card/90 backdrop-blur-sm">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <div className="flex gap-0.5">
          <Button variant="ghost" size="icon" className="shrink-0 rounded-full hover:bg-primary/10 h-9 w-9 transition-all">
            <Smile className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleMediaUploadClick}
            className="shrink-0 rounded-full hover:bg-primary/10 h-9 w-9 transition-all"
          >
            <ImageIcon className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          </Button>
        </div>
        
        <Textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[120px] resize-none bg-muted/20 border-border/30 rounded-xl focus-visible:ring-primary/30 text-sm transition-all"
          rows={1}
          autoFocus
        />
        
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className={cn(
            "shrink-0 rounded-full h-9 w-9 transition-all duration-200 shadow-sm",
            message.trim()
              ? "bg-primary hover:bg-primary/90 text-primary-foreground scale-100"
              : "bg-muted text-muted-foreground scale-95"
          )}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
