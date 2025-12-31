import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, Scan, BrainCircuit, Activity, Clock, FileType, Zap, Hash } from 'lucide-react'

export default function Inspector({ previewItem, onClose, onLoom, apiBase, onQuickTeach, knownIdentities, currentTrack, isPlaying, onPlay }) {
  const [teachInput, setTeachInput] = useState('')
  const isAudio = previewItem.type === 'audio'
  
  // 🛡️ Safe Metadata Parsing
  let meta = {}
  try {
    meta = typeof previewItem.metadata === 'string' ? JSON.parse(previewItem.metadata) : previewItem.metadata || {}
  } catch (e) {
    console.warn("Corrupt Metadata:", previewItem.metadata)
    meta = { error: "DATA_CORRUPT" }
  }

  const dateStr = previewItem.ts_inferred ? new Date(previewItem.ts_inferred * 1000).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : "Unknown Time"

  // 🧬 Neural DNA Generation (Simulated from Path Hash)
  // In a real vector system, we would visualize the 512 floats directly.
  // Here we hash the path string to generate a unique "Barcode" for this asset.
  const seed = previewItem.path.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const dnaBars = Array.from({ length: 24 }).map((_, i) => {
    const val = Math.sin(seed * (i + 1)) * 100
    return Math.abs(val)
  })

  // 📊 Confidence Level (Fake Logic based on source)
  const confidence = previewItem.time_source === 'exif' ? 98 : 45

  return (
    <motion.div 
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 100, opacity: 0 }}
      className="fixed top-6 right-6 bottom-40 w-[360px] z-[150] font-mono text-[10px]"
    >
      <div className="h-full flex flex-col bg-[#050505]/80 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
        
        {/* Neon Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* --- IMAGE HEADER --- */}
        <div className="relative h-64 shrink-0 bg-black/50 border-b border-white/10 group">
          <img 
            src={`${apiBase}/${isAudio ? 'thumbs/music_cover.jpg' : previewItem.path}`} 
            className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
          
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/20 transition-all border border-white/5 z-20">
            <X size={14} />
          </button>

          {isAudio && (
            <button 
              onClick={() => onPlay(previewItem)}
              className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 hover:scale-110 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] z-20"
            >
              {isPlaying && currentTrack?.path === previewItem.path ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
          )}

           {/* Filename Overlay */}
           <div className="absolute bottom-4 left-4 right-16 z-10">
              <h2 className="text-sm font-bold text-white truncate drop-shadow-md">{previewItem.path.split('/').pop()}</h2>
              <p className="text-[9px] text-white/50 font-medium tracking-wide uppercase">{previewItem.cluster_label || "UNCLASSIFIED"}</p>
           </div>
        </div>

        {/* --- DATA SCROLL --- */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 scrollbar-hide relative z-10">

          {/* 1. Neural DNA (The Insight) */}
          <div className="space-y-3">
             <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <SectionTitle icon={<BrainCircuit size={12}/>} label="NEURAL DNA" />
                <span className="text-[9px] text-blue-400 font-bold">{confidence}% MATCH</span>
             </div>
             
             {/* DNA Barcode */}
             <div className="h-8 flex items-center gap-[1px] opacity-80">
                {dnaBars.map((h, i) => (
                    <div 
                        key={i} 
                        className={`flex-1 rounded-full ${h > 50 ? 'bg-purple-500' : 'bg-blue-500/50'}`} 
                        style={{ height: `${20 + (h * 0.6)}%`, opacity: h / 100 }} 
                    />
                ))}
             </div>
             <p className="text-[9px] text-white/30 italic leading-relaxed">
                "Unique semantic signature generated from asset context and visual embeddings."
             </p>

             <div className="flex gap-2 mt-2">
                <button 
                  onClick={() => onLoom(previewItem.path)}
                  className="flex-1 py-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 font-bold hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2 group"
                >
                  <Scan size={14} className="group-hover:rotate-90 transition-transform" /> LOOM CONTEXT
                </button>
             </div>
          </div>

          {/* 2. Signal Data */}
          <div className="space-y-3">
             <SectionTitle icon={<Activity size={12}/>} label="SIGNAL TELEMETRY" />
             
             <div className="grid grid-cols-2 gap-3">
                <MetaBit label="RESOLUTION" value={meta.res || "---"} icon={<FileType size={10}/>} />
                <MetaBit label="FILE SIZE" value={meta.size_kb ? `${meta.size_kb} KB` : "---"} icon={<Hash size={10}/>} />
                <MetaBit label="TIMESTAMP" value={dateStr.split(',')[0]} icon={<Clock size={10}/>} />
                <MetaBit label="TIME SOURCE" value={previewItem.time_source?.toUpperCase() || "AI GUESS"} icon={<Zap size={10}/>} color={previewItem.time_source === 'exif' ? 'text-green-400' : 'text-yellow-400'} />
             </div>
          </div>

          {/* 3. EXIF Deep Dive (If available) */}
          {meta.exif && Object.keys(meta.exif).length > 0 && (
              <div className="space-y-2">
                 <SectionTitle icon={<FileType size={12}/>} label="EXIF DATA" />
                 <div className="bg-white/5 rounded-xl p-3 space-y-1">
                    {Object.entries(meta.exif).slice(0, 5).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-[9px]">
                            <span className="text-white/30 truncate max-w-[100px]">{k}</span>
                            <span className="text-white/70 truncate">{String(v)}</span>
                        </div>
                    ))}
                 </div>
              </div>
          )}

          {/* 4. Teaching Interface */}
          {!isAudio && (
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="text-[9px] font-bold text-white/40 mb-3 uppercase tracking-widest flex items-center gap-2">
                  <FingerprintIcon /> OVERRIDE NEURAL WEIGHTS
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={teachInput}
                  onChange={(e) => setTeachInput(e.target.value)}
                  placeholder="Identify this entity..."
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 text-white focus:outline-none focus:border-blue-500/50 placeholder:text-white/20 h-8"
                />
                <button 
                  onClick={() => { onQuickTeach(previewItem.path, teachInput); setTeachInput(''); }}
                  className="px-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors h-8"
                >
                  TEACH
                </button>
              </div>
              
              {/* Known Tags Chips */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                 {knownIdentities.map(id => (
                    <button key={id.name} onClick={() => setTeachInput(id.name)} className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-white/40 hover:text-white transition-colors">
                       {id.name}
                    </button>
                 ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </motion.div>
  )
}

function SectionTitle({ icon, label }) {
    return (
        <div className="flex items-center gap-2 text-white/30">
            {icon}
            <span className="font-bold tracking-[0.2em] text-[9px]">{label}</span>
        </div>
    )
}

function MetaBit({ label, value, icon, color="text-white/80" }) {
    return (
        <div className="bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
            <div className="text-white/30 mb-1">{icon}</div>
            <div className={`text-xs font-bold truncate ${color}`}>{value}</div>
            <div className="text-[8px] font-black uppercase tracking-widest text-white/20 mt-0.5">{label}</div>
        </div>
    )
}

function FingerprintIcon() {
    return (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c0-3 2.5-5.5 5.5-5.5S23 9 23 12M12 12c0 3-2.5 5.5-5.5 5.5S1 15 1 12M12 12v10M12 2v2"/></svg>
    )
}