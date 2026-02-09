import { useState } from 'react'
import './App.css'

import './index.css'
import {Canvas} from "@react-three/fiber";
import {Sky} from "@react-three/drei";

function App() {

  return (
    <>
      <Canvas camera={{ fov: 45 }}>
        <Sky sunPosition={[100, 20, 100]} />
      </Canvas>
    </>
  )
}

export default App
