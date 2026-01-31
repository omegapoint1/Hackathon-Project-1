import React, { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const quickActions = [
  { label: 'Check balance', prompt: 'What is my current account balance?', icon: 'wallet' },
  { label: 'Recent spending', prompt: 'Show me my recent spending breakdown', icon: 'chart' },
  { label: 'Transfer funds', prompt: 'I want to transfer money', icon: 'transfer' },
  { label: 'Bill reminders', prompt: 'Do I have any upcoming bills?', icon: 'bell' },
]

const icons: Record<string, JSX.Element> = {
  wallet: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  chart: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  transfer: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  bell: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
}

export function AIHelper() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isExpanded && !wsRef.current) {
      connectWebSocket()
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [isExpanded])

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        setIsConnected(true)
        console.log('[v0] WebSocket connected')
      }
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'message' || data.content) {
            const content = data.content || data.message || event.data
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: content,
              timestamp: new Date()
            }])
            setIsLoading(false)
          }
        } catch {
          // Plain text response
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: event.data,
            timestamp: new Date()
          }])
          setIsLoading(false)
        }
      }
      
      ws.onclose = () => {
        setIsConnected(false)
        wsRef.current = null
        console.log('[v0] WebSocket disconnected')
      }
      
      ws.onerror = (error) => {
        console.error('[v0] WebSocket error:', error)
        setIsConnected(false)
      }
      
      wsRef.current = ws
    } catch (error) {
      console.error('[v0] Failed to connect WebSocket:', error)
    }
  }

  const sendMessage = (content: string) => {
    if (!content.trim()) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'message',
        content: content.trim() 
      }))
    } else {
      // Simulate response if not connected
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm currently unable to connect to the server. Please make sure you're logged in and the backend is running.",
          timestamp: new Date()
        }])
        setIsLoading(false)
      }, 500)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(inputValue)
  }

  const handleQuickAction = (prompt: string) => {
    setIsExpanded(true)
    setTimeout(() => {
      sendMessage(prompt)
    }, 100)
  }

  return (
    <div className={`card ai-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="ai-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="ai-title">
          <div className="ai-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
              <circle cx="8" cy="14" r="1.5" />
              <circle cx="16" cy="14" r="1.5" />
            </svg>
          </div>
          <div>
            <h2>Nim Assistant</h2>
            <p className="ai-subtitle">
              {isConnected ? 'Connected' : 'Your financial AI helper'}
            </p>
          </div>
        </div>
        <button className="expand-btn" onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
      
      {!isExpanded && (
        <div className="ai-preview">
          <div className="ai-message">
            <p>Hi! I can help you manage your finances. Try asking me about your spending habits or upcoming bills.</p>
          </div>
          
          <div className="quick-actions">
            {quickActions.map((action) => (
              <button 
                key={action.label} 
                className="quick-action-btn" 
                onClick={(e) => {
                  e.stopPropagation()
                  handleQuickAction(action.prompt)
                }}
              >
                {icons[action.icon]}
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {isExpanded && (
        <div className="chat-interface">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="chat-welcome">
                <p>Ask me anything about your finances!</p>
                <div className="chat-suggestions">
                  {quickActions.map((action) => (
                    <button 
                      key={action.label}
                      className="suggestion-btn"
                      onClick={() => sendMessage(action.prompt)}
                    >
                      {icons[action.icon]}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="message-avatar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                    </svg>
                  </div>
                )}
                <div className="message-content">
                  {msg.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="chat-message assistant">
                <div className="message-avatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                  </svg>
                </div>
                <div className="message-content typing">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <form className="chat-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Nim anything..."
              className="chat-input"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="chat-send-btn"
              disabled={!inputValue.trim() || isLoading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
