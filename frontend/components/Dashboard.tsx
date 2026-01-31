import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BalanceCard } from './BalanceCard';
import { AIHelper } from './AIHelper';
import { useBankingData } from '../utils/useBankingData';
import { clearStoredTokens } from '../utils/auth';
import type { NimChatProps } from '../types';

interface DashboardProps {
  wsUrl: string;
  apiUrl?: string;
  title?: string;
  onLogout: () => void;
}

export function Dashboard({ wsUrl, apiUrl = 'https://api.liminal.cash', title = 'Nim', onLogout }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { balance, transactions, profile, spending, savingsRate, isLoading, error, refetch } = useBankingData();

  // Close sidebar when window resizes to desktop size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Check on initial load
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`dashboard ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        profile={profile}
      />
      
      <main className="main-content">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          profile={profile}
          onLogout={onLogout}
          sidebarOpen={sidebarOpen}
        />
        
        <div className="dashboard-container">
          {error && (
            <div className="error-banner">
              <p>{error}</p>
              <button onClick={refetch}>Retry</button>
            </div>
          )}
          
          <div className="dashboard-grid">
          <section className="balance-section">
            <BalanceCard 
              title="Wallet Balance"
              amount={balance.wallet}
              loading={isLoading}
              currency={balance.currency}
              icon="wallet"
            />
            <BalanceCard 
              title="Savings Balance"
              amount={balance.savings}
              loading={isLoading}
              currency={balance.currency}
              icon="savings"
              rate={savingsRate}
            />
          </section>
          
          <section className="ai-section">
            <AIHelper wsUrl={wsUrl} />
          </section>
          
          <section className="transactions-section">
            <div className="section-card">
              <h3 className="section-title">Recent Transactions</h3>
              <div className="transactions-list">
                {isLoading ? (
                  <div className="loading-placeholder">Loading transactions...</div>
                ) : transactions.length > 0 ? (
                  transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="transaction-item">
                      <div className="transaction-info">
                        <div className="transaction-description">{transaction.description}</div>
                        <div className="transaction-date">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`transaction-amount ${transaction.type}`}>
                        {transaction.type === 'send' || transaction.type === 'withdrawal' ? '-' : '+'}
                        ${transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No transactions found</div>
                )}
              </div>
            </div>
          </section>
          
          <section className="spending-section">
            <div className="section-card">
              <h3 className="section-title">Spending Overview</h3>
              <div className="spending-chart">
                {isLoading ? (
                  <div className="loading-placeholder">Loading spending data...</div>
                ) : spending.length > 0 ? (
                  spending.map((category, index) => (
                    <div key={index} className="spending-item">
                      <div className="spending-info">
                        <span className="spending-category">{category.category}</span>
                        <span className="spending-amount">${category.amount}</span>
                      </div>
                      <div className="spending-bar">
                        <div 
                          className="spending-fill" 
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <span className="spending-percentage">{category.percentage}%</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No spending data available</div>
                )}
              </div>
            </div>
          </section>
        </div>
        </div>
      </main>
    </div>
  );
}