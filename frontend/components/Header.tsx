interface HeaderProps {
  onMenuClick: () => void;
  profile?: {
    name?: string;
    email: string;
  };
  onLogout?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ onMenuClick, profile, onLogout, sidebarOpen = false }: HeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="header-left">
          <button
            onClick={onMenuClick}
            className="menu-button"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
          
          <h1 className="dashboard-title">Nim Dashboard</h1>
        </div>
        
        <div className="header-right">
          {profile && (
            <div className="profile-info">
              <span className="profile-name">{profile.name || profile.email}</span>
              <div className="profile-avatar">
                {(profile.name || profile.email).charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          
          {onLogout && (
            <button onClick={onLogout} className="logout-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}