export interface TokenState {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  email?: string;
}

export function getStoredTokens(): TokenState | null {
  const accessToken = localStorage.getItem('nim_access_token');
  const refreshToken = localStorage.getItem('nim_refresh_token');
  const expiresAt = localStorage.getItem('nim_expires_at');
  const userId = localStorage.getItem('nim_user_id');
  const email = localStorage.getItem('nim_user_email');

  if (!accessToken || !refreshToken || !expiresAt || !userId) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: parseInt(expiresAt, 10),
    userId,
    email: email || undefined,
  };
}

export function clearStoredTokens(): void {
  localStorage.removeItem('nim_access_token');
  localStorage.removeItem('nim_refresh_token');
  localStorage.removeItem('nim_expires_at');
  localStorage.removeItem('nim_user_id');
  localStorage.removeItem('nim_user_email');
}

export function isTokenExpiringSoon(expiresAt: number, bufferSeconds: number = 60): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= expiresAt - bufferSeconds;
}

export async function refreshAccessToken(
  refreshToken: string,
  apiUrl: string = 'https://api.liminal.cash'
): Promise<TokenState> {
  const response = await fetch(`${apiUrl}/auth/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const data = await response.json();

  const newTokens: TokenState = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    userId: data.user.id,
    email: data.user.email,
  };

  // Update localStorage
  localStorage.setItem('nim_access_token', newTokens.accessToken);
  localStorage.setItem('nim_refresh_token', newTokens.refreshToken);
  localStorage.setItem('nim_expires_at', newTokens.expiresAt.toString());
  localStorage.setItem('nim_user_id', newTokens.userId);
  if (newTokens.email) {
    localStorage.setItem('nim_user_email', newTokens.email);
  }

  return newTokens;
}
