import { cn } from "@/lib/utils";
import { Clock, Check, CheckCheck } from "lucide-react";
import type { DeliveryStatus } from "@/lib/types/messaging";

interface MessageStatusIconProps {
  status: DeliveryStatus;
  className?: string;
}

export function MessageStatusIcon({ status, className }: MessageStatusIconProps) {
  switch (status) {
    case "sending":
      return <Clock className={cn("w-3.5 h-3.5", className)} />;
    case "sent":
      return <Check className={cn("w-3.5 h-3.5", className)} />;
    case "delivered":
      return <CheckCheck className={cn("w-3.5 h-3.5", className)} />;
    case "seen":
      return <CheckCheck className={cn("w-3.5 h-3.5 text-blue-400 dark:text-blue-500", className)} />;
    default:
      return null;
  }
}
