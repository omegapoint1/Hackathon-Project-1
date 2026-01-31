import React from 'react'

interface SpendingCategory {
  name: string
  amount: number
  percentage: number
  color: string
}

const spendingData: SpendingCategory[] = [
  { name: 'Shopping', amount: 845.50, percentage: 35, color: 'var(--accent)' },
  { name: 'Food & Dining', amount: 523.20, percentage: 22, color: 'var(--accent-secondary)' },
  { name: 'Transport', amount: 312.00, percentage: 13, color: 'var(--accent-tertiary)' },
  { name: 'Entertainment', amount: 245.80, percentage: 10, color: 'var(--muted)' },
  { name: 'Bills & Utilities', amount: 480.00, percentage: 20, color: 'var(--muted-foreground)' },
]

export function SpendingChart() {
  const total = spendingData.reduce((acc, item) => acc + item.amount, 0)
  
  // Calculate stroke-dasharray for each segment
  const circumference = 2 * Math.PI * 45
  let cumulativePercentage = 0
  
  const segments = spendingData.map((item, index) => {
    const dashArray = (item.percentage / 100) * circumference
    const dashOffset = circumference - (cumulativePercentage / 100) * circumference
    cumulativePercentage += item.percentage
    return { ...item, dashArray, dashOffset, index }
  })

  return (
    <div className="card spending-card">
      <div className="card-header">
        <h2>Monthly Spending</h2>
        <span className="card-subtitle">January 2026</span>
      </div>
      
      <div className="spending-content">
        <div className="chart-container">
          <svg viewBox="0 0 100 100" className="donut-chart">
            {segments.map((segment, i) => (
              <circle
                key={segment.name}
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={segment.color}
                strokeWidth="10"
                strokeDasharray={`${segment.dashArray} ${circumference}`}
                strokeDashoffset={segment.dashOffset}
                style={{ 
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                  transition: 'stroke-dasharray 0.5s ease'
                }}
              />
            ))}
          </svg>
          <div className="chart-center">
            <span className="chart-total-label">Total</span>
            <span className="chart-total-amount">${total.toFixed(0)}</span>
          </div>
        </div>
        
        <div className="spending-legend">
          {spendingData.map((item) => (
            <div key={item.name} className="legend-item">
              <div className="legend-color" style={{ backgroundColor: item.color }} />
              <div className="legend-details">
                <span className="legend-name">{item.name}</span>
                <span className="legend-amount">${item.amount.toFixed(2)}</span>
              </div>
              <span className="legend-percentage">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
