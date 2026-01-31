import React, { useState } from 'react'

type TransactionType = 'all' | 'incoming' | 'outgoing'

interface Transaction {
  id: string
  name: string
  description: string
  amount: number
  type: 'incoming' | 'outgoing'
  date: string
  category: string
}

const transactions: Transaction[] = [
  { id: '1', name: 'Salary Deposit', description: 'Monthly salary', amount: 5200.00, type: 'incoming', date: 'Today', category: 'income' },
  { id: '2', name: 'Amazon', description: 'Online shopping', amount: -127.54, type: 'outgoing', date: 'Today', category: 'shopping' },
  { id: '3', name: 'Netflix', description: 'Subscription', amount: -15.99, type: 'outgoing', date: 'Yesterday', category: 'entertainment' },
  { id: '4', name: 'Transfer from Sarah', description: 'Shared dinner', amount: 45.00, type: 'incoming', date: 'Yesterday', category: 'transfer' },
  { id: '5', name: 'Whole Foods', description: 'Groceries', amount: -89.32, type: 'outgoing', date: 'Jan 28', category: 'food' },
  { id: '6', name: 'Uber', description: 'Ride to airport', amount: -34.50, type: 'outgoing', date: 'Jan 27', category: 'transport' },
  { id: '7', name: 'Freelance Payment', description: 'Design project', amount: 850.00, type: 'incoming', date: 'Jan 26', category: 'income' },
]

const categoryIcons: Record<string, JSX.Element> = {
  income: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  shopping: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  entertainment: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  ),
  transfer: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  food: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  transport: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14v-4a6 6 0 0 0-6-6H11a6 6 0 0 0-6 6v4z" />
      <path d="M7 17v4" />
      <path d="M17 17v4" />
      <path d="M5 13l-2 0" />
      <path d="M21 13l-2 0" />
    </svg>
  ),
}

export function TransactionList() {
  const [filter, setFilter] = useState<TransactionType>('all')
  
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true
    return t.type === filter
  })

  return (
    <div className="card transactions-card">
      <div className="card-header">
        <h2>Recent Transactions</h2>
        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-tab ${filter === 'incoming' ? 'active' : ''}`}
            onClick={() => setFilter('incoming')}
          >
            Incoming
          </button>
          <button 
            className={`filter-tab ${filter === 'outgoing' ? 'active' : ''}`}
            onClick={() => setFilter('outgoing')}
          >
            Outgoing
          </button>
        </div>
      </div>
      
      <div className="transactions-list">
        {filteredTransactions.map((transaction) => (
          <div key={transaction.id} className="transaction-item">
            <div className={`transaction-icon ${transaction.category}`}>
              {categoryIcons[transaction.category]}
            </div>
            <div className="transaction-details">
              <span className="transaction-name">{transaction.name}</span>
              <span className="transaction-desc">{transaction.description}</span>
            </div>
            <div className="transaction-meta">
              <span className={`transaction-amount ${transaction.type}`}>
                {transaction.type === 'incoming' ? '+' : ''}{transaction.amount < 0 ? '-' : ''}${Math.abs(transaction.amount).toFixed(2)}
              </span>
              <span className="transaction-date">{transaction.date}</span>
            </div>
          </div>
        ))}
      </div>
      
      <button className="view-all-btn">
        View all transactions
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  )
}
