import React, { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sky, useGLTF, OrbitControls, useTexture } from "@react-three/drei";
import * as THREE from 'three';
import './App.css';

function Scene({ fatigue, onInteract }) {
  const [error, setError] = useState(null);
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  let gltfResult = null;
  let loadError = null;
  try {
    gltfResult = useGLTF('/scene.gltf');
  } catch (err) {
    loadError = err;
  }
  const scene = gltfResult?.scene;

  useEffect(() => {
    if (scene) {
      console.log('модель загружена');
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    } else if (loadError) {
      console.error('ошибка загрузки модели:', loadError);
      setError(loadError);
    }
  }, [scene, loadError]);

  useFrame((state) => {
    if (meshRef.current) {
      const intensity = 0.02 * (1 - fatigue * 0.7);
      const speed = 0.8 + fatigue * 1.5;
      const scale = 1 + Math.sin(state.clock.elapsedTime * speed) * intensity;
      meshRef.current.scale.setScalar(scale);
      meshRef.current.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.emissiveIntensity = hovered ? 0.4 : 0.05;
        }
      });
    }
  });

  const handlePointerOver = () => setHovered(true);
  const handlePointerOut = () => setHovered(false);
  const handleClick = () => {
    if (onInteract) onInteract();
  };

  if (error || !scene) {
    return (
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="orange" />
      </mesh>
    );
  }

  return (
    <primitive
      ref={meshRef}
      object={scene}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}

useGLTF.preload('/scene.gltf');

const Main = () => {
  const camera = useThree((state) => state.camera);
  return <></>;
};

function Ground() {
  const [textureError, setTextureError] = useState(false);
  
  const textures = useTexture({
    map: '/assets/sloppy-mortar-stone-wall-unity/sloppy-mortar-stone-wall_albedo.png',
    normalMap: '/assets/sloppy-mortar-stone-wall-unity/sloppy-mortar-stone-wall_normal-ogl.png',
    aoMap: '/assets/sloppy-mortar-stone-wall-unity/sloppy-mortar-stone-wall_ao.png',
  }, undefined, (err) => {
    console.error('ошибка загрузки текстур:', err);
    setTextureError(true);
  });
  
  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.2, 0]}
        receiveShadow
      >
        <planeGeometry args={[20, 8]} />
        {!textureError && textures.map ? (
          <meshStandardMaterial
            map={textures.map}
            normalMap={textures.normalMap}
            aoMap={textures.aoMap}
            roughness={0.7}
            metalness={0.1}
          />
        ) : (
          <meshStandardMaterial color="#6b5b4a" roughness={0.7} metalness={0.1} />
        )}
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[12, -1.25, 0]}
        receiveShadow
      >
        <planeGeometry args={[6, 10]} />
        <meshStandardMaterial color="#4a6a3b" roughness={0.9} metalness={0.05} />
      </mesh>

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-12, -1.25, 0]}
        receiveShadow
      >
        <planeGeometry args={[6, 10]} />
        <meshStandardMaterial color="#4a6a3b" roughness={0.9} metalness={0.05} />
      </mesh>

      {[...Array(16)].map((_, i) => (
        <mesh
          key={i}
          position={[
            -10 + Math.random() * 20,
            -1.15,
            -3 + Math.random() * 6
          ]}
          rotation={[Math.random(), Math.random(), Math.random()]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[0.08 + Math.random() * 0.12, 0]} />
          <meshStandardMaterial color="#7a6b5a" roughness={0.6} metalness={0.05} />
        </mesh>
      ))}
    </group>
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
    "мысли текут медленно...",
    "состояние покоя",
    "желание тепла",
    "где-то далеко шум...",
    "сон на грани",
    "присутствие ощущается",
    "мысли спутаны",
    "состояние без имени",
    "желание без формы"
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

const ActionButtons = ({ onFeed, onRest, onPlay, buttonsDisabled, onSetWeatherSun, onSetWeatherWind, onSetWeatherRain }) => {
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

  const handleClick = (action, weatherSetter) => {
    if (disabledState[action]) return;
    
    setButtonStates(prev => ({ ...prev, [action]: true }));
    setTimeout(() => {
      setButtonStates(prev => ({ ...prev, [action]: false }));
    }, 200);
    
    if (Math.random() > 0.3) {
      if (action === 'feed') onFeed();
      if (action === 'rest') onRest();
      if (action === 'play') onPlay();
      if (weatherSetter) weatherSetter();
    }
  };

  const buttons = [
    { id: 'feed', label: 'накормить', action: onFeed, weather: onSetWeatherSun },
    { id: 'rest', label: 'успокоить', action: onRest, weather: onSetWeatherWind },
    { id: 'play', label: 'погладить', action: onPlay, weather: onSetWeatherRain }
  ];

  return (
    <div className="buttons-container">
      {buttons.map(btn => (
        <button
          key={btn.id}
          className={`action-button ${buttonStates[btn.id] ? 'pressed' : ''} ${disabledState[btn.id] ? 'disabled' : ''}`}
          onClick={() => handleClick(btn.id, btn.weather)}
          disabled={disabledState[btn.id]}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
};

function DynamicLighting({ targetWeather }) {
  const sunLightRef = useRef();
  const fillLightRef = useRef();
  const [currentWeather, setCurrentWeather] = useState(targetWeather);
  const [t, setT] = useState(1);

  useEffect(() => {
    if (targetWeather !== currentWeather) {
      let startTime = 0;
      const duration = 3000;
      const startWeather = currentWeather;
      const endWeather = targetWeather;
      const startConfig = getConfig(startWeather);
      const endConfig = getConfig(endWeather);
      
      let animFrame;
      const startAnimation = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / duration);
        setT(progress);
        if (progress < 1) {
          animFrame = requestAnimationFrame(startAnimation);
        } else {
          setCurrentWeather(endWeather);
          setT(1);
        }
      };
      animFrame = requestAnimationFrame(startAnimation);
      return () => cancelAnimationFrame(animFrame);
    } else {
      setT(1);
    }
  }, [targetWeather]);

  const getConfig = (weather) => {
    switch (weather) {
      case 'sun': return { mainIntensity: 1.2, mainColor: new THREE.Color('#ffdd99'), fillIntensity: 0.5, fillColor: new THREE.Color('#ffaa66'), ambient: 0.5 };
      case 'rain': return { mainIntensity: 0.5, mainColor: new THREE.Color('#6688aa'), fillIntensity: 0.2, fillColor: new THREE.Color('#445588'), ambient: 0.25 };
      case 'wind': return { mainIntensity: 0.9, mainColor: new THREE.Color('#ccddff'), fillIntensity: 0.4, fillColor: new THREE.Color('#99aaff'), ambient: 0.4 };
      default: return { mainIntensity: 1, mainColor: new THREE.Color('#ffffff'), fillIntensity: 0.4, fillColor: new THREE.Color('#cccccc'), ambient: 0.4 };
    }
  };

  const startConfig = getConfig(currentWeather);
  const endConfig = getConfig(targetWeather);
  const lerp = (a, b, t) => a + (b - a) * t;
  const colorLerp = (c1, c2, t) => c1.clone().lerp(c2, t);

  const mainIntensity = lerp(startConfig.mainIntensity, endConfig.mainIntensity, t);
  const mainColor = colorLerp(startConfig.mainColor, endConfig.mainColor, t);
  const fillIntensity = lerp(startConfig.fillIntensity, endConfig.fillIntensity, t);
  const fillColor = colorLerp(startConfig.fillColor, endConfig.fillColor, t);
  const ambientIntensity = lerp(startConfig.ambient, endConfig.ambient, t);

  useFrame(() => {
    if (sunLightRef.current) {
      sunLightRef.current.intensity = mainIntensity;
      sunLightRef.current.color = mainColor;
    }
    if (fillLightRef.current) {
      fillLightRef.current.intensity = fillIntensity;
      fillLightRef.current.color = fillColor;
    }
  });

  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        ref={sunLightRef}
        position={[10, 20, 5]}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        intensity={mainIntensity}
        color={mainColor}
      />
      <directionalLight
        ref={fillLightRef}
        position={[-5, 10, -8]}
        intensity={fillIntensity}
        color={fillColor}
      />
      <pointLight position={[0, -2, 0]} intensity={0.3} color="#88aaff" distance={20} />
    </>
  );
}

function WeatherSystem({ targetWeather }) {
  const rainRef = useRef();
  const cloudsRef = useRef([]);
  const lightningRef = useRef({ active: false, timer: 0 });
  const { scene } = useThree();
  const [currentWeather, setCurrentWeather] = useState(targetWeather);
  const [rainOpacity, setRainOpacity] = useState(targetWeather === 'rain' ? 0.8 : 0);
  const [fogDensity, setFogDensity] = useState(0.003);
  const [fogColor, setFogColor] = useState(new THREE.Color(0x87CEEB));
  const [lightningIntensity, setLightningIntensity] = useState(0);

  useEffect(() => {
    const particleCount = 4000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      positions[i*3] = (Math.random() - 0.5) * 250;
      positions[i*3+1] = Math.random() * 60;
      positions[i*3+2] = (Math.random() - 0.5) * 200 - 30;
      velocities[i] = 0.15 + Math.random() * 0.2;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ 
      color: 0xcceeff, 
      size: 0.25, 
      transparent: true, 
      opacity: 0.7, 
      blending: THREE.AdditiveBlending 
    });
    const rain = new THREE.Points(geometry, material);
    rain.userData = { velocities };
    scene.add(rain);
    rainRef.current = rain;

    for (let i = 0; i < 6; i++) {
      const cloudMat = new THREE.MeshStandardMaterial({ color: 0x888899, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
      const cloudGroup = new THREE.Group();
      const parts = 3 + Math.floor(Math.random() * 3);
      for (let p = 0; p < parts; p++) {
        const part = new THREE.Mesh(new THREE.SphereGeometry(1.2 + Math.random() * 0.8, 5, 5), cloudMat);
        part.position.set((p - parts/2) * 1.5, Math.random() * 1, Math.random() * 1);
        part.scale.set(1.5, 0.8, 1);
        cloudGroup.add(part);
      }
      cloudGroup.position.set((i - 2.5) * 18, 18 + Math.random() * 8, -50 + Math.random() * 20);
      cloudGroup.userData = { speed: 0.08 + Math.random() * 0.1, rangeX: 40, rangeZ: 30 };
      scene.add(cloudGroup);
      cloudsRef.current.push(cloudGroup);
    }

    return () => {
      if (rain) scene.remove(rain);
      cloudsRef.current.forEach(c => scene.remove(c));
    };
  }, []);

  useFrame((_, delta) => {
    if (rainRef.current) {
      rainRef.current.material.opacity = rainOpacity;
      rainRef.current.visible = rainOpacity > 0.05;
      if (rainOpacity > 0.05) {
        const positions = rainRef.current.geometry.attributes.position.array;
        const velocities = rainRef.current.userData.velocities;
        let windX = 0;
        let windZ = 0;
        if (targetWeather === 'rain') {
          windX = delta * 2.5;
          windZ = delta * 1.2;
        } else if (targetWeather === 'wind') {
          windX = delta * 4;
        }
        
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i*3+1] -= velocities[i] * delta * 1.8;
          positions[i*3] += windX * (0.8 + Math.random() * 0.7);
          positions[i*3+2] += windZ * (Math.random() - 0.5);
          
          if (positions[i*3+1] < -5) {
            positions[i*3+1] = 55;
            positions[i*3] = (Math.random() - 0.5) * 250;
            positions[i*3+2] = (Math.random() - 0.5) * 200 - 30;
          }
        }
        rainRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }
    
    cloudsRef.current.forEach(cloud => {
      let speed = 0.04;
      if (targetWeather === 'wind') speed = 0.15;
      if (targetWeather === 'rain') speed = 0.1;
      cloud.position.x += speed * delta;
      cloud.position.z += (targetWeather === 'rain' ? 0.02 : 0) * delta;
      if (cloud.position.x > 60) cloud.position.x = -60;
      if (cloud.position.z > 20) cloud.position.z = -70;
    });
  });

  useEffect(() => {
    if (targetWeather === 'rain') {
      const scheduleLightning = () => {
        const delay = 6000 + Math.random() * 10000;
        lightningRef.current.timer = setTimeout(() => {
          setLightningIntensity(1.2);
          
          const lightningLight = new THREE.AmbientLight(0xffffff, 1.5);
          scene.add(lightningLight);
          
          setTimeout(() => {
            setLightningIntensity(0);
            scene.remove(lightningLight);
          }, 120);
          
          if (Math.random() > 0.6) {
            setTimeout(() => {
              setLightningIntensity(0.8);
              const secondLight = new THREE.AmbientLight(0xffffff, 1);
              scene.add(secondLight);
              setTimeout(() => {
                setLightningIntensity(0);
                scene.remove(secondLight);
              }, 80);
            }, 200);
          }
          scheduleLightning();
        }, delay);
      };
      scheduleLightning();
      return () => {
        if (lightningRef.current.timer) clearTimeout(lightningRef.current.timer);
      };
    }
  }, [targetWeather]);

  useEffect(() => {
    if (targetWeather !== currentWeather) {
      let startTime = 0;
      const duration = 2000;
      const startWeather = currentWeather;
      const endWeather = targetWeather;
      const startRainOpacity = (startWeather === 'rain') ? 0.8 : 0;
      const endRainOpacity = (endWeather === 'rain') ? 0.8 : 0;
      const startFog = getFogParams(startWeather);
      const endFog = getFogParams(endWeather);
      
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(1, elapsed / duration);
        const opacity = startRainOpacity + (endRainOpacity - startRainOpacity) * progress;
        setRainOpacity(opacity);
        const density = startFog.density + (endFog.density - startFog.density) * progress;
        const color = startFog.color.clone().lerp(endFog.color, progress);
        setFogDensity(density);
        setFogColor(color);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCurrentWeather(endWeather);
        }
      };
      requestAnimationFrame(animate);
    } else {
      const params = getFogParams(targetWeather);
      setFogDensity(params.density);
      setFogColor(params.color);
      setRainOpacity(targetWeather === 'rain' ? 0.8 : 0);
    }
  }, [targetWeather]);

  const getFogParams = (weather) => {
    switch (weather) {
      case 'sun': return { density: 0.002, color: new THREE.Color(0x87CEEB) };
      case 'rain': return { density: 0.006, color: new THREE.Color(0x4a5a6a) };
      case 'wind': return { density: 0.0035, color: new THREE.Color(0xaabbcc) };
      default: return { density: 0.002, color: new THREE.Color(0x87CEEB) };
    }
  };

  useEffect(() => {
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);
  }, [fogDensity, fogColor]);

  if (lightningIntensity > 0 && targetWeather === 'rain') {
    return (
      <>
        <ambientLight intensity={0.8 + lightningIntensity * 2} color="#ffffff" />
        <directionalLight position={[0, 10, 0]} intensity={0.5 + lightningIntensity} color="#ffffff" />
      </>
    );
  }
  return null;
}

function App() {
  const [hunger, setHunger] = useState(0.3);
  const [energy, setEnergy] = useState(0.8);
  const [fatigue, setFatigue] = useState(0.2);
  const [showThought, setShowThought] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [weather, setWeather] = useState('sun');
  const [initialLoading, setInitialLoading] = useState(true);
  const [saveTimeout, setSaveTimeout] = useState(null);

  const loadStateFromServer = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3001/api/state');
      const data = await res.json();
      if (data) {
        setHunger(data.hunger);
        setEnergy(data.energy);
        setFatigue(data.fatigue);
        console.log('состояние загружено с сервера');
      }
    } catch (err) {
      console.error('ошибка загрузки:', err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  const saveToServer = useCallback(async (h, e, f) => {
    try {
      await fetch('http://localhost:3001/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hunger: h, energy: e, fatigue: f })
      });
      console.log('состояние сохранено');
    } catch (err) {
      console.error('ошибка сохранения:', err);
    }
  }, []);

  const setWeatherSun = useCallback(() => setWeather('sun'), []);
  const setWeatherWind = useCallback(() => setWeather('wind'), []);
  const setWeatherRain = useCallback(() => setWeather('rain'), []);

  useEffect(() => {
    loadStateFromServer();
  }, [loadStateFromServer]);

  useEffect(() => {
    if (initialLoading) return;
    if (saveTimeout) clearTimeout(saveTimeout);
    const timeout = setTimeout(() => {
      saveToServer(hunger, energy, fatigue);
    }, 3000);
    setSaveTimeout(timeout);
    return () => clearTimeout(timeout);
  }, [hunger, energy, fatigue, initialLoading, saveToServer]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      saveToServer(hunger, energy, fatigue);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hunger, energy, fatigue, saveToServer]);

  useEffect(() => {
    const interval = setInterval(() => {
      setHunger(prev => Math.min(1, prev + 0.003));
      setEnergy(prev => Math.max(0, prev - 0.002));
      let fatigueDelta = energy < 0.3 ? 0.005 : 0.001;
      if (weather === 'rain') fatigueDelta += 0.002;
      if (weather === 'sun') fatigueDelta -= 0.001;
      setFatigue(prev => Math.min(1, Math.max(0, prev + fatigueDelta)));
      
      if (Math.random() > 0.98 && !showThought) setShowThought(true);
      if (Math.random() > 0.97 && !buttonsDisabled) {
        setButtonsDisabled(true);
        setTimeout(() => setButtonsDisabled(false), 3000);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [energy, weather, showThought, buttonsDisabled]);

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

  const handleModelInteract = useCallback(() => {
    const actions = [handleFeed, handleRest, handlePlay];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    randomAction();
    setShowThought(true);
    setTimeout(() => setShowThought(false), 3000);
  }, [handleFeed, handleRest, handlePlay]);

  if (initialLoading) {
    return (
      <div style={{ width: '100vw', height: '100vh', background: '#202050', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white' }}>
        загрузка состояния питомца...
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#202050', position: 'relative', overflow: 'hidden' }}>
      <Canvas
        camera={{ fov: 75, position: [-18, 36, 273], near: 0.1, far: 1000 }}
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
        shadows
        gl={{ toneMapping: THREE.ReinhardToneMapping, toneMappingExposure: 1.2 }}
      >
        <Sky distance={450} sunPosition={weather === 'sun' ? [5, 20, 3] : [1, 3, 1]} inclination={0.4} azimuth={0.2} turbidity={weather === 'rain' ? 10 : 2} />
        <Main />
        <ambientLight intensity={0.5} />
        <Ground />
        <DynamicLighting targetWeather={weather} />
        <WeatherSystem targetWeather={weather} />
        <directionalLight position={[5, 5, 5]} intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.5} />
        
        <Suspense fallback={
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[1, 32, 32]} />
            <meshStandardMaterial color="gray" />
          </mesh>
        }>
          <Scene fatigue={fatigue} onInteract={handleModelInteract} />
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
          onSetWeatherSun={setWeatherSun}
          onSetWeatherWind={setWeatherWind}
          onSetWeatherRain={setWeatherRain}
        />
      </div>
    </div>
  );
}

export default App;