import { cn } from "@/lib/utils";
import { MessagePayload } from "@/lib/types/messaging";
import { MessageStatusIcon } from "./MessageStatusIcon";

interface MessageBubbleProps {
  message: MessagePayload;
  isSentByMe: boolean;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
}

export function MessageBubble({
  message,
  isSentByMe,
  isFirstInGroup,
  isLastInGroup,
}: MessageBubbleProps) {
  // Format time (e.g. 10:30 AM)
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(message.createdAt));

  return (
    <div
      className={cn(
        "flex",
        isSentByMe ? "justify-end" : "justify-start",
        isLastInGroup ? "mb-3" : "mb-0.5"
      )}
    >
      <div
        className={cn(
          "max-w-[75%] sm:max-w-[65%] px-3 py-2 shadow-sm relative group transition-all",
          isSentByMe
            ? cn(
                "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground",
                isFirstInGroup && isLastInGroup && "rounded-2xl rounded-br-md",
                isFirstInGroup && !isLastInGroup && "rounded-2xl rounded-br-md",
                !isFirstInGroup && isLastInGroup && "rounded-2xl rounded-tr-md rounded-br-md",
                !isFirstInGroup && !isLastInGroup && "rounded-xl rounded-r-md"
              )
            : cn(
                "bg-card text-card-foreground border border-border/30",
                isFirstInGroup && isLastInGroup && "rounded-2xl rounded-bl-md",
                isFirstInGroup && !isLastInGroup && "rounded-2xl rounded-bl-md",
                !isFirstInGroup && isLastInGroup && "rounded-2xl rounded-tl-md rounded-bl-md",
                !isFirstInGroup && !isLastInGroup && "rounded-xl rounded-l-md"
              )
        )}
      >
        {/* If media is present, show image first */}
        {message.mediaUrl && (
          <div className="mb-2 -mx-2 -mt-1 rounded-t border-b border-white/20 overflow-hidden">
             <img src={message.mediaUrl} alt="Media message" className="w-full h-auto max-h-60 object-cover" />
          </div>
        )}

        <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>

        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1 -mb-0.5",
            isSentByMe
              ? "text-primary-foreground/60"
              : "text-muted-foreground"
          )}
        >
          <span className="text-[10px]">{time}</span>
          {isSentByMe && (
            <MessageStatusIcon status={message.deliveryStatus} />
          )}
        </div>
      </div>
    </div>
  );
}
