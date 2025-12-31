import React, { useState, useEffect, useCallback, memo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import axios from 'axios'

// Components
import Sidebar from './components/Sidebar'
import GridView from './components/GridView'
import GalaxyView from './components/GalaxyView'
import FacesView from './components/FacesView'
import Inspector from './components/Inspector'
import LightBox from './components/LightBox'
import TeachModal from './components/TeachModal'
import Header from './components/Header'
import AudioPlayer from './components/AudioPlayer'
import DebugHUD from './components/DebugHUD'
import OmniscientDebug from './components/OmniscientDebug'

// Hooks
import { useDreamSystem } from './hooks/useDreamSystem'
import { useSearchEngine } from './hooks/useSearchEngine'

const API_BASE = 'http://localhost:8000'
const MemoizedGalaxy = memo(GalaxyView)

export default function App() {
  const [status, setStatus] = useState('Standby')
  const [isStoryMode, setIsStoryMode] = useState(false)
  const [isGalaxyView, setIsGalaxyView] = useState(true)
  const [isFacesView, setIsFacesView] = useState(false)
  const [previewItem, setPreviewItem] = useState(null)
  const [showTeachModal, setShowTeachModal] = useState(false)
  const [teachName, setTeachName] = useState('')
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [cameraTarget, setCameraTarget] = useState(null)
  const [selected, setSelected] = useState(new Set())

  // Logic Hooks
  const { stats, identities, discovery, refresh } = useDreamSystem(API_BASE)
  const { items, setItems, query, setQuery, threshold, setThreshold, handleSearch } = useSearchEngine(API_BASE, setStatus, setIsStoryMode, setCurrentTrack, setIsPlaying)

  const [galaxyData, setGalaxyData] = useState([])
  const fetchGalaxy = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/galaxy/all`)
      setGalaxyData(res.data)
    } catch (e) { }
  }, [])

  useEffect(() => { 
    fetchGalaxy()
    handleSearch('', true) 
  }, [handleSearch, fetchGalaxy])

  const playTrack = (track) => {
    if (currentTrack?.path === track.path) setIsPlaying(!isPlaying)
    else { setCurrentTrack(track); setIsPlaying(true); }
  }

  const handleIdentityClick = useCallback((name) => {
    setQuery(name); setIsGalaxyView(false); setIsFacesView(false); handleSearch(name);
  }, [handleSearch])

  const handleQuickTeach = async (path, name) => {
    try {
      await axios.post(`${API_BASE}/api/identities/teach`, { name, anchors: [path] })
      refresh(); setStatus(`Identity Linked: ${name}`)
    } catch (e) { setStatus('Link Failed') }
  }

  const toggleSelect = (path) => {
    const next = new Set(selected);
    next.has(path) ? next.delete(path) : next.add(path);
    setSelected(next);
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white/90 font-sans overflow-hidden relative selection:bg-white/20">
      
      {/* 🌌 Apple Spatial Atmosphere (Subtle & Deep) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vw] bg-white/[0.03] rounded-full blur-[150px]" />
        <div className="absolute bottom-[-30%] right-[-10%] w-[70vw] h-[70vw] bg-blue-500/[0.02] rounded-full blur-[120px]" />
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
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
          isFacesView={isFacesView} setIsFacesView={setIsFacesView}
          onIdentityClick={handleIdentityClick}
          onDeleteIdentity={async (name) => { if(confirm(`Forget ${name}?`)) { await axios.delete(`${API_BASE}/api/identities/${name}`); refresh(); } }}
          apiBase={API_BASE} 
        />
      </div>

      <main className={`flex-1 flex flex-col relative z-10 min-w-0 overflow-hidden transition-all duration-1000 pl-[300px] ${isGalaxyView ? 'translate-x-[20%] opacity-0 pointer-events-none scale-95' : 'translate-x-0 opacity-100 scale-100'}`}>
        <Header query={query || ""} setQuery={setQuery} onSearch={(v) => { setIsGalaxyView(false); setIsFacesView(false); handleSearch(v); }} threshold={threshold} setThreshold={setThreshold} selectedCount={selected.size} onTeach={() => setShowTeachModal(true)} onWeave={async () => { const res = await axios.post(`${API_BASE}/api/weave`, { anchors: Array.from(selected) }); setItems(res.data); setIsStoryMode(true); }} />
        <div className="flex-1 flex overflow-hidden">
          {isFacesView ? (
             <FacesView apiBase={API_BASE} onTeach={refresh} />
          ) : (
             <GridView 
                items={items} selected={selected} onSelect={toggleSelect} onPreview={setPreviewItem} 
                discovery={discovery} 
                onSearch={(v) => { setIsGalaxyView(false); setIsFacesView(false); handleSearch(v); }}
                apiBase={API_BASE} currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playTrack} 
             />
          )}
        </div>
      </main>

      <AnimatePresence>
        {previewItem && (
          <LightBox 
            item={previewItem} onClose={() => setPreviewItem(null)} 
            onLoom={async (p) => {
              setStatus(`🧵 Weaving scene...`); setPreviewItem(null);
              const res = await axios.get(`${API_BASE}/api/search/seed?path=${encodeURIComponent(p)}`);
              setItems(res.data); setIsGalaxyView(false);
            }} 
            apiBase={API_BASE} onQuickTeach={handleQuickTeach} knownIdentities={identities}
            currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playTrack}
          />
        )}
        {showTeachModal && <TeachModal selectedCount={selected.size} teachName={teachName || ""} setTeachName={setTeachName} onCancel={() => setShowTeachModal(false)} onConfirm={async () => {
          await axios.post(`${API_BASE}/api/identities/teach`, { name: teachName, anchors: Array.from(selected) })
          setSelected(new Set()); setTeachName(''); setShowTeachModal(false); refresh();
        }} />}
      </AnimatePresence>

      <AudioPlayer currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playTrack} apiBase={API_BASE} />
      <DebugHUD stats={stats} itemsCount={items.length} identitiesCount={identities.length} apiBase={API_BASE} />
      
      {/* 👁️ GOD MODE: Press `~` to toggle */}
      <OmniscientDebug godObject={{
        focus: { previewItem, currentTrack, selected: Array.from(selected) },
        universe: { stats, identities, discovery },
        search: { query, count: items.length, threshold, status },
        system: { isStoryMode, isGalaxyView, showTeachModal }
      }} />
    </div>
  )
}
