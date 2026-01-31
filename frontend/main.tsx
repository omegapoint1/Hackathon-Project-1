import React from 'react'
import ReactDOM from 'react-dom/client'
import { NimChat } from '@liminalcash/nim-chat'
import '@liminalcash/nim-chat/styles.css'
import './styles.css'

function App() {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
  const apiUrl = import.meta.env.VITE_API_URL || 'https://api.liminal.cash'
  
  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      <NimChat
        wsUrl={wsUrl}
        apiUrl={apiUrl}
        title="Nim Financial Assistant"
        position="fullscreen" // or try removing position prop
        defaultOpen={true}
      />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />)
