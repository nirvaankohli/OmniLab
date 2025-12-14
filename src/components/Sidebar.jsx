import React from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ currentView, onViewChange }) => {
  const { user, logout, isAuthenticated } = useAuth();

  const menuItems = [
    { id: 'config', label: 'Robot Config', icon: '✦' },
    { id: 'planner', label: 'Path Planner', icon: '〰' },
    { id: 'files', label: 'My Files', icon: '📁', requiresAuth: true },
  ];

  const visibleItems = menuItems.filter(item => 
    !item.requiresAuth || isAuthenticated
  );

  const handleLogout = async () => {
    await logout();
    onViewChange('config');
  };

  return (
    <aside style={{
      width: '240px',
      height: '100%',
      backgroundColor: 'var(--sidebar-bg)',
      borderRight: 'none',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1.5rem',
      boxSizing: 'border-box',
      flexShrink: 0
    }}>
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ 
          fontSize: '1.4rem', 
          fontFamily: 'var(--font-serif)',
          color: 'var(--text-main)', 
          margin: 0,
          letterSpacing: '-0.03em' 
        }}>
          Omni Lab
        </h1>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {visibleItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.5rem 0',
                backgroundColor: 'transparent',
                border: 'none',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '1rem',
                fontFamily: 'var(--font-sans)',
                fontWeight: isActive ? 500 : 400,
                transition: 'color 0.2s ease',
                opacity: isActive ? 1 : 0.7
              }}
              onMouseEnter={(e) => {
                if(!isActive) e.currentTarget.style.color = 'var(--text-main)';
              }}
              onMouseLeave={(e) => {
                if(!isActive) e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <span style={{ fontSize: '1.1em', color: isActive ? 'var(--primary)' : 'currentColor' }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto' }}>
        {isAuthenticated && user ? (
          <div style={{ 
            borderTop: '1px solid var(--border)',
            paddingTop: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'var(--text-main)', 
              fontFamily: 'var(--font-sans)',
              marginBottom: '0.25rem'
            }}>
              {user.username}
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)', 
              fontFamily: 'var(--font-sans)',
              marginBottom: '0.75rem'
            }}>
              {user.teamName}
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-sans)',
                padding: 0,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                opacity: 0.7,
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
            >
              Sign out
            </button>
          </div>
        ) : (
          <div style={{ 
            borderTop: '1px solid var(--border)',
            paddingTop: '1rem',
            marginTop: '1rem'
          }}>
            <button
              onClick={() => onViewChange('login')}
              style={{
                background: 'var(--primary)',
                border: 'none',
                color: '#1a1918',
                cursor: 'pointer',
                fontSize: '1rem',
                fontFamily: 'var(--font-sans)',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 500,
                width: '100%',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Sign in
            </button>
          </div>
        )}
        <div style={{ 
          fontSize: '0.8rem', 
          color: 'var(--text-muted)', 
          fontFamily: 'var(--font-sans)',
          marginTop: '1rem'
        }}>
          v0.1.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
