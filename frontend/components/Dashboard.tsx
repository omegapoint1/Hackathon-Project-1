import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { BalanceCard } from './BalanceCard'
import { TransactionList } from './TransactionList'
import { SpendingChart } from './SpendingChart'
import { AIHelper } from './AIHelper'
import { Header } from './Header'

export function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="dashboard">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="main-content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <div className="dashboard-grid">
          <section className="balance-section">
            <BalanceCard />
          </section>
          
          <section className="chart-section">
            <SpendingChart />
          </section>
          
          <section className="transactions-section">
            <TransactionList />
          </section>
          
          <section className="ai-section">
            <AIHelper />
          </section>
        </div>
      </main>
    </div>
  )
}
