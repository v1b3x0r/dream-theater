import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Html, Text } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

// --- 🌟 THE INDIVIDUAL STAR NODE (The Soul) ---
function MemoryStar({ item, position, onClick, apiBase }) {
  const [hovered, setHovered] = useState(false)
  const [dreaming, setDreaming] = useState(false)
  const meshRef = useRef()
  
  // 😴 RANDOM DREAMING: Stars wake up and show memories
  useEffect(() => {
    const dream = () => {
      if (Math.random() > 0.98) {
        setDreaming(true)
        setTimeout(() => setDreaming(false), 4000)
      }
    }
    const timer = setInterval(dream, 7000)
    return () => clearInterval(timer)
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    
    // Smooth Breathing Animation
    const targetScale = hovered ? 3.0 : 1.0
    const breath = 1 + Math.sin(t * 1.5 + position[0]) * 0.1
    meshRef.current.scale.lerp(new THREE.Vector3(0.1 * targetScale * breath, 0.1 * targetScale * breath, 0.1 * targetScale * breath), 0.1)
    
    // Always face the observer
    meshRef.current.lookAt(state.camera.position)
  })

  const showPopup = hovered || dreaming
  const imgUrl = item.thumb ? `${apiBase}${item.thumb}` : `${apiBase}/raw/${item.display_path}`

  return (
    <group position={position} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {/* 🌟 Visual Star */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color={showPopup ? "#0a84ff" : "#ffffff"} 
          opacity={showPopup ? 1.0 : 0.6} 
          transparent 
        />
      </mesh>
      
      {/* 🧲 HACK: Magnetic Hitbox (Invisible but huge) */}
      <mesh visible={false}>
        <sphereGeometry args={[12, 8, 8]} /> {/* 12x bigger than visual! */}
      </mesh>

      <AnimatePresence>
        {showPopup && (
          <Html distanceFactor={8} position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
            <motion.div 
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0, y: 10 }}
              className="p-1.5 bg-black/80 backdrop-blur-3xl border border-blue-500/30 rounded-2xl shadow-2xl w-48 pointer-events-none"
            >
              <img src={imgUrl} className="w-full h-auto rounded-xl shadow-lg" alt="p" />
              <p className="text-[8px] text-blue-400 mt-2 text-center font-black uppercase tracking-tighter truncate px-2">
                {item.display_path.split('/').pop()}
              </p>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
    </group>
  )
}

// --- 🌌 THE STAR SYSTEM ---
function MemoryGalaxy({ items, apiBase, onSelectNode }) {
  const stars = useMemo(() => {
    const images = items.filter(i => i.type === 'image')
    const SCALE = 1.2 // Classic spread
    return images.slice(0, 800).map((item, idx) => {
      // Use UMAP or random cloud
      const pos = item.x !== null 
        ? [(item.x - 5) * SCALE, (item.y - 5) * SCALE, (item.z - 5) * SCALE]
        : [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20]
      return { item, pos }
    })
  }, [items])

  return (
    <group>
      {stars.map((s, i) => (
        <MemoryStar key={s.item.path + i} item={s.item} position={s.pos} onClick={() => onSelectNode(s.item)} apiBase={apiBase} />
      ))}
    </group>
  )
}

export default function GalaxyView({ items, apiBase, onSelectNode }) {
  return (
    <div className="fixed inset-0 z-0 bg-black">
      <Canvas camera={{ position: [0, 0, 20], fov: 50 }}>
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={2} />
        
        <MemoryGalaxy items={items} apiBase={apiBase} onSelectNode={onSelectNode} />

        <OrbitControls 
          enablePan={true} 
          enableZoom={true} 
          minDistance={0.1} 
          maxDistance={200} 
          zoomSpeed={1.5}
          dampingFactor={0.05} 
          autoRotate 
          autoRotateSpeed={0.05} 
        />
      </Canvas>
    </div>
  )
}