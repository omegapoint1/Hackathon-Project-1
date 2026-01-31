import React from 'react'
import type { SpendingCategory } from '../hooks/useBankingData'

interface SpendingChartProps {
  spending: SpendingCategory[]
  isLoading: boolean
}

export function SpendingChart({ spending, isLoading }: SpendingChartProps) {
  const total = spending.reduce((acc, item) => acc + item.amount, 0)
  
  // Calculate stroke-dasharray for each segment
  const circumference = 2 * Math.PI * 45
  let cumulativePercentage = 0
  
  const segments = spending.map((item, index) => {
    const dashArray = (item.percentage / 100) * circumference
    const dashOffset = circumference - (cumulativePercentage / 100) * circumference
    cumulativePercentage += item.percentage
    return { ...item, dashArray, dashOffset, index }
  })

  // Get current month name
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  if (isLoading) {
    return (
      <div className="card spending-card">
        <div className="card-header">
          <h2>Monthly Spending</h2>
          <span className="card-subtitle">{currentMonth}</span>
        </div>
        <div className="spending-content">
          <div className="chart-container skeleton">
            <div className="chart-center">
              <span className="chart-total-label">Total</span>
              <span className="chart-total-amount">$---</span>
            </div>
          </div>
          <div className="spending-legend">
            {[1, 2, 3].map((i) => (
              <div key={i} className="legend-item skeleton">
                <div className="legend-color skeleton" />
                <div className="legend-details">
                  <span className="legend-name skeleton">Loading...</span>
                  <span className="legend-amount skeleton">$---.--</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // If no spending data, show empty state
  if (spending.length === 0) {
    return (
      <div className="card spending-card">
        <div className="card-header">
          <h2>Monthly Spending</h2>
          <span className="card-subtitle">{currentMonth}</span>
        </div>
        <div className="spending-content empty-state">
          <p>No spending data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card spending-card">
      <div className="card-header">
        <h2>Monthly Spending</h2>
        <span className="card-subtitle">{currentMonth}</span>
      </div>
      
      <div className="spending-content">
        <div className="chart-container">
          <svg viewBox="0 0 100 100" className="donut-chart">
            {segments.map((segment) => (
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
          {spending.map((item) => (
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
