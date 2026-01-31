// Message types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// WebSocket protocol - Client → Server
export type ClientMessage =
  | { type: 'new_conversation' }
  | { type: 'resume_conversation'; conversationId: string }
  | { type: 'message'; content: string }
  | { type: 'confirm'; actionId: string }
  | { type: 'cancel'; actionId: string };

// WebSocket protocol - Server → Client
export type ServerMessage =
  | { type: 'conversation_started'; conversationId: string }
  | { type: 'conversation_resumed'; conversationId: string; messages: Message[] }
  | { type: 'text_chunk'; content: string }
  | { type: 'text'; content: string }
  | {
      type: 'confirm_request';
      actionId: string;
      tool: string;
      summary: string;
      expiresAt: string;
    }
  | { type: 'complete'; tokenUsage?: TokenUsage }
  | { type: 'error'; content: string };

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

// Confirmation request for UI
export interface ConfirmationRequest {
  actionId: string;
  tool: string;
  summary: string;
  expiresAt: Date;
}

// Connection state
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

// Widget position
export type WidgetPosition = 'bottom-right' | 'bottom-left';

// NimChat props
export interface NimChatProps {
  wsUrl: string;
  apiUrl?: string;
  title?: string;
  position?: WidgetPosition;
  defaultOpen?: boolean;
}
