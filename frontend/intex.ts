// Main widget component
export { NimChat } from './NimChat';

// Individual components for custom implementations
export { ChatPanel } from './components/ChatPanel';
export { ChatMessage } from './components/ChatMessage';
export { ChatInput } from './components/ChatInput';
export { ConfirmationCard } from './components/ConfirmationCard';
export { ThinkingIndicator } from './components/ThinkingIndicator';

// Hook for custom implementations
export { useNimWebSocket } from './hooks/useNimWebSocket';

// Types
export type {
  Message,
  ClientMessage,
  ServerMessage,
  ConfirmationRequest,
  ConnectionState,
  WidgetPosition,
  NimChatProps,
  TokenUsage,
} from './types';

// Theme
export { theme, colors, typography, spacing, borderRadius, shadows } from './styles/theme';
