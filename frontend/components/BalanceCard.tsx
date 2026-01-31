import React from 'react'

export function BalanceCard() {
  return (
    <div className="card balance-card">
      <div className="balance-header">
        <span className="balance-label">Total Balance</span>
        <span className="balance-badge">Primary Account</span>
      </div>
      
      <div className="balance-amount">
        <span className="currency">$</span>
        <span className="amount">24,562</span>
        <span className="cents">.89</span>
      </div>
      
      <div className="balance-change positive">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        <span>+12.5% from last month</span>
      </div>
      
      <div className="balance-accounts">
        <div className="account-item">
          <div className="account-icon checking">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <div className="account-details">
            <span className="account-name">Checking</span>
            <span className="account-balance">$12,450.00</span>
          </div>
        </div>
        
        <div className="account-item">
          <div className="account-icon savings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="account-details">
            <span className="account-name">Savings</span>
            <span className="account-balance">$12,112.89</span>
          </div>
        </div>
      </div>
    </div>
  )
}
