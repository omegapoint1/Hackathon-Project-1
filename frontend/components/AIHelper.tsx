import { ChatPanel } from './ChatPanel';
import { useNimWebSocket } from '../hooks/useNimWebSocket';
import { getStoredTokens } from '../utils/auth';

interface AIHelperProps {
  wsUrl: string;
  title?: string;
}

export function AIHelper({ wsUrl, title = 'Nim' }: AIHelperProps) {
  const tokens = getStoredTokens();
  
  const {
    messages,
    isStreaming,
    connectionState,
    confirmationRequest,
    sendMessage,
    confirmAction,
    cancelAction,
  } = useNimWebSocket({
    wsUrl,
    jwt: tokens?.accessToken || null,
    onError: (error) => console.error('[AIHelper]', error),
  });

  return (
    <div className="ai-helper h-full">
      <div className="section-card h-full flex flex-col">
        <div className="ai-header">
          <h3 className="section-title">AI Assistant</h3>
          <div className="ai-status">
            {connectionState === 'connected' ? (
              <div className="status-indicator online">
                <span className="status-dot"></span>
                Online
              </div>
            ) : connectionState === 'connecting' ? (
              <div className="status-indicator connecting">
                <span className="status-dot"></span>
                Connecting...
              </div>
            ) : (
              <div className="status-indicator offline">
                <span className="status-dot"></span>
                Offline
              </div>
            )}
          </div>
        </div>
        
        <div className="ai-content flex-1 min-h-0">
          <ChatPanel
            title={title}
            messages={messages}
            isStreaming={isStreaming}
            connectionState={connectionState}
            confirmationRequest={confirmationRequest}
            onSendMessage={sendMessage}
            onConfirm={confirmAction}
            onCancel={cancelAction}
            onClose={() => {}}
            onLogout={() => {}}
          />
        </div>
      </div>
    </div>
  );
}