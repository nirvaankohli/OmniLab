import { useState } from 'react'
import Layout from './components/Layout'
import STLViewer from './components/STLViewer'
import FileUploader from './components/FileUploader'
import PathPlanner from './components/PathPlanner'

function App() {
  const [view, setView] = useState('config') // 'config' | 'planner'
  const [modelUrl, setModelUrl] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [points, setPoints] = useState([])
  const [activeType, setActiveType] = useState('intake') 

  const handlePointAdd = (point) => {
    setPoints([...points, { position: point, type: activeType }])
  }

  const renderConfigControls = () => (
    <div style={{
      position: 'absolute',
      top: '32px',
      left: '32px',
      // Minimalist panel
      background: 'transparent',
      minWidth: '300px'
    }}>
       <h3 style={{ 
         margin: '0 0 0.25rem 0', 
         color: 'var(--text-main)', 
         fontSize: '1.5rem', 
         fontFamily: 'var(--font-serif)',
         fontWeight: 'normal'
       }}>
         Configuration
       </h3>
       <p style={{ margin: '0 0 2rem 0', fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
         {fileName || 'No file selected'}
       </p>
       
       <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
         <div>
           <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-sans)' }}>
             Point Type
           </span>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
             {['intake', 'middle', 'top', 'bottom'].map(type => {
               const isActive = activeType === type;
               return (
                <button
                  key={type}
                  style={{
                    padding: '0.4rem 0.8rem',
                    background: isActive ? 'var(--primary)' : 'transparent',
                    border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                    color: isActive ? '#1a1918' : 'var(--text-muted)', // Dark text on active primary
                    borderRadius: '20px', // Pill shape
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    fontFamily: 'var(--font-sans)'
                  }}
                  onClick={() => setActiveType(type)}
                >
                  {type}
                </button>
               )
             })}
           </div>
         </div>

         {points.length > 0 && (
           <div>
             <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-sans)' }}>
               Active Points
             </span>
             <div style={{ 
               background: 'transparent',
               padding: 0
             }}>
               {points.map((p, i) => (
                 <div key={i} style={{ 
                   display: 'flex', 
                   justifyContent: 'space-between', 
                   alignItems: 'center',
                   fontSize: '0.9rem', 
                   padding: '0.25rem 0',
                   borderBottom: '1px solid var(--border-subtle)',
                   fontFamily: 'var(--font-sans)'
                 }}>
                   <span style={{ textTransform: 'capitalize', color: 'var(--text-main)' }}>
                     {p.type}
                   </span>
                   <button 
                     onClick={() => setPoints(points.filter((_, idx) => idx !== i))}
                     style={{ 
                       background: 'transparent', 
                       border: 'none', 
                       color: 'var(--text-muted)', 
                       cursor: 'pointer',
                       fontSize: '0.8rem'
                     }}
                   >
                     Remove
                   </button>
                 </div>
               ))}
             </div>
           </div>
         )}
         
         <button 
             onClick={() => { setModelUrl(null); setPoints([]); }}
             style={{
               background: 'transparent',
               border: 'none',
               color: 'var(--text-muted)',
               padding: 0,
               cursor: 'pointer',
               width: 'fit-content',
               fontSize: '0.85rem',
               textDecoration: 'underline',
               textUnderlineOffset: '4px',
               opacity: 0.7,
               alignSelf: 'flex-start'
             }}
           >
             Start over
           </button>
       </div>
    </div>
  );

  return (
    <Layout currentView={view} onViewChange={setView}>
      <div style={{ height: '100%', width: '100%', position: 'relative' }}>
        {view === 'config' ? (
           modelUrl ? (
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              <STLViewer 
                fileUrl={modelUrl} 
                points={points}
                activeType={activeType}
                onPointAdd={handlePointAdd}
              />
              {renderConfigControls()}
            </div>
          ) : (
            <div style={{ 
              width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '2rem', height: '100%'
            }}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ 
                    color: 'var(--text-main)', 
                    marginBottom: '1rem', 
                    fontFamily: 'var(--font-serif)', 
                    fontSize: '2.5rem',
                    fontWeight: 'normal',
                    letterSpacing: '-0.03em'
                }}>
                    Start Project
                </h2>
                <p style={{ 
                    maxWidth: '450px', 
                    margin: '0 auto', 
                    color: 'var(--text-muted)', 
                    fontSize: '1.1rem',
                    fontFamily: 'var(--font-serif)',
                    lineHeight: '1.6'
                }}>
                  Upload your robot's CAD file to begin.
                </p>
              </div>
              <div style={{ width: '450px' }}>
                <FileUploader onFileSelect={(url, name) => {
                  setModelUrl(url)
                  setFileName(name)
                }} />
              </div>
            </div>
          )
        ) : (
            <PathPlanner modelUrl={modelUrl} />
        )}
      </div>
    </Layout>
  )
}

export default App
