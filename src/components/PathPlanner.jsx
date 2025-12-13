import React, { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Line, Html } from '@react-three/drei';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import * as THREE from 'three';

// --- Helper Functions ---
const toRadians = (deg) => deg * (Math.PI / 180);
const toDegrees = (rad) => rad * (180 / Math.PI);

const toGlobal = (localPoint, startPose) => {
    const thetaRad = toRadians(startPose.theta);
    const cos = Math.cos(thetaRad);
    const sin = Math.sin(thetaRad);
    return new THREE.Vector3(
        startPose.x + (localPoint.x * cos - localPoint.y * sin),
        startPose.y + (localPoint.x * sin + localPoint.y * cos),
        0
    );
};

const toLocal = (globalPoint, startPose) => {
    const thetaRad = toRadians(startPose.theta);
    const cos = Math.cos(thetaRad);
    const sin = Math.sin(thetaRad);
    const dx = globalPoint.x - startPose.x;
    const dy = globalPoint.y - startPose.y;
    return {
        x: dx * cos + dy * sin,
        y: -dx * sin + dy * cos
    };
};

// --- Components ---

const Waypoint = ({ position, index, onDragStart, onDragEnd, isDragging }) => {
    const color = isDragging ? "#e88c6e" : "#d97757";
    const scale = isDragging ? 1.2 : 1;

    return (
        <mesh 
            position={position} 
            onPointerDown={(e) => {
                e.stopPropagation();
                onDragStart(index);
            }}
            onPointerUp={(e) => {
                e.stopPropagation();
                onDragEnd();
            }}
            scale={[scale, scale, scale]}
            renderOrder={1} 
        >
            <sphereGeometry args={[2, 16, 16]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
};

const Path = ({ waypoints }) => {
    if (waypoints.length < 2) return null;
    
    // Build path with smoothing applied to smooth waypoints
    const pathPoints = [];
    
    for (let i = 0; i < waypoints.length; i++) {
        const wp = waypoints[i];
        const pos = wp.position;
        
        if (wp.smooth && i > 0 && i < waypoints.length - 1) {
            // For smooth points, create a small curve around the corner
            const prev = waypoints[i - 1].position;
            const next = waypoints[i + 1].position;
            
            // Generate bezier-like curve points
            const tension = 0.3;
            const p1 = new THREE.Vector3().lerpVectors(pos, prev, tension);
            const p2 = new THREE.Vector3().lerpVectors(pos, next, tension);
            
            const curve = new THREE.QuadraticBezierCurve3(p1, pos, p2);
            const curvePoints = curve.getPoints(8);
            pathPoints.push(...curvePoints);
        } else {
            pathPoints.push(new THREE.Vector3(pos.x, pos.y, pos.z));
        }
    }
    
    return (
        <Line 
            points={pathPoints} 
            color="#e6b9a6" 
            lineWidth={3} 
        />
    );
};

const RobotModel = ({ url, position, rotation, dimensions }) => {
    const geom = useLoader(STLLoader, url);
    const meshRef = useRef();
    
    useEffect(() => {
        if(meshRef.current) {
            meshRef.current.geometry.computeBoundingBox();
            const bbox = meshRef.current.geometry.boundingBox;
            const size = new THREE.Vector3();
            bbox.getSize(size);
            const scaleX = dimensions.x / (size.x || 1);
            const scaleY = dimensions.y / (size.y || 1);
            const scaleZ = dimensions.z / (size.z || 1);
            meshRef.current.scale.set(scaleX, scaleY, scaleZ);
            meshRef.current.geometry.center();
        }
    }, [geom, dimensions]);

    return (
        <mesh 
            ref={meshRef}
            geometry={geom} 
            position={position} 
            rotation={rotation}
            castShadow
        >
            <meshStandardMaterial color="#d97757" />
        </mesh>
    );
};

const FieldModel = ({ field, onClick, onPointerMove, onPointerUp }) => {
    const texture = useLoader(TextureLoader, `/fields/${field}`);
    return (
        <mesh 
            position={[0, 0, -1]} 
            onPointerDown={onClick} 
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp} 
        >
            <planeGeometry args={[144, 144]} /> 
            <meshBasicMaterial map={texture} />
        </mesh>
    );
};


const AnimationController = ({ points, modelUrl, isPlaying, onAnimationComplete, dimensions, rotations, startPose }) => {
    const [currentPos, setCurrentPos] = useState(points[0] || [0,0,0]);
    const [currentRot, setCurrentRot] = useState([-Math.PI / 2, 0, 0]);
    const progress = useRef(0);
    const { camera } = useThree();
    const initialCamPos = useRef(null);
    const initialCamZoom = useRef(null);

    const updateState = (progVal) => {
        if (points.length < 2) return;
        
        const p = Math.max(0, Math.min(1, progVal));
        const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p.x, p.y, p.z)));
        const point = curve.getPoint(p);
        setCurrentPos(point);
        
        const tangent = curve.getTangent(p);
        const tangentAngle = Math.atan2(tangent.y, tangent.x);
        
        let baseAngle = tangentAngle;

        // Smoothly blend from Start Pose Theta to Tangent Angle over the first 15% of path
        if (startPose) {
             const startRad = toRadians(startPose.theta);
             const blendDuration = 0.15;
             
             if (p < blendDuration) {
                 const t = p / blendDuration;
                 // Easing (SmoothStep)
                 const ease = t * t * (3 - 2 * t);
                 
                 // Shortest angle interpolation
                 let diff = tangentAngle - startRad;
                 diff = Math.atan2(Math.sin(diff), Math.cos(diff)); // Normalize to -PI to +PI
                 baseAngle = startRad + diff * ease;
             }
        }
        
        const x = toRadians(rotations.x);
        const y = toRadians(rotations.y);
        const z = baseAngle + toRadians(rotations.z);
        
        setCurrentRot([x, y, z]);

        if (isPlaying) {
            camera.position.set(point.x, point.y, 50);
            camera.lookAt(point.x, point.y, 0); 
            camera.zoom = 5; 
            camera.updateProjectionMatrix();
        }
    };

    useEffect(() => {
        if (isPlaying && !initialCamPos.current) {
            initialCamPos.current = camera.position.clone();
            initialCamZoom.current = camera.zoom;
        }
        if (!isPlaying && initialCamPos.current) {
             camera.position.copy(initialCamPos.current);
             camera.zoom = initialCamZoom.current;
             camera.lookAt(0,0,0);
             camera.updateProjectionMatrix();
             initialCamPos.current = null;
        }
    }, [isPlaying, camera]);

    // Live update when paused or parameters change
    useEffect(() => {
        if (!isPlaying) {
            updateState(progress.current);
        }
    }, [rotations, startPose, points, isPlaying]);

    useFrame((state, delta) => {
        if (isPlaying) {
            progress.current += (delta * 0.1); 
            if (progress.current >= 1) {
                progress.current = 0;
                onAnimationComplete();
                updateState(0);
                return;
            }
            updateState(progress.current);
        }
    });

    if (!modelUrl) return null;
    return <RobotModel url={modelUrl} position={currentPos} rotation={currentRot} dimensions={dimensions} />;
};

const PathPlanner = ({ modelUrl }) => {
    const [field, setField] = useState('match2026.png'); 
    const [isPlaying, setIsPlaying] = useState(false);
    const [activeTab, setActiveTab] = useState('setup'); 
    
    const [robotDims, setRobotDims] = useState({ x: 18, y: 18, z: 18 });
    const [rotations, setRotations] = useState({ x: 0, y: 0, z: 90 });
    const [startPose, setStartPose] = useState({ x: -60, y: -60, theta: 90 });
    const [waypoints, setWaypoints] = useState([{ position: new THREE.Vector3(-60, -60, 0), smooth: false }]);
    const [dragIndex, setDragIndex] = useState(-1);
    const [showRobot, setShowRobot] = useState(true);

    const handleStartPoseChange = (newKey, newValue) => {
        const val = parseFloat(newValue) || 0;
        const newPose = { ...startPose, [newKey]: val };
        setStartPose(newPose);
        
        // Update first waypoint if Start Pose position changes, but don't rotate others
        if (newKey === 'x' || newKey === 'y') {
            const newWps = [...waypoints];
            if (newWps.length > 0) {
                newWps[0] = {
                    ...newWps[0],
                    position: new THREE.Vector3(
                        newKey === 'x' ? val : newWps[0].position.x,
                        newKey === 'y' ? val : newWps[0].position.y,
                        newWps[0].position.z
                    )
                };
                setWaypoints(newWps);
            }
        }
    };

    const handlePlaneDown = (e) => {
        if(isPlaying) return;
        e.stopPropagation();
        if (dragIndex !== -1) return;
        const clickedPoint = e.point;
        clickedPoint.z = 0;
        setWaypoints([...waypoints, { position: clickedPoint, smooth: false }]);
    };

    const handlePlaneMove = (e) => {
       if (dragIndex !== -1 && !isPlaying) {
           e.stopPropagation();
           const point = e.point;
           point.z = 0;
           const newWps = [...waypoints];
           newWps[dragIndex] = { ...newWps[dragIndex], position: point };
           setWaypoints(newWps);
       }
    };

    const handleDragStart = (index) => {
        if(!isPlaying) setDragIndex(index);
    };
    
    const handleDragEnd = () => {
        setDragIndex(-1);
    };

    const handleWaypointEdit = (index, axis, value) => {
        const val = parseFloat(value) || 0;
        const currentGlobal = waypoints[index].position;
        const currentLocal = toLocal(currentGlobal, startPose);
        const newLocal = { ...currentLocal, [axis]: val };
        const newGlobal = toGlobal(newLocal, startPose);
        const newWps = [...waypoints];
        newWps[index] = { ...newWps[index], position: newGlobal };
        setWaypoints(newWps);
    };

    const toggleWaypointSmooth = (index) => {
        const newWps = [...waypoints];
        newWps[index] = { ...newWps[index], smooth: !newWps[index].smooth };
        setWaypoints(newWps);
    };

    // Extract positions for rendering
    const waypointPositions = waypoints.map(wp => wp.position);

    return (
        <div style={{ width: '100%', height: '100%', background: '#191817', position: 'relative' }}>
             <Canvas orthographic camera={{ zoom: 4, position: [0, 0, 100] }}>
                <Suspense fallback={<Html center><div style={{color: 'white'}}>Loading Field...</div></Html>}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 10]} intensity={1} />
                    
                    <FieldModel 
                        field={field} 
                        onClick={handlePlaneDown} 
                        onPointerMove={handlePlaneMove}
                        onPointerUp={handleDragEnd}
                    />
                    
                    <Grid position={[0, 0, 0]} args={[144, 144]} cellColor="white" sectionColor="white" sectionSize={24} cellSize={12} fadeDistance={200} infiniteGrid />

                    {waypoints.map((wp, i) => (
                        <Waypoint 
                            key={i} 
                            index={i}
                            position={wp.position} 
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            isDragging={dragIndex === i}
                        />
                    ))}
                    <Path waypoints={waypoints} />
                    
                    {modelUrl && showRobot && (
                        <AnimationController 
                            points={waypointPositions} 
                            modelUrl={modelUrl} 
                            isPlaying={isPlaying} 
                            onAnimationComplete={() => setIsPlaying(false)}
                            dimensions={robotDims}
                            rotations={rotations}
                            startPose={startPose}
                        />
                    )}

                    <OrbitControls enableRotate={false} enabled={!isPlaying && dragIndex === -1} />
                </Suspense>
             </Canvas>
             
             {/* Left Panel */}
             <div style={{ 
                 position: 'absolute', 
                 top: 24, 
                 left: 24, 
                 background: 'rgba(38, 37, 36, 0.95)', 
                 backdropFilter: 'blur(8px)',
                 padding: '1.25rem', 
                 borderRadius: '12px',
                 minWidth: '300px',
                 height: 'auto',
                 maxHeight: 'calc(100vh - 48px)',
                 display: 'flex',
                 flexDirection: 'column',
                 overflow: 'hidden'
             }}>
                 <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1rem', flexShrink: 0 }}>
                     {['Setup', 'Path'].map(tab => (
                         <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.toLowerCase() ? '2px solid var(--primary)' : '2px solid transparent',
                                color: activeTab === tab.toLowerCase() ? 'var(--text-main)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-serif)',
                                fontSize: '1rem'
                            }}
                         >
                             {tab}
                         </button>
                     ))}
                 </div>

                 {/* Scrollable Content Area */}
                 <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', paddingRight: '4px' }}>
                    {activeTab === 'setup' && (
                        <>
                           <div style={{ marginBottom: '1.5rem' }}>
                               <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                   Field & Robot
                               </span>
                               <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                   <button onClick={() => setField('match2026.png')} style={{ flex: 1, padding: '0.5rem', background: field.includes('match') ? 'var(--surface-hover)' : 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '4px', cursor: 'pointer' }}>Match</button>
                                   <button onClick={() => setField('skills2026.png')} style={{ flex: 1, padding: '0.5rem', background: field.includes('skills') ? 'var(--surface-hover)' : 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', borderRadius: '4px', cursor: 'pointer' }}>Skills</button>
                               </div>
                               
                               <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Robot Dims (in)</label>
                               <div style={{ display: 'flex', gap: '0.5rem' }}>
                                   {['x', 'y', 'z'].map(axis => (
                                       <input 
                                           key={axis}
                                           type="number" 
                                           value={robotDims[axis]} 
                                           onChange={(e) => setRobotDims({...robotDims, [axis]: parseFloat(e.target.value)})}
                                           style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px' }}
                                       />
                                   ))}
                               </div>
                               
                               <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '1rem', display: 'block' }}>Rotation Offsets (deg)</label>
                               <div style={{ display: 'flex', gap: '0.5rem' }}>
                                   {['x', 'y', 'z'].map(axis => (
                                       <input 
                                           key={axis}
                                           type="number" 
                                           value={rotations[axis]} 
                                           onChange={(e) => setRotations({...rotations, [axis]: parseFloat(e.target.value)})}
                                           style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px' }}
                                       />
                                   ))}
                               </div>
                               
                               <div style={{ marginTop: '1rem' }}>
                                   <button 
                                       onClick={() => setShowRobot(!showRobot)}
                                       style={{
                                           width: '100%',
                                           padding: '0.5rem',
                                           background: showRobot ? 'var(--surface-hover)' : 'transparent',
                                           border: '1px solid var(--border)',
                                           color: 'var(--text-main)',
                                           borderRadius: '4px',
                                           cursor: 'pointer',
                                           fontSize: '0.8rem'
                                       }}
                                   >
                                       {showRobot ? '👁 Robot Visible' : '👁‍🗨 Robot Hidden'}
                                   </button>
                               </div>
                           </div>

                           <div style={{ marginBottom: '1rem' }}>
                               <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                   Start Pose
                               </span>
                               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                   <div>
                                       <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>X (in)</label>
                                       <input type="number" value={startPose.x} onChange={(e) => handleStartPoseChange('x', e.target.value)} style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px' }} />
                                   </div>
                                   <div>
                                       <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Y (in)</label>
                                       <input type="number" value={startPose.y} onChange={(e) => handleStartPoseChange('y', e.target.value)} style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px' }} />
                                   </div>
                                   <div>
                                       <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Deg</label>
                                       <input type="number" value={startPose.theta} onChange={(e) => handleStartPoseChange('theta', e.target.value)} style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px' }} />
                                   </div>
                               </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'path' && (
                        <div style={{ marginBottom: '1.5rem' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                               <span style={{ fontSize: '0.75rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                   Waypoints (Relative)
                               </span>
                               <button onClick={() => setWaypoints([waypoints[0]])} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Clear All</button>
                           </div>
                           
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                               {waypoints.map((wp, i) => {
                                   const local = toLocal(wp.position, startPose);
                                   return (
                                       <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', padding: '0.5rem', background: 'var(--surface)', borderRadius: '6px' }}>
                                           <div style={{ width: '20px', height: '20px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>{i}</div>
                                           <div style={{ flex: 1 }}>
                                               <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                                   <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>X:</span>
                                                   <input 
                                                       type="number" 
                                                       value={Math.round(local.x * 10) / 10} 
                                                       onChange={(e) => handleWaypointEdit(i, 'x', e.target.value)}
                                                       style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.8rem', padding: '0 4px' }}
                                                   />
                                               </div>
                                               <div style={{ display: 'flex', gap: '4px' }}>
                                                   <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Y:</span>
                                                   <input 
                                                       type="number" 
                                                       value={Math.round(local.y * 10) / 10} 
                                                       onChange={(e) => handleWaypointEdit(i, 'y', e.target.value)}
                                                       style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.8rem', padding: '0 4px' }}
                                                   />
                                               </div>
                                           </div>
                                           <button 
                                               onClick={() => toggleWaypointSmooth(i)}
                                               style={{ 
                                                   background: wp.smooth ? 'var(--primary)' : 'transparent', 
                                                   border: '1px solid var(--border)', 
                                                   color: wp.smooth ? '#000' : 'var(--text-muted)', 
                                                   padding: '4px 8px', 
                                                   borderRadius: '4px', 
                                                   cursor: 'pointer', 
                                                   fontSize: '0.65rem',
                                                   textTransform: 'uppercase'
                                               }}
                                           >
                                               {wp.smooth ? 'Smooth' : 'Sharp'}
                                           </button>
                                           {i > 0 && (
                                               <button onClick={() => setWaypoints(waypoints.filter((_, idx) => idx !== i))} style={{ background: 'none', border: 'none', color: '#e6b9a6', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                                           )}
                                       </div>
                                   );
                               })}
                           </div>
                        </div>
                    )}
                 </div>
                
                 {/* Action Bar (Sticky Bottom) */}
                 <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', flexShrink: 0 }}>
                     <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        disabled={waypoints.length < 2 || !modelUrl}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: isPlaying ? 'transparent' : 'var(--primary)', // Use Primary Color for Action
                            border: isPlaying ? '1px solid var(--text-main)' : 'none',
                            color: isPlaying ? 'var(--text-main)' : '#000', // Black text on Primary (Orange)
                            borderRadius: '24px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontFamily: 'var(--font-sans)',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            opacity: (waypoints.length < 2 || !modelUrl) ? 0.5 : 1,
                            transition: 'all 0.2s'
                        }}
                     >
                        {isPlaying ? 'Pause Animation' : 'Play Path'}
                     </button>
                     {!modelUrl && <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#e6b9a6', marginTop: '0.5rem', fontStyle: 'italic' }}>* Upload robot to model path</p>}
                 </div>
             </div>
        </div>
    );
};

export default PathPlanner;
