import React, { useState } from 'react'
import type { Transaction } from '../services/api'

type TransactionFilter = 'all' | 'incoming' | 'outgoing'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading: boolean
}

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
  bills: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  const [filter, setFilter] = useState<TransactionFilter>('all')
  
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true
    return t.type === filter
  })

  if (isLoading) {
    return (
      <div className="card transactions-card">
        <div className="card-header">
          <h2>Recent Transactions</h2>
        </div>
        <div className="transactions-list">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="transaction-item skeleton-item">
              <div className="transaction-icon skeleton" />
              <div className="transaction-details">
                <span className="transaction-name skeleton">Loading...</span>
                <span className="transaction-desc skeleton">Loading...</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

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
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <div className={`transaction-icon ${transaction.category}`}>
                {categoryIcons[transaction.category] || categoryIcons.income}
              </div>
              <div className="transaction-details">
                <span className="transaction-name">{transaction.name}</span>
                <span className="transaction-desc">{transaction.description}</span>
              </div>
              <div className="transaction-meta">
                <span className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'incoming' ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
                </span>
                <span className="transaction-date">{transaction.date}</span>
              </div>
            </div>
          ))
        )}
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
