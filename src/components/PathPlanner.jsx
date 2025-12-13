import React, { useState, useRef, Suspense } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Html } from '@react-three/drei';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';

const Waypoint = ({ position }) => {
    return (
        <mesh position={position}>
            <sphereGeometry args={[2, 16, 16]} />
            <meshStandardMaterial color="#d97757" />
        </mesh>
    );
};

const Path = ({ points }) => {
    if (points.length < 2) return null;
    return (
        <Line 
            points={points} 
            color="#e6b9a6" 
            lineWidth={3} 
        />
    );
};

const RobotModel = ({ url, position, rotation }) => {
    const geom = useLoader(STLLoader, url);
    return (
        <mesh 
            geometry={geom} 
            position={position} 
            rotation={rotation}
            scale={[0.5, 0.5, 0.5]} 
            castShadow
        >
            <meshStandardMaterial color="#d97757" />
        </mesh>
    );
};

// Extracted to separate component to allow Suspense to work on just this part
const FieldModel = ({ field, onClick }) => {
    const texture = useLoader(TextureLoader, `/fields/${field}`);
    return (
        <mesh position={[0, 0, -1]} onClick={onClick}>
            <planeGeometry args={[144, 144]} /> 
            <meshBasicMaterial map={texture} />
        </mesh>
    );
};

const AnimationController = ({ points, modelUrl, isPlaying, onAnimationComplete }) => {
    const [currentPos, setCurrentPos] = useState(points[0] || [0,0,0]);
    const [currentRot, setCurrentRot] = useState([-Math.PI / 2, 0, 0]);
    const progress = useRef(0);

    useFrame((state, delta) => {
        if (!isPlaying || points.length < 2) return;

        progress.current += (delta * 0.2); // 5 seconds to complete path
        if (progress.current >= 1) {
            progress.current = 0;
            onAnimationComplete();
            return;
        }

        const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p.x, p.y, p.z)));
        const point = curve.getPoint(progress.current);
        const tangent = curve.getTangent(progress.current);
        
        setCurrentPos(point);
        
        const angle = Math.atan2(tangent.y, tangent.x);
        setCurrentRot([-Math.PI / 2, 0, angle]); 
    });

    if (!modelUrl) return null;
    return <RobotModel url={modelUrl} position={currentPos} rotation={currentRot} />;
};

const PathPlanner = ({ modelUrl }) => {
    const [waypoints, setWaypoints] = useState([]);
    const [field, setField] = useState('match2026.png'); 
    const [isPlaying, setIsPlaying] = useState(false);

    const handlePlaneClick = (e) => {
        if(isPlaying) return;
        setWaypoints([...waypoints, e.point]);
    };

    return (
        <div style={{ width: '100%', height: '100%', background: '#191817', position: 'relative' }}>
             <Canvas orthographic camera={{ zoom: 5, position: [0, 0, 100] }}>
                <Suspense fallback={<Html center><div style={{color: 'white'}}>Loading Field...</div></Html>}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />
                    
                    <FieldModel field={field} onClick={handlePlaneClick} />
                    
                    <Grid position={[0, 0, 0]} args={[144, 144]} cellColor="white" sectionColor="white" sectionSize={24} cellSize={12} fadeDistance={200} infiniteGrid />

                    {waypoints.map((p, i) => (
                        <Waypoint key={i} position={p} />
                    ))}
                    <Path points={waypoints} />
                    
                    {modelUrl && (
                        <AnimationController 
                            points={waypoints} 
                            modelUrl={modelUrl} 
                            isPlaying={isPlaying} 
                            onAnimationComplete={() => setIsPlaying(false)} 
                        />
                    )}

                    <OrbitControls enableRotate={false} />
                </Suspense>
             </Canvas>
             
             <div style={{ 
                 position: 'absolute', 
                 top: 24, 
                 left: 24, 
                 background: 'rgba(38, 37, 36, 0.8)', 
                 backdropFilter: 'blur(8px)',
                 padding: '1.5rem', 
                 borderRadius: '12px',
                 minWidth: '240px'
             }}>
                 <h3 style={{ 
                     margin: '0 0 1rem 0', 
                     fontFamily: 'var(--font-serif)', 
                     fontSize: '1.25rem', 
                     color: 'var(--text-main)',
                     fontWeight: 'normal'
                 }}>
                     Path Planner
                 </h3>
                 
                 <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Select Field
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                            onClick={() => setField('match2026.png')}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                background: field === 'match2026.png' ? 'var(--primary)' : 'transparent',
                                border: field === 'match2026.png' ? '1px solid var(--primary)' : '1px solid var(--border)',
                                color: field === 'match2026.png' ? '#1a1918' : 'var(--text-muted)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                            }}
                        >
                            Match
                        </button>
                        <button 
                            onClick={() => setField('skills2026.png')}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                background: field === 'skills2026.png' ? 'var(--primary)' : 'transparent',
                                border: field === 'skills2026.png' ? '1px solid var(--primary)' : '1px solid var(--border)',
                                color: field === 'skills2026.png' ? '#1a1918' : 'var(--text-muted)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                            }}
                        >
                            Skills
                        </button>
                    </div>
                 </div>

                 <div style={{ display: 'flex', gap: '0.5rem' }}>
                     <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={waypoints.length < 2 || !modelUrl}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            background: isPlaying ? 'transparent' : 'var(--text-main)', 
                            border: isPlaying ? '1px solid var(--text-main)' : 'none',
                            color: isPlaying ? 'var(--text-main)' : '#000',
                            borderRadius: '24px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            opacity: (waypoints.length < 2 || !modelUrl) ? 0.5 : 1,
                            fontFamily: 'var(--font-sans)',
                            fontWeight: 500
                        }}
                     >
                        {isPlaying ? 'Pause' : 'Play Path'}
                     </button>
                     <button 
                        onClick={() => setWaypoints([])}
                        style={{
                            padding: '0.75rem',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            color: 'var(--text-muted)',
                            borderRadius: '24px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontFamily: 'var(--font-sans)'
                        }}
                     >
                        Clear
                     </button>
                 </div>
                 
                 {!modelUrl && (
                     <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#e6b9a6', fontFamily: 'var(--font-sans)', fontStyle: 'italic' }}>
                         * Upload a robot STL to enable animation
                     </p>
                 )}
             </div>
        </div>
    );
};

export default PathPlanner;
