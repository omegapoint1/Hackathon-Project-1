// Liminal API Service
// Connects to the backend which uses the nim-go-sdk

const API_URL = import.meta.env.VITE_API_URL || 'https://api.liminal.cash'

export interface Balance {
  total: number
  checking: number
  savings: number
  currency: string
}

export interface SavingsBalance {
  total: number
  positions: {
    id: string
    amount: number
    apy: number
    name: string
  }[]
}

export interface Transaction {
  id: string
  name: string
  description: string
  amount: number
  type: 'incoming' | 'outgoing'
  date: string
  category: string
  timestamp: string
}

export interface Profile {
  id: string
  name: string
  email: string
  avatar?: string
  initials: string
}

export interface VaultRate {
  id: string
  name: string
  apy: number
}

// Fetch wallet balance using get_balance tool
export async function getBalance(): Promise<Balance> {
  try {
    const response = await fetch(`${API_URL}/api/balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch balance')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching balance:', error)
    // Return mock data as fallback
    return {
      total: 24562.89,
      checking: 12450.00,
      savings: 12112.89,
      currency: 'USD'
    }
  }
}

// Fetch savings balance using get_savings_balance tool
export async function getSavingsBalance(): Promise<SavingsBalance> {
  try {
    const response = await fetch(`${API_URL}/api/savings/balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch savings balance')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching savings balance:', error)
    return {
      total: 12112.89,
      positions: []
    }
  }
}

// Fetch transaction history using get_transactions tool
export async function getTransactions(limit: number = 10): Promise<Transaction[]> {
  try {
    const response = await fetch(`${API_URL}/api/transactions?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch transactions')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching transactions:', error)
    // Return mock data as fallback
    return [
      { id: '1', name: 'Salary Deposit', description: 'Monthly salary', amount: 5200.00, type: 'incoming', date: 'Today', category: 'income', timestamp: new Date().toISOString() },
      { id: '2', name: 'Amazon', description: 'Online shopping', amount: -127.54, type: 'outgoing', date: 'Today', category: 'shopping', timestamp: new Date().toISOString() },
      { id: '3', name: 'Netflix', description: 'Subscription', amount: -15.99, type: 'outgoing', date: 'Yesterday', category: 'entertainment', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { id: '4', name: 'Transfer from Sarah', description: 'Shared dinner', amount: 45.00, type: 'incoming', date: 'Yesterday', category: 'transfer', timestamp: new Date(Date.now() - 86400000).toISOString() },
      { id: '5', name: 'Whole Foods', description: 'Groceries', amount: -89.32, type: 'outgoing', date: 'Jan 28', category: 'food', timestamp: new Date(Date.now() - 172800000).toISOString() },
      { id: '6', name: 'Uber', description: 'Ride to airport', amount: -34.50, type: 'outgoing', date: 'Jan 27', category: 'transport', timestamp: new Date(Date.now() - 259200000).toISOString() },
      { id: '7', name: 'Freelance Payment', description: 'Design project', amount: 850.00, type: 'incoming', date: 'Jan 26', category: 'income', timestamp: new Date(Date.now() - 345600000).toISOString() },
    ]
  }
}

// Fetch user profile using get_profile tool
export async function getProfile(): Promise<Profile> {
  try {
    const response = await fetch(`${API_URL}/api/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching profile:', error)
    return {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      initials: 'JD'
    }
  }
}

// Fetch vault rates using get_vault_rates tool
export async function getVaultRates(): Promise<VaultRate[]> {
  try {
    const response = await fetch(`${API_URL}/api/vaults/rates`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch vault rates')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching vault rates:', error)
    return []
  }
}

// Calculate spending by category from transactions
export function calculateSpending(transactions: Transaction[]): { name: string; amount: number; percentage: number; color: string }[] {
  const outgoing = transactions.filter(t => t.type === 'outgoing')
  const total = outgoing.reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  const categoryColors: Record<string, string> = {
    shopping: 'var(--accent)',
    food: 'var(--accent-secondary)',
    transport: 'var(--accent-tertiary)',
    entertainment: 'var(--muted)',
    bills: 'var(--muted-foreground)',
  }
  
  const categoryTotals: Record<string, number> = {}
  outgoing.forEach(t => {
    const category = t.category || 'other'
    categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(t.amount)
  })
  
  return Object.entries(categoryTotals)
    .map(([name, amount]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      color: categoryColors[name] || 'var(--muted-foreground)'
    }))
    .sort((a, b) => b.amount - a.amount)
}
