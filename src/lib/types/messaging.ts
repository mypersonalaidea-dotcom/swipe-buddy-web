// ─── Messaging Types ────────────────────────────────────────────────────────
// Mirrors the backend Prisma schema + socket event payloads

export type DeliveryStatus = "sending" | "sent" | "delivered" | "seen";

export interface Participant {
  userId: string;
  name: string;
  profilePictureUrl: string | null;
}

export interface MessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  mediaUrl: string | null;
  replyToId: string | null;
  deliveryStatus: DeliveryStatus;
  createdAt: string;
  updatedAt: string;
  /** Only set client-side for optimistic messages */
  tempId?: string;
}

export interface ConversationPayload {
  id: string;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  lastMessage: MessagePayload | null;
  unreadCount: number;
}

/** What the REST "list conversations" endpoint returns */
export interface ConversationsResponse {
  conversations: ConversationPayload[];
}

/** What the REST "get messages" endpoint returns (cursor-paginated) */
export interface MessagesResponse {
  messages: MessagePayload[];
  nextCursor: string | null;
}

// ─── Socket Event Payloads ──────────────────────────────────────────────────

export interface SendMessageInput {
  conversationId: string;
  content?: string;
  mediaUrl?: string;
  replyToId?: string;
  tempId: string;
}

export interface NewMessageEvent {
  message: MessagePayload;
  conversationId: string;
}

export interface MessageSentEvent {
  message: MessagePayload;
  tempId: string;
}

export interface MessageDeliveredEvent {
  messageId: string;
  conversationId: string;
}

export interface MessageSeenEvent {
  conversationId: string;
  messageIds: string[];
}

export interface TypingEvent {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface UserOnlineEvent {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string | null;
}

export interface ConversationUpdatedEvent {
  conversation: ConversationPayload;
}
