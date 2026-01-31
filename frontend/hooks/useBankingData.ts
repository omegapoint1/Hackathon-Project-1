import { useState, useEffect, useCallback } from 'react'
import { 
  getBalance, 
  getTransactions, 
  getProfile, 
  getSavingsBalance,
  calculateSpending,
  type Balance,
  type Transaction,
  type Profile,
  type SavingsBalance
} from '../services/api'

export interface SpendingCategory {
  name: string
  amount: number
  percentage: number
  color: string
}

export interface BankingData {
  balance: Balance | null
  transactions: Transaction[]
  profile: Profile | null
  savingsBalance: SavingsBalance | null
  spending: SpendingCategory[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useBankingData(): BankingData {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [savingsBalance, setSavingsBalance] = useState<SavingsBalance | null>(null)
  const [spending, setSpending] = useState<SpendingCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Fetch all data in parallel
      const [balanceData, transactionsData, profileData, savingsData] = await Promise.all([
        getBalance(),
        getTransactions(20),
        getProfile(),
        getSavingsBalance()
      ])
      
      setBalance(balanceData)
      setTransactions(transactionsData)
      setProfile(profileData)
      setSavingsBalance(savingsData)
      
      // Calculate spending categories from transactions
      const spendingData = calculateSpending(transactionsData)
      setSpending(spendingData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    balance,
    transactions,
    profile,
    savingsBalance,
    spending,
    isLoading,
    error,
    refetch: fetchData
  }
}
