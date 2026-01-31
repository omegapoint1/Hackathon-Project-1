import { useState, useEffect } from 'react';
import { ChatPanel } from './ChatPanel';
import { LoginPanel } from './LoginPanel';
import { useNimWebSocket } from '../hooks/useNimWebSocket';
import { getStoredTokens, clearStoredTokens } from '../utils/auth';
import type { NimChatProps } from '../types';

export function Login({
  wsUrl,
  apiUrl = 'https://api.liminal.cash',
  title = 'Nim',
}: NimChatProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [jwt, setJwt] = useState<string | null>(null);

  useEffect(() => {
    const tokens = getStoredTokens();
    if (tokens) {
      setJwt(tokens.accessToken);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = (accessToken: string, userId: string) => {
    setJwt(accessToken);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    clearStoredTokens();
    setJwt(null);
    setIsAuthenticated(false);
  };

  const {
    messages,
    isStreaming,
    connectionState,
    confirmationRequest,
    sendMessage,
    confirmAction,
    cancelAction,
  } = useNimWebSocket({
    wsUrl,
    jwt: isAuthenticated ? jwt : null,
    onError: (error) => console.error('[FullPageLogin]', error),
  });

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-sm sm:max-w-md bg-white shadow-xl rounded-xl p-6 border border-gray-200">
          <h1 className="text-3xl font-semibold text-center text-nim-orange mb-4">
            {title} Login
          </h1>
          <LoginPanel onLoginSuccess={handleLoginSuccess} apiUrl={apiUrl} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-bold text-nim-orange">{title} Chat</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          Logout
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl h-[80vh]">
          <ChatPanel
            title={title}
            messages={messages}
            isStreaming={isStreaming}
            connectionState={connectionState}
            confirmationRequest={confirmationRequest}
            onSendMessage={sendMessage}
            onConfirm={confirmAction}
            onCancel={cancelAction}
            onClose={() => {}}
            onLogout={handleLogout}
          />
        </div>
      </main>
    </div>
  );
}

