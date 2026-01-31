// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Login } from './components/Login';  // Your full-page login
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Login
      wsUrl = {import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'}
      apiUrl = {import.meta.env.VITE_API_URL || 'https://api.liminal.cash'}
      title="Nim"
    />
  </React.StrictMode>
);


