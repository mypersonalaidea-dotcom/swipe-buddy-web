import { useState, useRef, useEffect } from "react";
import { Send, Smile, Image as ImageIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { createPortal } from "react-dom";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface ChatInputProps {
  onSendMessage: (content: string, mediaUrl?: string) => void;
  onTyping: () => void;
  isLoading?: boolean;
}

export function ChatInput({ onSendMessage, onTyping, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiBtnRef = useRef<HTMLButtonElement>(null);

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        emojiPickerRef.current && !emojiPickerRef.current.contains(target) &&
        emojiBtnRef.current && !emojiBtnRef.current.contains(target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    if (showEmojiPicker) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojiPicker]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage("");
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
    alert("Media upload coming in next step!");
  };

  return (
    <div className="px-4 py-3">
      <div
        className="flex items-end gap-2 max-w-3xl mx-auto rounded-2xl px-3 py-2"
        style={{
          background: 'rgba(255, 255, 255, 0.55)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 4px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.7)',
        }}
      >
        <div className="flex gap-0.5 relative">
          <Button
            ref={emojiBtnRef}
            variant="ghost"
            size="icon"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="shrink-0 rounded-full h-9 w-9 transition-all hover:bg-rose-50 group"
          >
            <Smile className="h-5 w-5 text-gray-400 group-hover:text-rose-500 transition-colors" />
          </Button>
          {showEmojiPicker && createPortal(
            <div
              ref={emojiPickerRef}
              className="fixed z-[9999] shadow-xl rounded-xl overflow-hidden bg-white border border-gray-200"
              style={{
                bottom: (window.innerHeight - (emojiBtnRef.current?.getBoundingClientRect().top ?? 0)) + 8,
                left: Math.max(8, (emojiBtnRef.current?.getBoundingClientRect().left ?? 0)),
              }}
            >
              <Picker
                data={data}
                onEmojiSelect={(emoji: any) => {
                  setMessage((prev) => prev + emoji.native);
                  setShowEmojiPicker(false);
                  inputRef.current?.focus();
                }}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
                set="native"
              />
            </div>,
            document.body
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleMediaUploadClick}
            className="shrink-0 rounded-full h-9 w-9 transition-all hover:bg-rose-50 group"
          >
            <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-rose-500 transition-colors" />
          </Button>
        </div>
        
        <Textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[120px] resize-none rounded-xl text-sm transition-all bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-400"
          rows={1}
          autoFocus
        />
        
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className={cn(
            "shrink-0 rounded-full h-9 w-9 transition-all duration-300",
            message.trim()
              ? "bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white scale-100 shadow-md shadow-rose-200/40"
              : "bg-gray-100/60 text-gray-300 scale-95 hover:bg-gray-100"
          )}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
