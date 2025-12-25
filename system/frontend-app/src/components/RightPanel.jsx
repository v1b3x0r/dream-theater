import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, X, Clock, Layers, Camera, Maximize2, Palette, ChevronDown, ChevronUp, Activity, Box, Music, Play, Pause, Volume2 } from 'lucide-react'

export default function RightPanel({ previewItem, stats, scanProgress, progressPercent, currentTrack, apiBase }) {
  return (
    <aside className="w-80 bg-black/40 backdrop-blur-3xl border-l border-white/5 flex flex-col z-20 shadow-2xl h-screen overflow-hidden">
      
      {/* --- Context Content (Switch based on selection) --- */}
      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-8">
        <AnimatePresence mode='wait'>
          {previewItem ? (
            <InspectorContent key="inspector" item={previewItem} apiBase={apiBase} />
          ) : (
            <SystemStats key="stats" stats={stats} scanProgress={scanProgress} progressPercent={progressPercent} />
          )}
        </AnimatePresence>
      </div>

      {/* --- Music Player (Always at bottom) --- */}
      <div className="border-t border-white/5 bg-white/[0.02]">
        <MiniPlayer track={currentTrack} apiBase={apiBase} />
      </div>
    </aside>
  )
}

// --- Sub-Components ---

function InspectorContent({ item, apiBase }) {
  const [colors, setColors] = useState([])
  const imgUrl = `${apiBase}/raw/${item.display_path.split('/').map(encodeURIComponent).join('/')}`
  const imgRef = useRef(null)

  // Extract Colors
  useEffect(() => {
    if (!imgRef.current) return
    const extract = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 50; canvas.height = 50
      ctx.drawImage(imgRef.current, 0, 0, 50, 50)
      const data = ctx.getImageData(0, 0, 50, 50).data
      const counts = {}
      for(let i=0; i<data.length; i+=20) {
        const rgb = `rgb(${data[i]},${data[i+1]},${data[i+2]})`
        counts[rgb] = (counts[rgb] || 0) + 1
      }
      setColors(Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5).map(c=>c[0]))
    }
    if(imgRef.current.complete) extract()
  }, [item])

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
      <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/50">
        <img ref={imgRef} src={imgUrl} className="w-full h-full object-contain" onLoad={() => {}} crossOrigin="anonymous" />
      </div>
      
      <div className="flex gap-2 justify-center">
        {colors.map((c, i) => <div key={i} className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: c }} />)}
      </div>

      <section>
        <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2"><Info size={12}/> Insight</h3>
        <div className="space-y-3">
          <MetaItem label="Name" value={item.display_path.split('/').pop()} />
          <MetaItem label="Date" value={new Date(item.ts * 1000).toLocaleDateString('th-TH')} />
          <MetaItem label="Confidence" value={`${(item.conf * 100).toFixed(0)}%`} highlight={item.conf > 0.5} />
        </div>
      </section>

      {item.metadata?.exif?.Model && (
        <section className="bg-white/5 p-4 rounded-2xl border border-white/5">
          <p className="text-[9px] font-black text-white/30 uppercase mb-2 flex items-center gap-2"><Camera size={10}/> Shot On</p>
          <p className="text-sm font-bold text-white/90">{item.metadata.exif.Model}</p>
          <p className="text-xs text-white/50">{item.metadata.exif.LensModel}</p>
        </section>
      )}
    </motion.div>
  )
}

function SystemStats({ stats, scanProgress, progressPercent }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
      <section>
        <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={12}/> Engine Status</h3>
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-white/60">4070 Ti CORE</span>
            <div className={`w-2 h-2 rounded-full ${scanProgress.status === 'indexing' ? 'bg-blue-500 animate-ping' : 'bg-green-500'}`} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-black">
              <span>LOAD</span>
              <span className="text-blue-400">{Math.round(progressPercent)}%</span>
            </div>
            <div className="h-1.5 bg-black/50 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${progressPercent}%` }} className="h-full bg-blue-500" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2"><Box size={12}/> Vault Stats</h3>
        <div className="space-y-1">
          <StatRow label="Total Echoes" value={stats.total} />
          {Object.entries(stats.distribution).map(([k, v]) => <StatRow key={k} label={k} value={v} />)}
        </div>
      </section>
    </motion.div>
  )
}

function MiniPlayer({ track, apiBase }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (track && audioRef.current) {
      audioRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }, [track])

  if (!track) return <div className="h-20 flex items-center justify-center text-xs text-white/20 uppercase tracking-widest font-bold">No Signal</div>

  const rawUrl = `${apiBase}/raw/${track.display_path.split('/').map(encodeURIComponent).join('/')}`

  return (
    <div className="h-24 p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
        {isPlaying ? <Activity size={20} className="animate-pulse" /> : <Music size={20} />}
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-xs font-bold text-white truncate">{track.metadata?.title || 'Unknown'}</p>
        <p className="text-[9px] font-black uppercase text-white/40 tracking-widest truncate">{track.metadata?.artist || 'Ambient'}</p>
      </div>
      <button 
        onClick={() => {
          if (isPlaying) audioRef.current.pause(); else audioRef.current.play();
          setIsPlaying(!isPlaying)
        }}
        className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform shrink-0"
      >
        {isPlaying ? <Pause size={14} fill="black" /> : <Play size={14} fill="black" className="ml-0.5" />}
      </button>
      <audio ref={audioRef} src={rawUrl} onEnded={() => setIsPlaying(false)} />
    </div>
  )
}

function MetaItem({ label, value, highlight }) {
  return <div className="flex justify-between items-center text-xs border-b border-white/5 pb-2"><span className="opacity-40 uppercase font-bold text-[9px]">{label}</span><span className={`font-medium ${highlight ? 'text-blue-400' : 'text-white/80'} truncate max-w-[120px]`}>{value || '-'}</span></div>
}

function StatRow({ label, value }) {
  return <div className="flex justify-between py-2 border-b border-white/5"><span className="text-[10px] opacity-30 uppercase font-bold">{label}</span><span className="text-xs font-bold font-mono">{value}</span></div>
}
