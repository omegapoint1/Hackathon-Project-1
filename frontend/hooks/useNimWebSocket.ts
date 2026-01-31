import { useState, useEffect, useRef, useCallback } from 'react';
import { getStoredTokens, refreshAccessToken, isTokenExpiringSoon, clearStoredTokens } from '../utils/auth';
import type {
  Message,
  ClientMessage,
  ServerMessage,
  ConfirmationRequest,
  ConnectionState,
} from '../types';

const STORAGE_KEY = 'nim-chat-conversation-id';

interface UseNimWebSocketOptions {
  wsUrl: string;
  jwt: string | null;
  onError?: (error: string) => void;
}

interface UseNimWebSocketReturn {
  messages: Message[];
  isStreaming: boolean;
  connectionState: ConnectionState;
  confirmationRequest: ConfirmationRequest | null;
  sendMessage: (content: string) => void;
  confirmAction: (actionId: string) => void;
  cancelAction: (actionId: string) => void;
  reconnect: () => void;
}

export function useNimWebSocket({
  wsUrl,
  jwt,
  onError,
}: UseNimWebSocketOptions): UseNimWebSocketReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [confirmationRequest, setConfirmationRequest] = useState<ConfirmationRequest | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamingContentRef = useRef<string>('');
  const conversationIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const hasResumeFailedRef = useRef(false);

  const send = useCallback((message: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionState('connecting');

    // Add JWT as query parameter if authenticated
    const wsUrlWithAuth = jwt
      ? `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(jwt)}`
      : wsUrl;

    const ws = new WebSocket(wsUrlWithAuth);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionState('connected');
      reconnectAttemptsRef.current = 0;

      // Check for existing conversation
      const storedId = localStorage.getItem(STORAGE_KEY);
      if (storedId && !hasResumeFailedRef.current) {
        conversationIdRef.current = storedId;
        send({ type: 'resume_conversation', conversationId: storedId });
      } else {
        // Start fresh if no stored ID or previous resume failed
        hasResumeFailedRef.current = false;
        send({ type: 'new_conversation' });
      }
    };

    ws.onmessage = (event) => {
      const message: ServerMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'conversation_started':
          conversationIdRef.current = message.conversationId;
          localStorage.setItem(STORAGE_KEY, message.conversationId);
          break;

        case 'conversation_resumed':
          conversationIdRef.current = message.conversationId;
          localStorage.setItem(STORAGE_KEY, message.conversationId);
          setMessages(message.messages || []);
          break;

        case 'text_chunk':
          setIsStreaming(true);
          streamingContentRef.current += message.content;

          // Update the last assistant message or create one
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.role === 'assistant' && !lastMessage.content.endsWith('█')) {
              // Update existing streaming message
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: streamingContentRef.current },
              ];
            } else if (lastMessage?.role === 'assistant') {
              // Continue streaming
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: streamingContentRef.current },
              ];
            } else {
              // Create new assistant message
              return [
                ...prev,
                {
                  id: `msg-${Date.now()}`,
                  role: 'assistant',
                  content: streamingContentRef.current,
                  timestamp: Date.now(),
                },
              ];
            }
          });
          break;

        case 'text':
          setIsStreaming(false);
          streamingContentRef.current = '';

          // Replace streaming message with final content
          setMessages((prev) => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage?.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: message.content },
              ];
            }
            return [
              ...prev,
              {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: message.content,
                timestamp: Date.now(),
              },
            ];
          });
          break;

        case 'confirm_request':
          setConfirmationRequest({
            actionId: message.actionId,
            tool: message.tool,
            summary: message.summary,
            expiresAt: new Date(message.expiresAt),
          });
          break;

        case 'complete':
          setIsStreaming(false);
          streamingContentRef.current = '';
          setConfirmationRequest(null);
          break;

        case 'error':
          setIsStreaming(false);
          streamingContentRef.current = '';

          // Check if error is due to conversation not found
          const isConversationNotFound =
            message.content.toLowerCase().includes('conversation not found') ||
            message.content.toLowerCase().includes('conversation does not exist');

          if (isConversationNotFound) {
            // Clear stored conversation ID and start fresh
            localStorage.removeItem(STORAGE_KEY);
            conversationIdRef.current = null;
            hasResumeFailedRef.current = true;

            // Reconnect to start new conversation
            reconnect();
          } else {
            // Show other errors to user
            onError?.(message.content);

            // Add error as assistant message
            setMessages((prev) => [
              ...prev,
              {
                id: `msg-${Date.now()}`,
                role: 'assistant',
                content: `Error: ${message.content}`,
                timestamp: Date.now(),
              },
            ]);
          }
          break;
      }
    };

    ws.onerror = () => {
      setConnectionState('error');
      onError?.('WebSocket connection error');
    };

    ws.onclose = () => {
      setConnectionState('disconnected');
      setIsStreaming(false);

      // Don't reconnect if unmounted
      if (!isMountedRef.current) {
        return;
      }

      // Auto-reconnect with exponential backoff (max 5 attempts)
      if (reconnectAttemptsRef.current < 5) {
        setConnectionState('reconnecting');
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
        reconnectAttemptsRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, delay);
      } else {
        setConnectionState('error');
        onError?.('Failed to reconnect after multiple attempts');
      }
    };
  }, [wsUrl, jwt, send, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    disconnect();
    connect();
  }, [connect, disconnect]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      // Add user message immediately
      const userMessage: Message = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send to server
      send({ type: 'message', content: content.trim() });
    },
    [send]
  );

  const confirmAction = useCallback(
    (actionId: string) => {
      send({ type: 'confirm', actionId });
      setConfirmationRequest(null);
    },
    [send]
  );

  const cancelAction = useCallback(
    (actionId: string) => {
      send({ type: 'cancel', actionId });
      setConfirmationRequest(null);
    },
    [send]
  );

  // Connect when JWT is available
  useEffect(() => {
    isMountedRef.current = true;

    // Only connect if we have a JWT
    if (jwt) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwt]);

  // Token refresh logic
  useEffect(() => {
    const refreshIntervalRef = setInterval(async () => {
      const tokens = getStoredTokens();
      if (!tokens) return;

      if (isTokenExpiringSoon(tokens.expiresAt, 60)) {
        try {
          await refreshAccessToken(tokens.refreshToken);

          // Reconnect with new token
          if (wsRef.current) {
            reconnect();
          }
        } catch (error) {
          console.error('[NimChat] Token refresh failed:', error);
          onError?.('Session expired. Please log in again.');
          clearStoredTokens();
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    // Check immediately on mount
    const checkImmediately = async () => {
      const tokens = getStoredTokens();
      if (!tokens) return;

      if (isTokenExpiringSoon(tokens.expiresAt, 60)) {
        try {
          await refreshAccessToken(tokens.refreshToken);
        } catch (error) {
          console.error('[NimChat] Token refresh failed:', error);
          onError?.('Session expired. Please log in again.');
          clearStoredTokens();
        }
      }
    };

    checkImmediately();

    return () => {
      clearInterval(refreshIntervalRef);
    };
  }, [jwt, onError, reconnect]);

  return {
    messages,
    isStreaming,
    connectionState,
    confirmationRequest,
    sendMessage,
    confirmAction,
    cancelAction,
    reconnect,
  };
}
