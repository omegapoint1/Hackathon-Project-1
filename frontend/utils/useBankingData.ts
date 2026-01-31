import { useState, useEffect, useCallback } from 'react';
import { getStoredTokens } from './auth';
import { liminalApi } from './liminalApi';

export interface BankingData {
  balance: {
    wallet: number;
    savings: number;
    total: number;
    currency: string;
  };
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
  profile: {
    id: string;
    email: string;
    name?: string;
    createdAt: string;
    verified: boolean;
  };
  spending: Array<{
    category: string;
    amount: number;
    percentage: number;
    count: number;
  }>;
  savingsRate: number | null;
}

export function useBankingData() {
  const [data, setData] = useState<BankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const tokens = getStoredTokens();
    if (!tokens?.accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const [balanceData, savingsData, ratesData, transactionsData, profileData] = await Promise.all([
        liminalApi.getBalance(tokens.accessToken),
        liminalApi.getSavingsBalance(tokens.accessToken),
        liminalApi.getVaultRates(tokens.accessToken),
        liminalApi.getTransactions(tokens.accessToken, 1, 10),
        liminalApi.getProfile(tokens.accessToken),
      ]);

      const walletBalance = balanceData.balance;
      const savingsBalance = savingsData.balance;
      const savingsRate = ratesData.rates[0]?.apy || null;

      // Generate mock spending data for now (would come from API in real implementation)
      const spending = [
        { category: 'Food & Dining', amount: 450, percentage: 35, count: 12 },
        { category: 'Transportation', amount: 280, percentage: 22, count: 8 },
        { category: 'Shopping', amount: 320, percentage: 25, count: 6 },
        { category: 'Entertainment', amount: 150, percentage: 12, count: 4 },
        { category: 'Bills & Utilities', amount: 80, percentage: 6, count: 3 },
      ];

      setData({
        balance: {
          wallet: walletBalance,
          savings: savingsBalance,
          total: walletBalance + savingsBalance,
          currency: balanceData.currency,
        },
        transactions: transactionsData.transactions,
        profile: profileData,
        spending,
        savingsRate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch banking data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    balance: data?.balance || { wallet: 0, savings: 0, total: 0, currency: 'USD' },
    transactions: data?.transactions || [],
    profile: data?.profile,
    spending: data?.spending || [],
    savingsRate: data?.savingsRate || null,
    isLoading,
    error,
    refetch: fetchData,
  };
}