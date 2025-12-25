import React, { useMemo, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars, Float, Html, Text } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

// --- Camera Controller (Auto-Center) ---
function GalaxyController({ stars }) {
  const { camera, controls } = useThree()
  const initialized = useRef(false)
  
  useEffect(() => {
    if (stars.length > 0 && !initialized.current) {
      const centroid = new THREE.Vector3()
      stars.forEach(s => centroid.add(new THREE.Vector3(...s.position)))
      centroid.divideScalar(stars.length)
      camera.position.set(centroid.x, centroid.y, centroid.z + 18)
      camera.lookAt(centroid)
      if(controls) controls.target.copy(centroid)
      initialized.current = true
    }
  }, [stars, camera, controls])
  return null
}

function MemoryStar({ item, position, onClick, apiBase }) {
  const [hovered, setHovered] = useState(false)
  const [dreaming, setDreaming] = useState(false)
  const meshRef = useRef()
  const isAudio = item.type === 'audio'
  const hasTags = item.tags && item.tags.length > 0
  const imgUrl = isAudio ? null : (item.thumb ? `${apiBase}${item.thumb}` : `${apiBase}/raw/${item.display_path.split('/').map(encodeURIComponent).join('/')}`)

  useEffect(() => {
    const startDream = () => { if (Math.random() > 0.99) { setDreaming(true); setTimeout(() => setDreaming(false), 4000); } }
    const timer = setInterval(startDream, 6000); return () => clearInterval(timer)
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    // Subtle breathing for Nebula effect
    const targetScale = hovered ? 2.0 : (1 + Math.sin(t * 1.5 + position[0]) * 0.15)
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
    meshRef.current.lookAt(state.camera.position)
  })

  const showPopup = hovered || dreaming

  return (
    <group position={position} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      {/* Nebula Point */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[isAudio ? 0.15 : 0.1, 16, 16]} />
        <meshBasicMaterial 
          color={showPopup ? (isAudio ? "#ff0055" : "#0a84ff") : (isAudio ? "#a855f7" : "#bfdbfe")} 
          opacity={isAudio ? 0.6 : 0.8} 
          transparent 
        />
        {/* Glow Ring */}
        {showPopup && <mesh>
          <ringGeometry args={[0.2, 0.25, 32]} />
          <meshBasicMaterial color={isAudio ? "#ff0055" : "#0a84ff"} side={THREE.DoubleSide} transparent opacity={0.5} />
        </mesh>}
        
        {/* Billboard Tag */}
        {hasTags && !showPopup && (
          <Text position={[0, 0.3, 0]} fontSize={0.15} color="#93c5fd" anchorX="center" anchorY="middle" outlineWidth={0.01} outlineColor="black">
            {item.tags[0]}
          </Text>
        )}
      </mesh>
      
      {/* Hitbox */}
      <mesh visible={false}><sphereGeometry args={[0.4, 8, 8]} /><meshBasicMaterial color="red" /></mesh>

      {/* Popover */}
      {showPopup && (
        <Html distanceFactor={8} position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`p-2 backdrop-blur-3xl border rounded-2xl shadow-2xl pointer-events-none ${isAudio ? 'w-48 bg-purple-900/80 border-purple-500/50' : 'w-40 bg-black/80 border-blue-500/30'}`}>
            {isAudio ? (
              <div className="text-center p-2"><div className="text-2xl mb-2">🎵</div><p className="text-[10px] font-bold text-white truncate">{item.metadata?.title}</p></div>
            ) : (
              <img src={imgUrl} className="w-full h-auto rounded-xl" alt="p" />
            )}
          </motion.div>
        </Html>
      )}
    </group>
  )
}

function MemoryGalaxy({ items, onSelectNode, apiBase }) {
  const stars = useMemo(() => {
    // Priority: Images first, then some audio
    const images = items.filter(i => i.type === 'image' && i.x !== null).slice(0, 600)
    const audio = items.filter(i => i.type === 'audio' && i.x !== null).slice(0, 200)
    return [...images, ...audio].map((item, i) => {
      const x = item.x || (Math.random() * 10 - 5)
      const y = item.y || (Math.random() * 10 - 5)
      const z = item.z || (Math.random() * 10 - 5)
      return { item, position: [x, y, z] }
    })
  }, [items])
  
  return (
    <group>
      <GalaxyController stars={stars} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      {stars.map((star, i) => (
        <MemoryStar key={i} item={star.item} position={star.position} onClick={() => onSelectNode(star.item)} apiBase={apiBase} />
      ))}
    </group>
  )
}

export default function GalaxyView({ items, onSelectNode, apiBase }) {
  return (
    <div className="fixed inset-0 z-0 bg-black">
      <Canvas camera={{ fov: 60 }}>
        <MemoryGalaxy items={items} onSelectNode={onSelectNode} apiBase={apiBase} />
        <OrbitControls enablePan={true} enableZoom={true} autoRotate={true} autoRotateSpeed={0.5} minDistance={2} maxDistance={50} />
      </Canvas>
    </div>
  )
}