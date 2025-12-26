import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, MapPin, Hash, Aperture, Music, Sparkles, Clock, Share2, Info, Tag, Camera, Check, UserPlus, Zap, ShieldCheck, Fingerprint, Play, Pause, User } from 'lucide-react'

export default function Inspector({ previewItem, onClose, onLoom, apiBase, onQuickTeach, knownIdentities, currentTrack, isPlaying, onPlay }) {
  const [newName, setNewName] = useState('')
  if (!previewItem) return null
  
  const isAudio = previewItem.type === 'audio'
  const isVideo = previewItem.type === 'video'
  
  // 📸 MASTER URL SYNC: Direct use of backend-provided raw_url
  const rawUrl = `${apiBase}${previewItem.raw_url}`
  const imgUrl = isAudio ? null : rawUrl
  
  const meta = previewItem.metadata || {}
  const exif = meta.exif || {}
  const dateStr = previewItem.ts ? new Date(previewItem.ts * 1000).toLocaleString('en-US', { dateStyle: 'long' }) : 'Temporal Anomaly'
  const confidence = Math.min(100, Math.max(0, (previewItem.score || 0) * 100))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-8 lg:p-16" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[80px]" onClick={onClose} />

      <motion.div 
        initial={{ y: "100%", scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: "100%", scale: 0.9 }}
        transition={{ type: "spring", damping: 35, stiffness: 250 }}
        className="relative w-full max-w-7xl h-full md:h-[85vh] bg-white/[0.03] border border-white/20 rounded-none md:rounded-[3rem] flex overflow-hidden shadow-2xl backdrop-blur-3xl z-10" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT: MEDIA */}
        <div className="flex-[3] bg-black/20 flex items-center justify-center relative overflow-hidden">
          {isAudio ? (
            <div className="text-center relative z-10">
              <div className="w-80 h-80 bg-white/5 rounded-[4rem] flex items-center justify-center shadow-2xl mb-10 mx-auto border border-white/10 backdrop-blur-3xl"><Music size={100} className="text-white/20" /></div>
              <h2 className="text-4xl font-black text-white/90 tracking-tight">{meta.title || previewItem.display_path}</h2>
            </div>
          ) : isVideo ? (
            <video autoPlay loop controls src={rawUrl} className="w-full h-full object-cover" />
          ) : (
            <img src={imgUrl} className="w-full h-full object-cover select-none" />
          )}
        </div>

        {/* RIGHT: HUD */}
        <div className="w-[480px] bg-white/[0.02] p-12 flex flex-col gap-10 overflow-y-auto scrollbar-hide relative border-l border-white/10 backdrop-blur-3xl">
          
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <Fingerprint size={16} className="text-blue-400" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Neural Index #{previewItem.id}</span>
              </div>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter">{previewItem.display_path.split('/').pop().split('.')[0]}</h2>
          </div>

          {/* 👥 SMART FEEDBACK SECTION */}
          <section className="space-y-4">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Quick Tag</p>
            
            {/* Quick Select Buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
              {knownIdentities.slice(0, 5).map(id => (
                <button 
                  key={id.name}
                  onClick={() => onQuickTeach(previewItem.path, id.name)}
                  className="px-4 py-2 bg-white/5 hover:bg-blue-600/40 border border-white/10 rounded-full text-[10px] font-bold transition-all"
                >
                  {id.name}
                </button>
              ))}
            </div>

            <div className="flex gap-2 p-1.5 bg-white/5 rounded-[1.8rem] border border-white/10 shadow-inner">
              <input 
                className="flex-1 bg-transparent px-5 py-3 text-sm outline-none text-white placeholder:text-white/10"
                placeholder="New name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onQuickTeach(previewItem.path, newName)}
              />
              <button onClick={() => onQuickTeach(previewItem.path, newName)} className="w-12 h-12 bg-white text-black rounded-[1.4rem] flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all"><Check size={20}/></button>
            </div>
          </section>

          {/* ... METRICS & ACTIONS ... */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10">
              <p className="text-[9px] font-black text-white/20 uppercase mb-2">Resonance</p>
              <p className="text-3xl font-black text-white">{Math.round(confidence)}%</p>
            </div>
            <button onClick={() => onLoom(previewItem.path)} className="bg-white text-black rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-600 hover:text-white transition-all shadow-2xl flex flex-col items-center justify-center gap-1">
              <Sparkles size={18} /> Craft
            </button>
          </div>

          <div className="space-y-6 pt-4 border-t border-white/5">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-2"><Info size={14}/> Telemetry</p>
            <div className="space-y-4 px-2">
              <div className="flex items-center gap-4">
                <Calendar size={16} className="text-white/20"/>
                <div><p className="text-[8px] text-white/20 uppercase font-black">Timeline</p><p className="text-sm text-white/80 font-bold">{dateStr}</p></div>
              </div>
              <div className="flex items-center gap-4">
                <Camera size={16} className="text-white/20"/>
                <div><p className="text-[8px] text-white/20 uppercase font-black">Device</p><p className="text-sm text-white/80 font-bold">{exif.Model || 'Generic'}</p></div>
              </div>
            </div>
          </div>
        </div>

        <button onClick={onClose} className="absolute top-8 left-8 w-14 h-14 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center backdrop-blur-xl group"><X size={24} className="text-white/60 group-hover:text-white" /></button>
      </motion.div>
    </motion.div>
  )
}
