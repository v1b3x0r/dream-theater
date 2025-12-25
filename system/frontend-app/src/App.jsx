import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import axios from 'axios'

// Components
import Sidebar from './components/Sidebar'
import GalaxyView from './components/GalaxyView'
import GridView from './components/GridView'
import Inspector from './components/Inspector'
import TeachModal from './components/TeachModal'
import Header from './components/Header'
import AudioPlayer from './components/AudioPlayer'

const API_BASE = 'http://localhost:8000'

export default function App() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({ total: 0, distribution: {}, identities: 0 })
  const [identities, setIdentities] = useState([])
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, status: 'idle' })
  const [selected, setSelected] = useState(new Set())
  const [query, setQuery] = useState('')
  const [threshold, setThreshold] = useState(0.15)
  const [isGalaxyView, setIsGalaxyView] = useState(true)
  const [isStoryMode, setIsStoryMode] = useState(false)
  const [status, setStatus] = useState('Standby')
  const [previewItem, setPreviewItem] = useState(null)
  const [showTeachModal, setShowTeachModal] = useState(false)
  const [teachName, setTeachName] = useState('')
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Audio Logic
  const playTrack = (track) => {
    if (currentTrack?.path === track.path) {
      setIsPlaying(!isPlaying)
    } else {
      setCurrentTrack(track)
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    fetchStats(); fetchIdentities(); handleSearch('everything')
    const timer = setInterval(fetchProgress, 1000); return () => clearInterval(timer)
  }, [])

  const fetchStats = async () => { try { const res = await axios.get(`${API_BASE}/api/stats`); setStats(res.data) } catch (e) { } }
  const fetchIdentities = async () => { try { const res = await axios.get(`${API_BASE}/api/identities`); setIdentities(res.data) } catch (e) { } }
  const fetchProgress = async () => { try { const res = await axios.get(`${API_BASE}/api/scan/progress`); setScanProgress(res.data); if(res.data.status === 'idle') fetchStats() } catch (e) { } }

  const handleSearch = async (val) => {
    setStatus('Recalling...')
    const q = val || 'everything'
    if(q !== 'everything') setIsGalaxyView(false)
    try {
      const res = await axios.get(`${API_BASE}/api/search?q=${encodeURIComponent(q)}&threshold=${threshold}`)
      setItems(res.data)
      setIsStoryMode(false)
      
      // Auto-Soundtrack
      const audioMatches = res.data.filter(i => i.type === 'audio')
      if (audioMatches.length > 0) {
        // Shuffle play
        const pick = audioMatches[Math.floor(Math.random() * Math.min(5, audioMatches.length))]
        if(!currentTrack) setCurrentTrack(pick) // Only auto-set if empty
      }
      
      setStatus(`Echoes: ${res.data.length}`)
    } catch (err) { setStatus('Recall Failed') }
  }

  const handleTeach = async () => {
    if (!teachName || selected.size === 0) return
    try {
      await axios.post(`${API_BASE}/api/identities/teach`, { name: teachName, anchors: Array.from(selected) })
      setSelected(new Set()); setTeachName(''); setShowTeachModal(false); 
      fetchIdentities(); fetchStats();
      setQuery(teachName); handleSearch(teachName);
    } catch (e) { setStatus('Teach Error') }
  }

  const handleDeleteIdentity = async (name) => {
    if(confirm(`Forget ${name}?`)) { await axios.delete(`${API_BASE}/api/identities/${name}`); fetchIdentities(); }
  }

  const toggleSelect = (path) => {
    const next = new Set(selected);
    next.has(path) ? next.delete(path) : next.add(path);
    setSelected(next);
  }

  const progressPercent = scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 0

  return (
    <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden relative">
      
      {/* 🌌 Galaxy Layer (Fixed Background) */}
      <AnimatePresence>
        {isGalaxyView && (
          <GalaxyView 
            items={items} 
            onSelectNode={(item) => { setPreviewItem(item); setIsGalaxyView(false); }} 
            apiBase={API_BASE} 
          />
        )}
      </AnimatePresence>

      {/* 🥽 Sidebar (Z-50, Shrink-0) */}
      <div className="relative z-50 h-full flex flex-col shrink-0">
        <Sidebar 
          stats={stats} identities={identities} isGalaxyView={isGalaxyView} setIsGalaxyView={setIsGalaxyView} 
          onScan={() => axios.post(`${API_BASE}/api/scan`)} 
          onIdentityClick={(name) => { setQuery(name); handleSearch(name); }}
          onDeleteIdentity={handleDeleteIdentity}
          progressPercent={progressPercent} scanStatus={scanProgress}
        />
      </div>

      {/* 🖼️ Main Content (Flexible & Contained) */}
      <main className={`flex-1 flex flex-col relative z-10 min-w-0 overflow-hidden transition-transform duration-1000 ${isGalaxyView ? 'translate-x-full opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
        <Header 
          query={query} setQuery={setQuery} onSearch={handleSearch} 
          threshold={threshold} setThreshold={setThreshold}
          selectedCount={selected.size} onTeach={() => setShowTeachModal(true)}
          onWeave={async () => {
            const res = await axios.post(`${API_BASE}/api/weave`, { anchors: Array.from(selected) })
            setItems(res.data); setIsStoryMode(true);
          }}
        />
        <GridView 
          items={items} selected={selected} onSelect={toggleSelect} onPreview={setPreviewItem} 
          isStoryMode={isStoryMode} apiBase={API_BASE}
          currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playTrack}
        />
      </main>

      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-2xl border border-white/5 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-white/30 z-40 flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />{status}
      </div>

      <AnimatePresence>
        {previewItem && <Inspector previewItem={previewItem} onClose={() => setPreviewItem(null)} apiBase={API_BASE} />}
        {showTeachModal && <TeachModal selectedCount={selected.size} teachName={teachName} setTeachName={setTeachName} onCancel={() => setShowTeachModal(false)} onConfirm={handleTeach} />}
      </AnimatePresence>

      <AudioPlayer currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playTrack} apiBase={API_BASE} />
    </div>
  )
}