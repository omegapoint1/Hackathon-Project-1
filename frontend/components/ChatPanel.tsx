import { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ThinkingIndicator } from './ThinkingIndicator';
import { ConfirmationCard } from './ConfirmationCard';
import type { Message, ConfirmationRequest, ConnectionState } from '../types';

interface ChatPanelProps {
  title: string;
  messages: Message[];
  isStreaming: boolean;
  connectionState: ConnectionState;
  confirmationRequest: ConfirmationRequest | null;
  onSendMessage: (content: string) => void;
  onConfirm: (actionId: string) => void;
  onCancel: (actionId: string) => void;
  onClose: () => void;
  onLogout?: () => void;
}

export function ChatPanel({
  title,
  messages,
  isStreaming,
  connectionState,
  confirmationRequest,
  onSendMessage,
  onConfirm,
  onCancel,
  onClose,
  onLogout,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, confirmationRequest]);

  const isConnecting = connectionState === 'connecting';
  const isReconnecting = connectionState === 'reconnecting';
  const isDisconnected = connectionState === 'disconnected';
  const hasError = connectionState === 'error';

  return (
    <div className="nim-panel-enter flex flex-col h-full bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-nim-cream">
        <h2 className="font-display text-xl font-medium text-nim-black">{title}</h2>
        <div className="flex items-center gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs rounded-lg bg-nim-cream hover:bg-nim-cream/80 text-nim-black font-body transition-colors"
              aria-label="Logout"
            >
              Logout
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-nim-cream transition-colors"
            aria-label="Close chat"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-nim-black"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Connection status banner */}
      {isReconnecting && (
        <div className="px-4 py-2 bg-yellow-100 border-b border-yellow-200 text-nim-black font-body text-sm">
          Reconnecting...
        </div>
      )}
      {isDisconnected && !isReconnecting && (
        <div className="px-4 py-2 bg-orange-100 border-b border-orange-200 text-nim-black font-body text-sm">
          Connection lost. Reconnecting...
        </div>
      )}
      {hasError && (
        <div className="px-4 py-2 bg-red-100 border-b border-red-200 text-nim-black font-body text-sm">
          Connection failed. Please refresh the page.
        </div>
      )}

      {/* Messages */}
      <div className="nim-chat-messages flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !isConnecting && (
          <div className="text-center py-8 px-4">
            <p className="font-display text-lg font-medium text-nim-black mb-3">Chat with Nim</p>
            <p className="font-body text-sm text-nim-brown/60 mb-4">Ask me anything about your finances</p>
            <div className="space-y-2 text-sm text-left bg-nim-cream rounded-lg p-4">
              <p className="font-display font-medium text-nim-black mb-2">Try asking:</p>
              <ul className="space-y-1.5 font-body text-nim-brown/60">
                <li>• "What's my balance?"</li>
                <li>• "Show me recent transactions"</li>
                <li>• "Analyze my spending for last 30 days"</li>
              </ul>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Thinking indicator when streaming starts but no content yet */}
        {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
          <ThinkingIndicator />
        )}

        {/* Confirmation card */}
        {confirmationRequest && (
          <div className="py-2">
            <ConfirmationCard
              request={confirmationRequest}
              onConfirm={onConfirm}
              onCancel={onCancel}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-nim-cream bg-white">
        <ChatInput
          onSend={onSendMessage}
          disabled={isConnecting || isReconnecting || isDisconnected || hasError || isStreaming || !!confirmationRequest}
          placeholder={
            isConnecting
              ? 'Connecting...'
              : isReconnecting
                ? 'Reconnecting...'
                : isDisconnected || hasError
                  ? 'Disconnected'
                  : isStreaming
                    ? 'Nim is responding...'
                    : confirmationRequest
                      ? 'Waiting for confirmation...'
                      : 'Type a message...'
          }
        />
      </div>
    </div>
  );
}
