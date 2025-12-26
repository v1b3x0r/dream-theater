import React, { useState, useEffect, useCallback, memo } from 'react'
import { AnimatePresence } from 'framer-motion'
import axios from 'axios'

// Components
import Sidebar from './components/Sidebar'
import GridView from './components/GridView'
import GalaxyView from './components/GalaxyView'
import Inspector from './components/Inspector'
import TeachModal from './components/TeachModal'
import Header from './components/Header'
import AudioPlayer from './components/AudioPlayer'
import DebugHUD from './components/DebugHUD'

// Hooks
import { useDreamSystem } from './hooks/useDreamSystem'
import { useSearchEngine } from './hooks/useSearchEngine'

const API_BASE = 'http://localhost:8000'
const MemoizedGalaxy = memo(GalaxyView)

export default function App() {
  const [status, setStatus] = useState('Standby')
  const [isStoryMode, setIsStoryMode] = useState(false)
  const [isGalaxyView, setIsGalaxyView] = useState(true)
  const [previewItem, setPreviewItem] = useState(null)
  const [showTeachModal, setShowTeachModal] = useState(false)
  const [teachName, setTeachName] = useState('')
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [cameraTarget, setCameraTarget] = useState(null)
  const [selected, setSelected] = useState(new Set())

  // --- Logic Hooks ---
  const { stats, identities, discovery, refresh } = useDreamSystem(API_BASE)
  const { items, setItems, query, setQuery, threshold, setThreshold, handleSearch } = useSearchEngine(API_BASE, setStatus, setIsStoryMode, setCurrentTrack, setIsPlaying)

  // 🛡️ GALAXY DATA MANAGEMENT
  const [galaxyData, setGalaxyData] = useState([])
  const fetchGalaxy = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/galaxy/all`)
      setGalaxyData(res.data)
    } catch (e) { }
  }, [])

  // Initial Boot Sequence
  useEffect(() => { 
    fetchGalaxy()
    handleSearch('', true) // Load latest memories + auto music
  }, [handleSearch, fetchGalaxy])

  const playTrack = (track) => {
    if (currentTrack?.path === track.path) setIsPlaying(!isPlaying)
    else { setCurrentTrack(track); setIsPlaying(true); }
  }

  const handleIdentityClick = useCallback((name) => {
    setQuery(name); setIsGalaxyView(true); handleSearch(name);
  }, [handleSearch])

  const handleQuickTeach = async (path, name) => {
    try {
      await axios.post(`${API_BASE}/api/identities/teach`, { name, anchors: [path] })
      refresh(); // Update sidebar counts
      setStatus(`AI Learned: ${name}`)
    } catch (e) { setStatus('Teach Failed') }
  }

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden relative">
      
      {/* 🌌 Neo-Glass Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-purple-600/10 rounded-full blur-[100px]" />
      </div>

      <AnimatePresence>
        {isGalaxyView && (
          <MemoizedGalaxy 
            items={galaxyData.length > 0 ? galaxyData : items} 
            highlights={items}
            cameraTarget={cameraTarget}
            onSelectNode={(item) => { 
              if (item.type === 'audio') playTrack(item)
              else { setPreviewItem(item); setIsGalaxyView(false); }
            }} 
            apiBase={API_BASE} 
          />
        )}
      </AnimatePresence>

      <div className="relative z-50 h-full flex flex-col shrink-0">
        <Sidebar 
          stats={stats} identities={identities} discovery={discovery} 
          isGalaxyView={isGalaxyView} setIsGalaxyView={setIsGalaxyView}
          onIdentityClick={handleIdentityClick}
          onDeleteIdentity={async (name) => { if(confirm(`Forget ${name}?`)) { await axios.delete(`${API_BASE}/api/identities/${name}`); refresh(); } }}
          apiBase={API_BASE} 
        />
      </div>

      <main className={`flex-1 flex flex-col relative z-10 min-w-0 overflow-hidden transition-all duration-1000 ${isGalaxyView ? 'translate-x-[20%] opacity-0 pointer-events-none scale-95' : 'translate-x-0 opacity-100'}`}>
        <Header query={query || ""} setQuery={setQuery} onSearch={(v) => { setIsGalaxyView(false); handleSearch(v); }} threshold={threshold} setThreshold={setThreshold} selectedCount={selected.size} onTeach={() => setShowTeachModal(true)} onWeave={async () => { const res = await axios.post(`${API_BASE}/api/weave`, { anchors: Array.from(selected) }); setItems(res.data); setIsStoryMode(true); }} />
        <div className="flex-1 flex overflow-hidden">
          <GridView items={items} selected={selected} onSelect={(path) => { const next = new Set(selected); next.has(path) ? next.delete(path) : next.add(path); setSelected(next); }} onPreview={setPreviewItem} isStoryMode={isStoryMode} apiBase={API_BASE} currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playTrack} />
        </div>
      </main>

      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-2xl border border-white/10 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest text-white/30 z-40 flex items-center gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />{status}
      </div>

      <AnimatePresence>
        {previewItem && (
          <Inspector 
            previewItem={previewItem} 
            onClose={() => setPreviewItem(null)} 
            onLoom={async (p) => {
              setStatus(`🧵 Weaving scene...`); setPreviewItem(null);
              const res = await axios.get(`${API_BASE}/api/search/seed?path=${encodeURIComponent(p)}`);
              setItems(res.data); setIsGalaxyView(true);
            }} 
            apiBase={API_BASE}
            onQuickTeach={handleQuickTeach}
            knownIdentities={identities}
          />
        )}
        {showTeachModal && <TeachModal selectedCount={selected.size} teachName={teachName || ""} setTeachName={setTeachName} onCancel={() => setShowTeachModal(false)} onConfirm={async () => {
          await axios.post(`${API_BASE}/api/identities/teach`, { name: teachName, anchors: Array.from(selected) })
          setSelected(new Set()); setTeachName(''); setShowTeachModal(false); refresh();
        }} />}
      </AnimatePresence>

      <AudioPlayer currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playTrack} apiBase={API_BASE} />
      <DebugHUD stats={stats} itemsCount={items.length} identitiesCount={identities.length} />
    </div>
  )
}
