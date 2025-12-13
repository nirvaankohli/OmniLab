import React from 'react';
import Sidebar from './Sidebar';

const Layout = ({ children, currentView, onViewChange }) => {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--background)',
      color: 'var(--text-main)',
      overflow: 'hidden' 
    }}>
      <Sidebar currentView={currentView} onViewChange={onViewChange} />
      <main style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'var(--background)'
      }}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
