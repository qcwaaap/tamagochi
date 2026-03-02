import { useState } from 'react'
import './App.css'

// import '../index.css'
import {Canvas} from "@react-three/fiber";
import {Sky, useGLTF} from "@react-three/drei";
import { useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

function Scene() {
  const { nodes, materials } = useGLTF('\\scene.gltf')
  return <mesh name="model1" position={[0,0,0]} rotation={[0,0,0]} scale={[0.35,1,0.4]} layers={0}>
    <bufferGeometry attach="geometry" {...nodes.KurvMesh.geometry} />
    <meshStandardMaterial attach="material" color="blue" />
  </mesh>
  // return <primitive object={gltf.scene} />
}


function App() {

  return (
    <>
      <Canvas camera={{ fov: 45 }}>
        <ambientLight intensity={0.5} />
        <Scene/>
        <Sky sunPosition={[100, 20, 100]} />
      </Canvas>
    </>
  )
}

export default App
