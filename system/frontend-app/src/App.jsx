import React, { useState, useEffect, useMemo, useRef } from 'react'
import { 
  Search, Layers, Clock, Heart, Zap, Play, X, 
  Info, Database, Activity, Box, Orbit as OrbitIcon, Sparkles
} from 'lucide-react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Float, Html } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import axios from 'axios'

const API_BASE = 'http://localhost:8000'

// --- 3D Components ---
function MemoryStar({ item, position, onClick }) {
  const [hovered, setHovered] = useState(false)
  const [dreaming, setDreaming] = useState(false)
  const meshRef = useRef()
  const imgUrl = item.thumb ? `${API_BASE}${item.thumb}` : `${API_BASE}/raw/${item.display_path.split('/').map(encodeURIComponent).join('/')}`

  // Dreaming Logic: Randomly pop up sometimes
  useEffect(() => {
    const startDream = () => {
      if (Math.random() > 0.98) {
        setDreaming(true)
        setTimeout(() => setDreaming(false), 3000)
      }
    }
    const timer = setInterval(startDream, 5000)
    return () => clearInterval(timer)
  }, [])

  useFrame((state) => {
    if (!meshRef.current) return
    // Breathing effect
    const t = state.clock.elapsedTime
    const scale = 1 + Math.sin(t * 2 + position[0]) * 0.1
    meshRef.current.scale.set(scale, scale, scale)
  })

  const showPopup = hovered || dreaming

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={position} onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={showPopup ? "#0a84ff" : "#ffffff"} opacity={0.6} transparent />
        
        {showPopup && (
          <Html distanceFactor={8} position={[0, 1.2, 0]} center zIndexRange={[100, 0]}>
            <motion.div 
              initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-40 p-1.5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl pointer-events-none"
            >
              <img src={imgUrl} className="w-full h-auto rounded-xl" alt="p" />
              {hovered && <p className="text-[7px] mt-1 text-center opacity-50 truncate px-2">{item.display_path}</p>}
            </motion.div>
          </Html>
        )}
      </mesh>
    </Float>
  )
}

function MemoryGalaxy({ items, onSelectNode }) {
  const stars = useMemo(() => {
    return items.slice(0, 120).map((item, i) => {
      const r = 6 + Math.random() * 10
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      return { item, position: [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)] }
    })
  }, [items])

  const groupRef = useRef()
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.0005 // Slow orbital drift
    }
  })

  return (
    <group ref={groupRef}>
      <Stars radius={80} depth={50} count={4000} factor={4} saturation={0} fade speed={0.5} />
      <ambientLight intensity={0.5} />
      {stars.map((star, i) => (
        <MemoryStar key={i} item={star.item} position={star.position} onClick={() => onSelectNode(star.item)} />
      ))}
    </group>
  )
}

// --- Main App ---
export default function App() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({ total: 0, distribution: {} })
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, status: 'idle' })
  const [selected, setSelected] = useState(new Set())
  const [query, setQuery] = useState('')
  const [isGalaxyView, setIsGalaxyView] = useState(true)
  const [isStoryMode, setIsStoryMode] = useState(false)
  const [status, setStatus] = useState('DreamOS v2.9 Online')
  const [previewItem, setPreviewItem] = useState(null)

  useEffect(() => {
    fetchStats()
    handleSearch({ key: 'Enter' })
    const timer = setInterval(fetchProgress, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/stats`)
      setStats(res.data)
    } catch (e) { console.error(e) }
  }

  const fetchProgress = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/scan/progress`)
      setScanProgress(res.data)
      if(res.data.status === 'idle') fetchStats()
    } catch (e) { console.error(e) }
  }

  const handleSearch = async (e) => {
    if (e.key === 'Enter') {
      setStatus('Searching...')
      if(query) setIsGalaxyView(false)
      try {
        const q = query || 'everything'
        const res = await axios.get(`${API_BASE}/api/search?q=${encodeURIComponent(q)}`)
        setItems(res.data)
        setIsStoryMode(false)
        setStatus(`Syncing ${res.data.length} memories`)
      } catch (err) { setStatus('System Offline') }
    }
  }

  const progressPercent = scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* 🌌 Living Galaxy */}
      <AnimatePresence>
        {isGalaxyView && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 22], fov: 50 }}>
              <MemoryGalaxy items={items} onSelectNode={(item) => { setPreviewItem(item); setIsGalaxyView(false); }} />
              <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.3} />
            </Canvas>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🥽 Sidebar */}
      <aside className="w-80 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col z-20 shadow-2xl">
        <div className="p-8 flex items-center gap-4 cursor-pointer" onClick={() => setIsGalaxyView(true)}>
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]"><Sparkles size={24} /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter italic">DreamOS</h1>
            <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.3em]">Autonomous Core</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-10">
          <nav className="space-y-2">
            <NavItem icon={<OrbitIcon size={18}/>} label="Galaxy View" active={isGalaxyView} onClick={() => setIsGalaxyView(true)} />
            <NavItem icon={<Layers size={18}/>} label="Memory Grid" active={!isGalaxyView} onClick={() => setIsGalaxyView(false)} />
          </nav>

          <section className="bg-white/5 rounded-[2rem] p-6 border border-white/5">
            <p className="text-[10px] font-black text-white/20 uppercase mb-6 tracking-widest flex items-center gap-2"><Box size={12} /> Vault Stats</p>
            <div className="space-y-4">
              <StatRow label="Echoes" value={stats.total} color="text-white" />
              {Object.entries(stats.distribution).map(([type, count]) => (
                <StatRow key={type} label={type} value={count} color="text-blue-400" />
              ))}
            </div>
          </section>

          <section className="px-2">
            <p className="text-[10px] font-black text-white/20 uppercase mb-4 tracking-widest flex items-center gap-2"><Activity size={12} /> Neural Load</p>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px]">
                <span className="opacity-40">ACCELERATOR</span>
                <span className="text-blue-400 font-bold">4070 Ti READY</span>
              </div>
              <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div animate={scanProgress.status === 'indexing' ? { width: `${progressPercent}%` } : { x: [-100, 200], width: '50%' }} className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 border-t border-white/5">
          <button onClick={() => axios.post(`${API_BASE}/api/scan`)} disabled={scanProgress.status === 'indexing'} className="w-full py-4 rounded-3xl bg-white/5 hover:bg-white/10 text-[11px] font-black uppercase tracking-widest transition-all">
            Refresh Universe
          </button>
        </div>
      </aside>

      {/* 🖼️ Main Content */}
      <main className={`flex-1 flex flex-col relative transition-transform duration-1000 cubic-bezier(0.2, 0, 0, 1) ${isGalaxyView ? 'translate-x-full' : 'translate-x-0'}`}>
        <header className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-xl px-6 z-30">
          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-full flex items-center p-1 shadow-2xl">
            <div className="ml-5 text-white/20"><Search size={18} /></div>
            <input className="bg-transparent border-none outline-none flex-1 px-4 py-3 text-md" placeholder="Search the void..." value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleSearch} />
          </div>
        </header>

        <div id="gallery-scroll" className="flex-1 overflow-y-auto pt-40 px-12 pb-24 scroll-smooth">
          <div className={isStoryMode ? 'max-w-3xl mx-auto space-y-32' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6'}>
            {items.map((item) => (
              <MemoryCard 
                key={item.path} item={item} isStoryMode={isStoryMode} isSelected={selected.has(item.path)}
                onSelect={(e) => { e.stopPropagation(); const next = new Set(selected); next.has(item.path) ? next.delete(item.path) : next.add(item.path); setSelected(next); }}
                onPreview={() => setPreviewItem(item)}
              />
            ))}
          </div>
        </div>
      </main>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-2xl border border-white/5 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-white/30 flex items-center gap-3 z-40">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />{status}
      </div>

      {/* 🖼️ Inspector */}
      <AnimatePresence>
        {previewItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/98 flex backdrop-blur-3xl">
            <div className="flex-1 flex items-center justify-center p-16" onClick={() => setPreviewItem(null)}>
              <img src={`${API_BASE}/raw/${previewItem.display_path.split('/').map(encodeURIComponent).join('/')}`} className="max-w-full max-h-full rounded-[2rem] shadow-2xl object-contain" />
            </div>
            <div className="w-[450px] bg-white/[0.01] border-l border-white/5 p-10 overflow-y-auto">
              <div className="flex justify-between items-center mb-12"><h2 className="text-2xl font-bold tracking-tighter italic">Inspector</h2><X className="cursor-pointer opacity-30 hover:opacity-100" onClick={() => setPreviewItem(null)} size={28} /></div>
              <div className="space-y-12">
                <section>
                  <p className="text-[10px] font-black opacity-20 uppercase tracking-[0.4em] mb-6">File Context</p>
                  <div className="space-y-5 text-sm font-medium">
                    <MetaItem label="Echo Name" value={previewItem.display_path.split('/').pop()} />
                    <MetaItem label="Dimensions" value={previewItem.metadata?.resolution} />
                    <MetaItem label="Data Mass" value={`${previewItem.metadata?.size_kb} KB`} />
                    <MetaItem label="Neural Resonance" value={`${(previewItem.score * 100).toFixed(2)}%`} />
                  </div>
                </section>
                <section>
                  <p className="text-[10px] font-black opacity-20 uppercase tracking-[0.4em] mb-6">Exif Snapshot</p>
                  <div className="bg-white/[0.02] rounded-3xl p-6 font-mono text-[10px] space-y-3 border border-white/5">
                    {previewItem.metadata?.exif && Object.entries(previewItem.metadata.exif).length > 0 ? (
                      Object.entries(previewItem.metadata.exif).map(([k, v]) => (
                        <div key={k} className="flex justify-between border-b border-white/5 pb-2"><span className="opacity-30">{k}</span><span className="text-blue-400 font-bold">{v}</span></div>
                      ))
                    ) : <p className="opacity-20 text-center py-4 italic text-xs uppercase tracking-widest">Vacuum: No data found</p>}
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-4 px-5 py-4 rounded-[1.5rem] cursor-pointer transition-all duration-500 ${active ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] scale-105' : 'text-white/30 hover:bg-white/5 hover:text-white/60'}`}>
      {icon} <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </div>
  )
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center py-2"><span className="text-[9px] opacity-20 font-black uppercase tracking-tighter">{label}</span><span className={`text-xs font-black ${color}`}>{value}</span></div>
  )
}

function MetaItem({ label, value }) {
  return (
    <div className="flex justify-between items-end border-b border-white/5 pb-2"><span className="text-[10px] opacity-20 font-black uppercase tracking-widest">{label}</span><span className="truncate max-w-[200px] text-white/80">{value || '---'}</span></div>
  )
}

function MemoryCard({ item, isStoryMode, isSelected, onSelect, onPreview }) {
  const imgUrl = item.thumb ? `${API_BASE}${item.thumb}` : `${API_BASE}/raw/${item.display_path.split('/').map(encodeURIComponent).join('/')}`
  return (
    <div className={`relative cursor-zoom-in group ${isStoryMode ? 'w-full' : 'aspect-square'}`} style={{ contentVisibility: 'auto' }} onClick={onPreview}>
      <div className={`h-full w-full relative overflow-hidden rounded-[2.5rem] transition-all duration-700 ${isSelected ? 'ring-2 ring-blue-500 scale-90 shadow-[0_0_40px_rgba(37,99,235,0.3)]' : 'border border-white/5 group-hover:border-white/20'}`}>
        <img src={imgUrl} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110" />
        <div onClick={onSelect} className={`absolute top-5 right-5 w-8 h-8 rounded-full border border-white/20 backdrop-blur-xl flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-blue-500 border-blue-500' : 'opacity-0 group-hover:opacity-100 hover:scale-110'}`}>
          <div className="w-2 h-2 bg-white rounded-full shadow-lg" />
        </div>
      </div>
    </div>
  )
}
