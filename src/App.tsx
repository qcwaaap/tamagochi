import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, useGLTF, OrbitControls } from "@react-three/drei";
import './App.css';
import { useTexture } from '@react-three/drei';


function Scene() {
  const [error, setError] = useState(null);
  
  try {
    const { scene } = useGLTF('/scene.gltf');
    
    useEffect(() => {
      console.log('Model loaded successfully:', scene);
    }, [scene]);
    
    return <primitive object={scene} />;
  } catch (err) {
    console.error('Error loading model:', err);
    return (
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    );
  }
}

useGLTF.preload('/scene.gltf');

const Main = () => {
  const camera = useThree((state) => state.camera)
  return <></>
}

function Ground() {
  const [textureError, setTextureError] = useState(false);
  
  const textures = useTexture({
    map: 'assets/sloppy-mortar-stone-wall-unity/sloppy-mortar-stone-wall_albedo.png',
    normalMap: '/assets/sloppy-mortar-stone-wall-unity/sloppy-mortar-stone-wall_normal-ogl.png',
    aoMap: 'assets/sloppy-mortar-stone-wall-unity/sloppy-mortar-stone-wall_ao.png', // если есть
  }, undefined, (err) => {
    console.error('Error loading textures:', err);
    setTextureError(true);
  });
  
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -1, 0]}
      receiveShadow
    >
      <planeGeometry args={[500, 500]} />
      {!textureError && textures.map ? (
        <meshStandardMaterial
          map={textures.map}
          normalMap={textures.normalMap}
          metalness={0.1}
        />
      ) : (
        <meshStandardMaterial color="#4a6a3b" roughness={0.8} metalness={0.1} />
      )}
    </mesh>
  );
}

const InterfaceBars = ({ hunger, energy, fatigue }) => {
  return (
    <div className="bars-container">
      <div className="bar-wrapper">
        <div
          className="bar"
          style={{
            width: `${hunger * 100}%`,
            backgroundColor: "rgba(200, 160, 120, 0.6)",
            boxShadow: hunger > 0.7 ? "0 0 8px rgba(200, 100, 50, 0.4)" : "none"
          }}
        />
      </div>
      <div className="bar-wrapper">
        <div
          className="bar"
          style={{
            width: `${energy * 100}%`,
            backgroundColor: "rgba(120, 200, 160, 0.6)",
            boxShadow: energy < 0.3 ? "0 0 8px rgba(50, 100, 200, 0.4)" : "none"
          }}
        />
      </div>
      <div className="bar-wrapper">
        <div
          className="bar"
          style={{
            width: `${fatigue * 100}%`,
            backgroundColor: "rgba(160, 120, 200, 0.6)",
            boxShadow: fatigue > 0.6 ? "0 0 8px rgba(100, 50, 150, 0.4)" : "none"
          }}
        />
      </div>
    </div>
  );
};

const PostEffects = ({ fatigue }) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTime(t => t + 0.05), 100);
    return () => clearInterval(interval);
  }, []);

  const darken = fatigue * 0.4;
  const grain = fatigue * 0.15;
  const vignette = fatigue * 0.3;
  const lightSpotIntensity = 0.1 + Math.sin(time * 0.5) * 0.05 + fatigue * 0.1;

  return (
    <>
      <div
        className="post-effects"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${darken})`,
          backdropFilter: `contrast(${1 - fatigue * 0.2}) brightness(${1 - fatigue * 0.15})`,
        }}
      />
      <div
        className="grain-overlay"
        style={{
          opacity: grain,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      <div
        className="light-spots"
        style={{
          opacity: lightSpotIntensity,
          background: `radial-gradient(circle at 30% 40%, rgba(255,220,150,0.15) 0%, transparent 50%),
                       radial-gradient(circle at 80% 70%, rgba(255,200,100,0.1) 0%, transparent 60%)`,
        }}
      />
      <div
        className="vignette"
        style={{
          opacity: vignette,
          boxShadow: `inset 0 0 ${100 + fatigue * 200}px rgba(0,0,0,${0.3 + fatigue * 0.5})`,
        }}
      />
    </>
  );
};

const ThoughtText = ({ show, onComplete }) => {
  const messages = [
    "Мысли текут медленно...",
    "Состояние покоя",
    "Желание тепла",
    "Где-то далеко шум...",
    "Сон на грани",
    "Присутствие ощущается",
    "Мысли спутаны",
    "Состояние без имени",
    "Желание без формы"
  ];

  const [currentMsg, setCurrentMsg] = useState("");
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const timeoutRef = useRef();

  useEffect(() => {
    if (show && !visible) {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setCurrentMsg(randomMsg);
      setVisible(true);
      
      setTimeout(() => setOpacity(1), 10);
      
      timeoutRef.current = setTimeout(() => {
        setOpacity(0);
        setTimeout(() => {
          setVisible(false);
          if (onComplete) onComplete();
        }, 1000);
      }, 4000);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [show]);

  if (!visible) return null;

  return (
    <div className="thought-text" style={{ opacity }}>
      {currentMsg}
    </div>
  );
};

const ActionButtons = ({ onFeed, onRest, onPlay, buttonsDisabled }) => {
  const [buttonStates, setButtonStates] = useState({ feed: false, rest: false, play: false });
  const [disabledState, setDisabledState] = useState({ feed: false, rest: false, play: false });

  useEffect(() => {
    if (buttonsDisabled) {
      const randomButton = ['feed', 'rest', 'play'][Math.floor(Math.random() * 3)];
      setDisabledState(prev => ({ ...prev, [randomButton]: true }));
      setTimeout(() => {
        setDisabledState({ feed: false, rest: false, play: false });
      }, 3000);
    }
  }, [buttonsDisabled]);

  const handleClick = (action) => {
    if (disabledState[action]) return;
    
    setButtonStates(prev => ({ ...prev, [action]: true }));
    setTimeout(() => {
      setButtonStates(prev => ({ ...prev, [action]: false }));
    }, 200);
    
    if (Math.random() > 0.3) {
      if (action === 'feed') onFeed();
      if (action === 'rest') onRest();
      if (action === 'play') onPlay();
    }
  };

  const buttons = [
    { id: 'feed', label: 'накормить', action: onFeed },
    { id: 'rest', label: 'успокоить', action: onRest },
    { id: 'play', label: 'погладить', action: onPlay }
  ];

  return (
    <div className="buttons-container">
      {buttons.map(btn => (
        <button
          key={btn.id}
          className={`action-button ${buttonStates[btn.id] ? 'pressed' : ''} ${disabledState[btn.id] ? 'disabled' : ''}`}
          onClick={() => handleClick(btn.id)}
          disabled={disabledState[btn.id]}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
};

function App() {
  const [hunger, setHunger] = useState(0.3);
  const [energy, setEnergy] = useState(0.8);
  const [fatigue, setFatigue] = useState(0.2);
  
  const [showThought, setShowThought] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setHunger(prev => Math.min(1, prev + 0.003));
      setEnergy(prev => Math.max(0, prev - 0.002));
      setFatigue(prev => Math.min(1, prev + (energy < 0.3 ? 0.005 : 0.001)));
      
      if (Math.random() > 0.98 && !showThought) {
        setShowThought(true);
      }
      
      if (Math.random() > 0.97 && !buttonsDisabled) {
        setButtonsDisabled(true);
        setTimeout(() => setButtonsDisabled(false), 3000);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [energy, showThought, buttonsDisabled]);
  
  const handleFeed = () => {
    setHunger(prev => Math.max(0, prev - 0.15));
    setEnergy(prev => Math.min(1, prev + 0.05));
  };
  
  const handleRest = () => {
    setFatigue(prev => Math.max(0, prev - 0.2));
    setEnergy(prev => Math.min(1, prev + 0.1));
  };
  
  const handlePlay = () => {
    setFatigue(prev => Math.min(1, prev + 0.1));
    setEnergy(prev => Math.max(0, prev - 0.05));
    setHunger(prev => Math.min(1, prev + 0.05));
  };
  
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#202050', position: 'relative', overflow: 'hidden' }}>
      {/* 3D Canvas */}
      <Canvas 
        camera={{ fov: 75, position: [-18, 36, 273], near: 0.1, far: 1000 }}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      >
        <Main/>
        <ambientLight intensity={0.5} />
        <Ground />
        
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        
        <Suspense fallback={
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="gray" />
          </mesh>
        }>
          <Scene />
        </Suspense>
        
        <OrbitControls />
      </Canvas>

      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, pointerEvents: 'none' }}>
        <InterfaceBars hunger={hunger} energy={energy} fatigue={fatigue} />
        <PostEffects fatigue={fatigue} />
        <ThoughtText show={showThought} onComplete={() => setShowThought(false)} />
      </div>

      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, zIndex: 3, pointerEvents: 'auto' }}>
        <ActionButtons 
          onFeed={handleFeed}
          onRest={handleRest}
          onPlay={handlePlay}
          buttonsDisabled={buttonsDisabled}
        />
      </div>
    </div>
  );
}

export default App;