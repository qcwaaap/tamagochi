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
      console.log('Модель загружена');
      scene.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    } else if (loadError) {
      console.error('Ошибка загрузки модели:', loadError);
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
    console.error('Ошибка загрузки текстур:', err);
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
  const windRef = useRef({ speed: 0, direction: 0 });
  const lightningRef = useRef({ active: false, timer: 0 });
  const { scene, camera } = useThree();
  const [currentWeather, setCurrentWeather] = useState(targetWeather);
  const [rainOpacity, setRainOpacity] = useState(targetWeather === 'rain' ? 0.6 : 0);
  const [fogDensity, setFogDensity] = useState(0.003);
  const [fogColor, setFogColor] = useState(new THREE.Color(0x87CEEB));
  const [lightningIntensity, setLightningIntensity] = useState(0);

  useEffect(() => {
    const particleCount = 2000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      positions[i*3] = (Math.random() - 0.5) * 180;
      positions[i*3+1] = Math.random() * 30;
      positions[i*3+2] = (Math.random() - 0.5) * 140 - 20;
      velocities[i] = 0.08 + Math.random() * 0.12;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xaaddff, size: 0.1, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
    const rain = new THREE.Points(geometry, material);
    rain.userData = { velocities };
    scene.add(rain);
    rainRef.current = rain;

    for (let i = 0; i < 4; i++) {
      const cloudMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, transparent: true, opacity: 0.25, side: THREE.DoubleSide });
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(2.5, 5, 5), cloudMat);
      cloud.position.set((i - 1.5) * 12, 12 + i * 1.5, -25);
      cloud.scale.set(3, 1.5, 2);
      cloud.userData = { speed: 0.15 + i * 0.1, range: 30 };
      scene.add(cloud);
      cloudsRef.current.push(cloud);
    }

    return () => {
      if (rain) scene.remove(rain);
      cloudsRef.current.forEach(c => scene.remove(c));
    };
  }, []);

  useEffect(() => {
    if (targetWeather !== currentWeather) {
      let startTime = 0;
      const duration = 2500;
      const startWeather = currentWeather;
      const endWeather = targetWeather;
      const startRainOpacity = (startWeather === 'rain') ? 0.6 : 0;
      const endRainOpacity = (endWeather === 'rain') ? 0.6 : 0;
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
      setRainOpacity(targetWeather === 'rain' ? 0.6 : 0);
    }
  }, [targetWeather]);

  const getFogParams = (weather) => {
    switch (weather) {
      case 'sun': return { density: 0.002, color: new THREE.Color(0x87CEEB) };
      case 'rain': return { density: 0.008, color: new THREE.Color(0x4a5a6a) };
      case 'wind': return { density: 0.004, color: new THREE.Color(0xaabbcc) };
      default: return { density: 0.002, color: new THREE.Color(0x87CEEB) };
    }
  };

  useEffect(() => {
    scene.fog = new THREE.FogExp2(fogColor, fogDensity);
  }, [fogDensity, fogColor]);

  useEffect(() => {
    if (targetWeather === 'rain' && lightningRef.current.timer === 0) {
      const scheduleLightning = () => {
        const delay = 8000 + Math.random() * 12000;
        lightningRef.current.timer = setTimeout(() => {
          setLightningIntensity(1);
          lightningRef.current.active = true;
          setTimeout(() => setLightningIntensity(0), 150);
          setTimeout(() => {
            if (Math.random() > 0.6) {
              setLightningIntensity(0.7);
              setTimeout(() => setLightningIntensity(0), 100);
            }
            lightningRef.current.active = false;
            scheduleLightning();
          }, 200);
        }, delay);
      };
      scheduleLightning();
      return () => {
        if (lightningRef.current.timer) clearTimeout(lightningRef.current.timer);
      };
    }
  }, [targetWeather]);

  useFrame((_, delta) => {
    if (rainRef.current) {
      rainRef.current.material.opacity = rainOpacity;
      rainRef.current.visible = rainOpacity > 0;
      if (rainOpacity > 0) {
        const positions = rainRef.current.geometry.attributes.position.array;
        const velocities = rainRef.current.userData.velocities;
        let windOffset = 0;
        if (targetWeather === 'rain') windOffset = delta * 1.5;
        if (targetWeather === 'wind') windOffset = delta * 2.5;
        
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i*3+1] -= velocities[i] * delta * 1.5;
          positions[i*3] += windOffset * (Math.random() - 0.5) * 0.5;
          if (positions[i*3+1] < -2) {
            positions[i*3+1] = 25;
            positions[i*3] = (Math.random() - 0.5) * 180;
            positions[i*3+2] = (Math.random() - 0.5) * 140 - 20;
          }
        }
        rainRef.current.geometry.attributes.position.needsUpdate = true;
      }
    }
    
    cloudsRef.current.forEach(cloud => {
      let speed = 0.03;
      if (targetWeather === 'wind') speed = 0.12;
      if (targetWeather === 'rain') speed = 0.07;
      cloud.position.x += speed * delta;
      if (cloud.position.x > 25) cloud.position.x = -25;
    });

    if (lightningIntensity > 0 && targetWeather === 'rain') {
      const intensity = 1 + lightningIntensity * 3;
      scene.backgroundIntensity = intensity;
      setTimeout(() => { scene.backgroundIntensity = 1; }, 100);
    }
  });

  return lightningIntensity > 0 && targetWeather === 'rain' ? (
    <ambientLight intensity={2 + lightningIntensity * 2} color="#ffffff" />
  ) : null;
}

function AudioManager({ weather }) {
  const audioContextRef = useRef(null);
  const soundsRef = useRef({ rain: null, thunder: null, music: null });
  const currentWeatherRef = useRef(weather);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioContextRef.current;

    const createRainSound = () => {
      const bufferSize = 4096;
      const noiseNode = ctx.createScriptProcessor(bufferSize, 1, 1);
      noiseNode.onaudioprocess = (e) => {
        const output = e.outputBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.15;
        }
      };
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0;
      noiseNode.connect(gainNode);
      gainNode.connect(ctx.destination);
      return { node: noiseNode, gain: gainNode };
    };

    const createThunderSound = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 80;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      return { osc, gain };
    };

    const createMusic = (type) => {
      const now = ctx.currentTime;
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ctx.destination);
      
      const notes = type === 'sun' ? [523.25, 587.33, 659.25, 523.25] :
                    type === 'wind' ? [261.63, 293.66, 329.63, 261.63] :
                    [196.00, 174.61, 155.56, 130.81];
      
      const scheduleNote = (time, pitch, duration, volume) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = pitch;
        gain.gain.value = volume;
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.stop(time + duration);
      };
      
      let interval;
      if (type === 'sun') {
        interval = setInterval(() => {
          const time = ctx.currentTime;
          notes.forEach((note, i) => {
            scheduleNote(time + i * 0.4, note, 0.8, 0.08);
          });
        }, 3200);
      } else if (type === 'wind') {
        interval = setInterval(() => {
          const time = ctx.currentTime;
          scheduleNote(time, notes[0] * 0.5, 2.5, 0.06);
          scheduleNote(time + 1.3, notes[2] * 0.5, 2.0, 0.05);
        }, 4000);
      } else {
        interval = setInterval(() => {
          const time = ctx.currentTime;
          scheduleNote(time, notes[0] * 0.3, 3.0, 0.1);
          scheduleNote(time + 1.5, notes[1] * 0.3, 2.5, 0.08);
          scheduleNote(time + 3.0, notes[2] * 0.3, 2.0, 0.06);
        }, 6000);
      }
      
      return { gain: masterGain, interval };
    };

    if (!soundsRef.current.rain) soundsRef.current.rain = createRainSound();
    if (!soundsRef.current.thunder) soundsRef.current.thunder = createThunderSound();

    const updateSounds = () => {
      const targetVolumes = {
        sun: { rain: 0, thunder: 0, music: 0.12 },
        wind: { rain: 0, thunder: 0, music: 0.1 },
        rain: { rain: 0.25, thunder: 0.08, music: 0.09 }
      };
      
      if (soundsRef.current.rain) {
        soundsRef.current.rain.gain.gain.linearRampToValueAtTime(targetVolumes[weather].rain, ctx.currentTime + 1);
      }
      if (soundsRef.current.thunder && weather === 'rain' && Math.random() > 0.97) {
        const thunder = soundsRef.current.thunder;
        thunder.gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
        setTimeout(() => {
          thunder.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        }, 300);
      }
      
      if (soundsRef.current.music) {
        clearInterval(soundsRef.current.music.interval);
        soundsRef.current.music.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
        setTimeout(() => {
          if (soundsRef.current.music) {
            soundsRef.current.music.gain.disconnect();
          }
          soundsRef.current.music = createMusic(weather);
          soundsRef.current.music.gain.gain.value = targetVolumes[weather].music;
        }, 1000);
      } else {
        soundsRef.current.music = createMusic(weather);
        soundsRef.current.music.gain.gain.value = targetVolumes[weather].music;
      }
    };

    if (currentWeatherRef.current !== weather) {
      updateSounds();
      currentWeatherRef.current = weather;
    } else if (!soundsRef.current.music) {
      updateSounds();
    }

    return () => {
      if (soundsRef.current.rain) {
        soundsRef.current.rain.node.disconnect();
      }
      if (soundsRef.current.thunder) {
        soundsRef.current.thunder.osc.stop();
        soundsRef.current.thunder.gain.disconnect();
      }
      if (soundsRef.current.music) {
        clearInterval(soundsRef.current.music.interval);
        soundsRef.current.music.gain.disconnect();
      }
    };
  }, [weather]);

  return null;
}

function App() {
  const [hunger, setHunger] = useState(0.3);
  const [energy, setEnergy] = useState(0.8);
  const [fatigue, setFatigue] = useState(0.2);
  const [showThought, setShowThought] = useState(false);
  const [buttonsDisabled, setButtonsDisabled] = useState(false);
  const [weather, setWeather] = useState('sun');

  const setWeatherSun = useCallback(() => setWeather('sun'), []);
  const setWeatherWind = useCallback(() => setWeather('wind'), []);
  const setWeatherRain = useCallback(() => setWeather('rain'), []);

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
        
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        <AudioManager weather={weather} />
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