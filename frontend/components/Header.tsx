import React from 'react'
import type { Profile } from '../services/api'

interface HeaderProps {
  onMenuClick: () => void
  profile: Profile | null
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Header({ onMenuClick, profile }: HeaderProps) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const firstName = profile?.name?.split(' ')[0] || ''
  const greeting = getGreeting()

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-btn mobile-only" onClick={onMenuClick}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="header-greeting">
          <h1>{greeting}{firstName ? `, ${firstName}` : ''}</h1>
          <p className="date">{currentDate}</p>
        </div>
      </div>
      
      <div className="header-right">
        <button className="icon-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notification-dot"></span>
        </button>
      </div>
    </header>
  )
}
