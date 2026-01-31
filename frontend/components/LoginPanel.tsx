import { useState } from 'react';

interface LoginPanelProps {
  onLoginSuccess: (jwt: string, userId: string) => void;
  apiUrl?: string;
}

export function LoginPanel({ onLoginSuccess, apiUrl = 'https://api.liminal.cash' }: LoginPanelProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/auth/v1/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          type: 1, // OTP_TYPE_LOGIN
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }

      setStep('otp');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/auth/v1/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otp.trim(),
          type: 1, // OTP_TYPE_LOGIN
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid OTP code');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Login failed');
      }

      // Store tokens in localStorage
      localStorage.setItem('nim_access_token', data.accessToken);
      localStorage.setItem('nim_refresh_token', data.refreshToken);
      localStorage.setItem('nim_expires_at', data.expiresAt);
      localStorage.setItem('nim_user_id', data.user.id);
      localStorage.setItem('nim_user_email', data.user.email);

      onLoginSuccess(data.accessToken, data.user.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="flex flex-col gap-4 p-6 bg-white max-w-md">
        <div>
          <h2 className="font-display text-2xl font-bold text-nim-black">Enter Code</h2>
          <p className="text-sm text-nim-brown/60 mt-1">
            We sent a 6-digit code to {email}
          </p>
        </div>

        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          className="px-4 py-3 border border-nim-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-nim-orange font-mono text-center text-2xl tracking-widest text-nim-black"
          autoFocus
        />

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={verifyOtp}
          disabled={loading || otp.length !== 6}
          className="px-4 py-3 bg-nim-orange text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verifying...' : 'Verify & Sign In'}
        </button>

        <button
          onClick={() => {
            setStep('email');
            setOtp('');
            setError('');
          }}
          className="text-sm text-nim-brown/60 hover:text-nim-brown transition-colors"
        >
          ← Use different email
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-white max-w-md">
      <div>
        <h2 className="font-display text-2xl font-bold text-nim-black">Sign In to Nim</h2>
        <p className="text-sm text-nim-brown/60 mt-1">
          Enter your Liminal email to receive a login code
        </p>
      </div>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className="px-4 py-3 border border-nim-cream rounded-lg focus:outline-none focus:ring-2 focus:ring-nim-orange text-nim-black"
        autoFocus
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        onClick={sendOtp}
        disabled={loading || !email.includes('@')}
        className="px-4 py-3 bg-nim-orange text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Sending code...' : 'Send Login Code'}
      </button>

      <p className="text-xs text-nim-brown/40 text-center">
        Don't have an account? Download the Liminal app to sign up.
      </p>
    </div>
  );
}
