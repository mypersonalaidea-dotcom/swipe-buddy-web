import { useState, useRef, useEffect } from "react";
import { Send, Smile, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface ChatInputProps {
  onSendMessage: (content: string, mediaUrl?: string) => void;
  onTyping: () => void;
  isLoading?: boolean;
}

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function ChatInput({ onSendMessage, onTyping, isLoading }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Generate previews when files change
  useEffect(() => {
    const urls = mediaFiles.map((f) => URL.createObjectURL(f));
    setMediaPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [mediaFiles]);

  const handleSend = async () => {
    if (!message.trim() && mediaFiles.length === 0) return;

    const text = message.trim();

    if (mediaFiles.length > 0) {
      try {
        setIsUploading(true);
        // Upload all files
        const uploadPromises = mediaFiles.map((file) =>
          uploadToCloudinary(file, "swipe-buddy/chat")
        );
        const results = await Promise.all(uploadPromises);

        // Send first image with the text message
        onSendMessage(text, results[0].secure_url);

        // Send remaining images as separate messages
        for (let i = 1; i < results.length; i++) {
          onSendMessage("", results[i].secure_url);
        }
      } catch (err) {
        console.error("Media upload failed:", err);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    } else {
      onSendMessage(text);
    }

    setMessage("");
    setMediaFiles([]);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`"${file.name}" exceeds the 50MB limit and was skipped. You can upload the file to Google Drive and share the link instead.`);
        continue;
      }
      validFiles.push(file);
    }

    setMediaFiles((prev) => {
      const combined = [...prev, ...validFiles];
      if (combined.length > MAX_FILES) {
        alert(`You can attach up to ${MAX_FILES} files. Extra files were removed.`);
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });

    // Reset input so same files can be re-selected
    e.target.value = "";
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canSend = Boolean(message.trim() || mediaFiles.length > 0);

  return (
    <div className="px-4 py-3">
      {/* Media previews */}
      {mediaPreviews.length > 0 && (
        <div className="max-w-3xl mx-auto mb-2">
          <div
            className="flex gap-2 overflow-x-auto py-2 px-3 rounded-xl scrollbar-hide"
            style={{
              background: 'rgba(255, 255, 255, 0.55)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
            }}
          >
            {mediaPreviews.map((preview, idx) => {
              const isVideo = mediaFiles[idx]?.type.startsWith("video/");
              return (
                <div key={idx} className="relative flex-shrink-0 rounded-lg overflow-hidden group">
                  {isVideo ? (
                    <video src={preview} className="h-[100px] w-[100px] object-cover rounded-lg" />
                  ) : (
                    <img src={preview} alt={`Preview ${idx + 1}`} className="h-[100px] w-[100px] object-cover rounded-lg" />
                  )}
                  <button
                    onClick={() => removeMedia(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gray-900/60 hover:bg-gray-900/80 text-white flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {isUploading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
                    </div>
                  )}
                </div>
              );
            })}
            {mediaFiles.length < MAX_FILES && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-[100px] w-[100px] flex-shrink-0 rounded-lg border-2 border-dashed border-gray-200 hover:border-rose-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-rose-500 transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{mediaFiles.length}/{MAX_FILES}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input bar */}
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
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 rounded-full h-9 w-9 transition-all hover:bg-rose-50 group"
          >
            <ImageIcon className="h-5 w-5 text-gray-400 group-hover:text-rose-500 transition-colors" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
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
          onClick={() => { handleSend(); }}
          disabled={!canSend || !!isLoading || isUploading}
          className={cn(
            "shrink-0 rounded-full h-9 w-9 transition-all duration-300",
            canSend
              ? "bg-gradient-to-br from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white scale-100 shadow-md shadow-rose-200/40"
              : "bg-gray-100/60 text-gray-300 scale-95 hover:bg-gray-100"
          )}
        >
          {(isLoading || isUploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
