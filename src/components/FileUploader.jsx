import React, { useRef } from 'react';

const FileUploader = ({ onFileSelect }) => {
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onFileSelect(url, file.name);
    }
  };

  return (
    <div style={{
      padding: '4rem 2rem',
      // border: '1px solid var(--border)', // Optional: very subtle border
      borderRadius: '8px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: 'var(--text-muted)',
      backgroundColor: 'transparent', // Minimalist
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
      opacity: 0.8
    }}
    onClick={() => inputRef.current.click()}
    onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '0.8';
        e.currentTarget.style.transform = 'translateY(0)';
    }}
    >
      <input 
        type="file" 
        accept=".stl" 
        ref={inputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
      />
      <div style={{ 
          fontSize: '2rem',
          color: 'var(--primary)'
      }}>
        ✦
      </div>
      <div>
         <p style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--text-main)' }}>Click to upload STL</p>
         <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
           .stl format supported
         </p>
      </div>
    </div>
  );
};

export default FileUploader;
