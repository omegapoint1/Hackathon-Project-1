import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChatInterface } from './ChatInterface'
import './styles.css'

function App() {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.liminal.cash'
  
  return <ChatInterface wsUrl={wsUrl} apiUrl={apiUrl} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
