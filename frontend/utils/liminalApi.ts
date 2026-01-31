const API_BASE = 'https://api.liminal.cash';

export interface BalanceResponse {
  balance: number;
  currency: string;
}

export interface SavingsBalanceResponse {
  balance: number;
  currency: string;
  positions: Array<{
    id: string;
    amount: number;
    apy: number;
  }>;
}

export interface VaultRatesResponse {
  rates: Array<{
    vault: string;
    apy: number;
    description: string;
  }>;
}

export interface TransactionsResponse {
  transactions: Array<{
    id: string;
    amount: number;
    currency: string;
    type: 'send' | 'receive' | 'deposit' | 'withdrawal';
    status: 'pending' | 'completed' | 'failed';
    description: string;
    createdAt: string;
    counterparty?: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ProfileResponse {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  verified: boolean;
}

export interface SendMoneyRequest {
  recipientEmail: string;
  amount: number;
  currency?: string;
  note?: string;
}

export interface SavingsActionRequest {
  amount: number;
  vault?: string;
}

class LiminalAPI {
  private async makeRequest<T>(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getBalance(accessToken: string): Promise<BalanceResponse> {
    return this.makeRequest<BalanceResponse>('/v1/tools/get_balance', accessToken);
  }

  async getSavingsBalance(accessToken: string): Promise<SavingsBalanceResponse> {
    return this.makeRequest<SavingsBalanceResponse>('/v1/tools/get_savings_balance', accessToken);
  }

  async getVaultRates(accessToken: string): Promise<VaultRatesResponse> {
    return this.makeRequest<VaultRatesResponse>('/v1/tools/get_vault_rates', accessToken);
  }

  async getTransactions(
    accessToken: string,
    page = 1,
    limit = 20
  ): Promise<TransactionsResponse> {
    return this.makeRequest<TransactionsResponse>(
      `/v1/tools/get_transactions?page=${page}&limit=${limit}`,
      accessToken
    );
  }

  async getProfile(accessToken: string): Promise<ProfileResponse> {
    return this.makeRequest<ProfileResponse>('/v1/tools/get_profile', accessToken);
  }

  async searchUsers(
    accessToken: string,
    query: string
  ): Promise<{ users: Array<{ id: string; email: string; name?: string }> }> {
    return this.makeRequest<{ users: Array<{ id: string; email: string; name?: string }> }>(
      `/v1/tools/search_users?q=${encodeURIComponent(query)}`,
      accessToken
    );
  }

  async sendMoney(accessToken: string, data: SendMoneyRequest): Promise<{ success: boolean; transactionId: string }> {
    return this.makeRequest<{ success: boolean; transactionId: string }>(
      '/v1/tools/send_money',
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async depositSavings(accessToken: string, data: SavingsActionRequest): Promise<{ success: boolean; transactionId: string }> {
    return this.makeRequest<{ success: boolean; transactionId: string }>(
      '/v1/tools/deposit_savings',
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async withdrawSavings(accessToken: string, data: SavingsActionRequest): Promise<{ success: boolean; transactionId: string }> {
    return this.makeRequest<{ success: boolean; transactionId: string }>(
      '/v1/tools/withdraw_savings',
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }
}

export const liminalApi = new LiminalAPI();