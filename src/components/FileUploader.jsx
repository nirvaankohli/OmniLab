import React, { useRef } from 'react';
import * as api from '../api';
import { useAuth } from '../context/AuthContext';

const FileUploader = ({ onFileSelect }) => {
  const { isAuthenticated } = useAuth();
  const inputRef = useRef(null);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [uploadStatus, setUploadStatus] = React.useState({ type: '', message: '' });
  const [stats, setStats] = React.useState({
    loadedMB: 0,
    totalMB: 0,
    speed: 0,
    eta: 0
  });

  const startTimeRef = useRef(0);
  const lastUpdateRef = useRef(0);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);
    setUploadStatus({ type: '', message: '' });
    startTimeRef.current = Date.now();
    lastUpdateRef.current = Date.now();

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const now = Date.now();
        const elapsed = (now - startTimeRef.current) / 1000;
        
        if (now - lastUpdateRef.current > 100) {
            const loadedMB = event.loaded / (1024 * 1024);
            const totalMB = event.total / (1024 * 1024);
            const speed = loadedMB / elapsed;
            const remainingMB = totalMB - loadedMB;
            const eta = speed > 0 ? remainingMB / speed : 0;
            
            setStats({
                loadedMB: loadedMB.toFixed(2),
                totalMB: totalMB.toFixed(2),
                speed: speed.toFixed(2),
                eta: Math.ceil(eta)
            });
            setProgress((event.loaded / event.total) * 100);
            lastUpdateRef.current = now;
        }
      }
    };

    reader.onload = async () => {
      setProgress(100);
      setStats(prev => ({ ...prev, eta: 0 }));
      
      const blob = new Blob([reader.result], { type: file.type });
      const localUrl = URL.createObjectURL(blob);

      // Upload to server if authenticated
      if (isAuthenticated) {
        try {
          setUploadStatus({ type: 'info', message: 'Saving to cloud...' });
          await api.uploadFile(file);
          setUploadStatus({ type: 'success', message: 'Saved to cloud!' });
        } catch (err) {
          setUploadStatus({ type: 'error', message: err.message || 'Failed to save' });
        }
      }

      setTimeout(() => {
        onFileSelect(localUrl, file.name);
        setLoading(false);
        setUploadStatus({ type: '', message: '' });
      }, isAuthenticated ? 1000 : 500);
    };

    reader.readAsArrayBuffer(file);
  };

  if (loading) {
      return (
        <div style={{
            padding: '4rem 2rem',
            borderRadius: '8px',
            textAlign: 'center',
            color: 'var(--text-main)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
            border: '1px solid var(--border)'
        }}>
           <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>
               {Math.round(progress)}%
           </div>
           
           <div style={{ width: '100%', maxWidth: '300px', height: '4px', background: 'var(--surface-hover)', borderRadius: '2px', overflow: 'hidden' }}>
               <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s' }} />
           </div>

           <div style={{ fontFamily: 'var(--font-sans)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
               {stats.loadedMB} MB / {stats.totalMB} MB
           </div>
           
           <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
               <span>Speed: {stats.speed} MB/s</span>
               <span>Est: {stats.eta}s</span>
           </div>

           {uploadStatus.message && (
             <div style={{
               marginTop: '0.5rem',
               fontSize: '0.85rem',
               fontFamily: 'var(--font-sans)',
               color: uploadStatus.type === 'success' ? '#22c55e' 
                    : uploadStatus.type === 'error' ? '#ef4444' 
                    : 'var(--text-muted)'
             }}>
               {uploadStatus.message}
             </div>
           )}
        </div>
      );
  }

  return (
    <div style={{
      padding: '4rem 2rem',
      borderRadius: '8px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      color: 'var(--text-muted)',
      backgroundColor: 'transparent',
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
        accept=".stl,.obj,.glb,.gltf" 
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
         <p style={{ margin: '0 0 0.5rem', fontFamily: 'var(--font-sans)', fontSize: '1rem', color: 'var(--text-main)' }}>Click to upload CAD file</p>
         <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
           .stl, .obj, .glb, .gltf supported
         </p>
         {isAuthenticated && (
           <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: 'var(--primary)', fontFamily: 'var(--font-sans)' }}>
             ✓ Will save to your account
           </p>
         )}
      </div>
    </div>
  );
};

export default FileUploader;
