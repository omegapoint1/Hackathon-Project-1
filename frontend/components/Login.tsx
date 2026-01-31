import { useState, useEffect } from 'react';
import { LoginPanel } from './LoginPanel';
import { Dashboard } from './Dashboard';
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



  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-nim-cream">
        <div className="container mx-auto px-4 py-8 max-w-md">
          <h1 className="font-display text-3xl font-semibold text-center text-nim-orange mb-8">
            {title} Login
          </h1>
          <LoginPanel onLoginSuccess={handleLoginSuccess} apiUrl={apiUrl} />
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      wsUrl={wsUrl}
      apiUrl={apiUrl}
      title={title}
      onLogout={handleLogout}
    />
  );
}

