import React, { useRef, useMemo } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OrbitControls, Center, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';

const Model = ({ url, onClick }) => {
  const geom = useLoader(STLLoader, url);
  
  return (
    <mesh 
      geometry={geom} 
      rotation={[-Math.PI / 2, 0, 0]} 
      castShadow 
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        onClick(e.point);
      }}
    >
      <meshStandardMaterial color="#eb5755" roughness={0.5} />
    </mesh>
  );
};

const Marker = ({ position, type }) => {
  const color = type === 'intake' ? '#5cce6c' : '#726ee0'; // Green for intake, Purple for outtake
  return (
    <mesh position={position}>
      <sphereGeometry args={[2, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );
};

const STLViewer = ({ fileUrl, points = [], onPointAdd, activeType }) => {
  return (
    <div style={{ width: '100%', height: '100%', background: '#111' }}>
      <Canvas shadows camera={{ position: [100, 100, 100], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Center top>
           {fileUrl && <Model url={fileUrl} onClick={(point) => onPointAdd && activeType && onPointAdd(point)} />}
           {points.map((p, i) => (
             <Marker key={i} position={p.position} type={p.type} />
           ))}
        </Center>
        
        <Grid infiniteGrid sectionColor="#4d4d4d" cellColor="#333333" fadeDistance={200} />
        
        <OrbitControls makeDefault />
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
           <GizmoViewport axisColors={['#eb5755', '#726ee0', '#5cce6c']} labelColor="black" />
        </GizmoHelper>
      </Canvas>
    </div>
  );
};

export default STLViewer;
