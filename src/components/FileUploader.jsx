import React, { useRef } from 'react';

const FileUploader = ({ onFileSelect }) => {
  const inputRef = useRef(null);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [stats, setStats] = React.useState({
    loadedMB: 0,
    totalMB: 0,
    speed: 0, // MB/s
    eta: 0 // seconds
  });

  const startTimeRef = useRef(0);
  const lastUpdateRef = useRef(0);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setProgress(0);
    startTimeRef.current = Date.now();
    lastUpdateRef.current = Date.now();

    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const now = Date.now();
        const elapsed = (now - startTimeRef.current) / 1000; // seconds
        
        // Update stats at most every 100ms to avoid flicker
        if (now - lastUpdateRef.current > 100) {
            const loadedMB = event.loaded / (1024 * 1024);
            const totalMB = event.total / (1024 * 1024);
            const speed = loadedMB / elapsed; // MB/s
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

    reader.onload = () => {
      setProgress(100);
      setStats(prev => ({ ...prev, eta: 0 }));
      
      // Small delay to let user see 100%
      setTimeout(() => {
          const blob = new Blob([reader.result], { type: file.type });
          const url = URL.createObjectURL(blob);
          onFileSelect(url, file.name);
          setLoading(false);
      }, 500);
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
        </div>
      );
  }

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
