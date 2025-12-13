import React from 'react';

const Sidebar = ({ currentView, onViewChange }) => {
  const menuItems = [
    { id: 'config', label: 'Robot Config', icon: '✦' }, // Spark icon preference
    { id: 'planner', label: 'Path Planner', icon: '〰' },
  ];

  return (
    <aside style={{
      width: '240px',
      height: '100%',
      backgroundColor: 'var(--sidebar-bg)',
      // borderRight: '1px solid var(--border)', // Minimalist: maybe remove border or keep it very subtle
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
        {/* Removed subtitle for cleaner look */}
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {menuItems.map((item) => {
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
                padding: '0.5rem 0', // Vertical breathing, no horizontal padding
                backgroundColor: 'transparent', // No background blocks
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
         {/* User or status section could go here, kept very minimal */}
         <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
           v0.1.0
         </div>
      </div>
    </aside>
  );
};

export default Sidebar;
