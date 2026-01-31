import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { BalanceCard } from './BalanceCard'
import { TransactionList } from './TransactionList'
import { SpendingChart } from './SpendingChart'
import { AIHelper } from './AIHelper'
import { Header } from './Header'
import { useBankingData } from '../hooks/useBankingData'

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { balance, transactions, profile, spending, isLoading, error, refetch } = useBankingData()

  return (
    <div className="dashboard">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        profile={profile}
      />
      
      <main className="main-content">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          profile={profile}
        />
        
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={refetch}>Retry</button>
          </div>
        )}
        
        <div className="dashboard-grid">
          <section className="balance-section">
            <BalanceCard balance={balance} isLoading={isLoading} />
          </section>
          
          <section className="chart-section">
            <SpendingChart spending={spending} isLoading={isLoading} />
          </section>
          
          <section className="transactions-section">
            <TransactionList transactions={transactions} isLoading={isLoading} />
          </section>
          
          <section className="ai-section">
            <AIHelper />
          </section>
        </div>
      </main>
    </div>
  )
}
