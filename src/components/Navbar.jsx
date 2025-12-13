import React from 'react';

const Navbar = () => {
  return (
    <nav style={{
      height: '60px',
      backgroundColor: 'var(--dark)',
      borderBottom: '1px solid var(--transparent-light)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 2rem',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 'bold', 
          color: 'var(--primary)',
          margin: 0
        }}>
          Omni Lab
        </h1>
        <span style={{ color: 'var(--light)', opacity: 0.7, fontSize: '0.9rem' }}>
          VEX Path Planner
        </span>
      </div>
      <div>
        {/* Placeholder for future nav items or user profile */}
        <button style={{
          backgroundColor: 'transparent',
          border: '1px solid var(--primary)',
          color: 'var(--primary)',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.9rem',
          transition: 'all 0.2s'
        }}>
          Beta
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
