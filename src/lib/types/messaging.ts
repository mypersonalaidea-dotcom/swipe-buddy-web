export type DeliveryStatus = "sending" | "sent" | "delivered" | "seen";

export interface OtherUser {
  id: string;
  name: string;
  profile_picture_url: string | null;
  last_seen_at: string | null;
}

export interface LastMessagePayload {
  id: string;
  content: string | null;
  message_type: string;
  sender_id: string;
  delivery_status: DeliveryStatus;
  created_at: string;
  is_mine: boolean;
}

export interface MessageSender {
  id: string;
  name: string;
  profile_picture_url: string | null;
}

export interface MessagePayload {
  id: string;
  conversation_id: string;
  sender: MessageSender;
  content: string | null;
  message_type: string;
  media_url: string | null;
  delivery_status: DeliveryStatus;
  reply_to?: any;
  created_at: string;
  updated_at: string;
  tempId?: string;
}

export interface ConversationPayload {
  id: string;
  other_user: OtherUser | null;
  unread_count: number;
  muted: boolean;
  last_message_at: string | null;
  status: string;
  created_at: string;
  last_message?: LastMessagePayload | null;
}

export interface ConversationsResponse {
  data: ConversationPayload[];
}

export interface MessagesResponse {
  data: {
    messages: MessagePayload[];
    nextCursor: string | null;
    hasMore: boolean;
  }
}

export interface SendMessageInput {
  conversationId: string;
  content?: string;
  mediaUrl?: string;
  replyToId?: string;
  tempId: string;
}

export interface NewMessageEvent {
  message: MessagePayload;
  conversationId?: string;
}

export interface MessageSentEvent {
  message: MessagePayload;
  tempId: string;
}

export interface MessageDeliveredEvent {
  messageId: string;
  conversationId: string;
  deliveredAt: string;
}

export interface MessageSeenEvent {
  conversationId: string;
  seenBy: string;
  seenAt: string;
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface UserOnlineEvent {
  user_id: string;
  is_online: boolean;
  last_seen_at: string | null;
}

export interface ConversationUpdatedEvent {
  conversationId: string;
  last_message: LastMessagePayload;
}

