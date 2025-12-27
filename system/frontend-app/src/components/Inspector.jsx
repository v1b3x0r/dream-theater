import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Calendar, MapPin, Hash, Aperture, Music, Sparkles, Clock, Share2, Info, Tag, Camera, Check, UserPlus, Zap, ShieldCheck, Fingerprint, Play, Pause } from 'lucide-react'
import axios from 'axios'
import NeuralHalo from './NeuralHalo'

export default function Inspector({ previewItem, onClose, onLoom, apiBase, refreshIdentities, currentTrack, isPlaying, onPlay }) {
  const [newName, setNewName] = useState('')
  if (!previewItem) return null
  
  const isAudio = previewItem.type === 'audio'
  const isVideo = previewItem.type === 'video'
  const rawUrl = `${apiBase}/raw/${previewItem.display_path.split('/').map(encodeURIComponent).join('/')}`
  const imgUrl = isAudio ? null : rawUrl
  
  const meta = previewItem.metadata || {}
  const exif = meta.exif || {}
  const dateStr = previewItem.ts ? new Date(previewItem.ts * 1000).toLocaleString('en-US', { dateStyle: 'long' }) : 'Unknown Timeline'
  const confidence = Math.min(100, Math.max(0, (previewItem.score || 0) * 100))
  
  // 👥 KNOWN IDENTITIES
  const knownHere = previewItem.identities || []

  const handleQuickTeach = async (name) => {
    const targetName = name || newName; if (!targetName) return
    try {
      await axios.post(`${apiBase}/api/identities/teach`, { name: targetName, anchors: [previewItem.path] })
      setNewName(''); if (refreshIdentities) refreshIdentities();
    } catch (e) { }
  }

  const handleUntag = async (name) => {
    try {
      await axios.post(`${apiBase}/api/identities/untag`, { name, path: previewItem.path })
      if (refreshIdentities) refreshIdentities();
    } catch (e) { }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-12 lg:p-20 font-sans" onClick={onClose}>
      
      {/* 🌫️ DEEP AMBIENT BACKDROP */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[40px] transition-all duration-700" onClick={onClose} />

      <motion.div 
        initial={{ y: 40, scale: 0.98, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 40, scale: 0.98, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 350 }}
        className="relative w-full max-w-7xl h-full md:h-[85vh] flex overflow-hidden rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] z-10 bg-[#f5f5f7] text-gray-900" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 📸 LEFT: IMMERSIVE MEDIA (Floating) */}
        <div className="flex-[3] bg-white flex items-center justify-center relative p-8 overflow-hidden group">
          {isAudio ? (
            <div className="text-center relative z-10">
              <div className="w-80 h-80 bg-gray-50 rounded-[3rem] flex items-center justify-center shadow-inner mb-10 mx-auto border border-gray-100"><Music size={80} className="text-gray-300" /></div>
              <h2 className="text-4xl font-semibold tracking-tight text-gray-900">{meta.title || previewItem.display_path}</h2>
              <p className="text-sm font-medium text-gray-400 mt-2 uppercase tracking-widest">{meta.artist || 'DreamOS Audio'}</p>
            </div>
          ) : isVideo ? (
            <video autoPlay loop controls src={rawUrl} className="w-full h-full object-contain drop-shadow-2xl" />
          ) : (
            <motion.img 
              initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: "easeOut" }}
              src={imgUrl} 
              className="w-full h-full object-contain select-none drop-shadow-2xl" 
            />
          )}
        </div>

        {/* 📑 RIGHT: CLEAN INFO PANE (Apple Style) */}
        <div className="w-[400px] bg-[#f5f5f7] border-l border-gray-200/50 flex flex-col relative overflow-hidden">
          
          {/* Header */}
          <div className="p-8 pb-4">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-gray-400">
                <Fingerprint size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">ID #{previewItem.id}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gray-200/50 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer" onClick={onClose}>
                <X size={16} className="text-gray-500" />
              </div>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 leading-snug break-words mb-2">{previewItem.display_path.split('/').pop().split('.')[0]}</h2>
            
            {/* Identity Badges */}
            <div className="flex flex-wrap gap-2 mt-4 min-h-[32px]">
              {knownHere.length > 0 ? knownHere.map(name => (
                <div key={name} className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100 group">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">{name}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleUntag(name); }} className="ml-1 text-blue-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={12} /></button>
                </div>
              )) : (
                <span className="text-xs text-gray-400 italic">No identities detected</span>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-8 py-2 space-y-8 scrollbar-hide">
            
            {/* Teaching Input */}
            <div className="group">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Recognition</label>
              <div className="flex gap-2">
                <input 
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-300"
                  placeholder="Who is this?"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickTeach()}
                />
                <button onClick={() => handleQuickTeach()} className="w-12 bg-gray-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-colors shadow-lg shadow-gray-200"><Check size={18}/></button>
              </div>
            </div>

            {/* Metrics */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Analysis</label>
              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm h-full flex flex-col justify-center">
                  <span className="text-xs text-gray-400 block mb-1">Confidence</span>
                  <span className="text-3xl font-black text-gray-900">{Math.round(confidence)}%</span>
                </div>
                <div className="flex items-center justify-center p-2">
                  <NeuralHalo metrics={previewItem.neural_metrics} />
                </div>
              </div>
            </div>

            {/* Vibe Match */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Sonic Vibe</label>
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-all group" onClick={() => onPlay(previewItem)}>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                  {isPlaying && currentTrack?.path === previewItem.path ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor" className="ml-0.5"/>}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{meta.title || 'Auto-Match'}</p>
                  <p className="text-xs text-gray-400 truncate">{meta.artist || 'DreamOS Audio'}</p>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Metadata</label>
              <MetaRow icon={<Calendar size={14}/>} label="Created" value={dateStr} />
              <MetaRow icon={<Camera size={14}/>} label="Device" value={exif.Model || 'Unknown'} />
              <MetaRow icon={<Aperture size={14}/>} label="Settings" value={exif.FNumber ? `f/${exif.FNumber} • ISO ${exif.ISO || '-'}` : 'Auto'} />
            </div>

          </div>

          {/* Footer Action */}
          <div className="p-8 pt-4 border-t border-gray-200/50 bg-[#f5f5f7]">
            <button onClick={() => onLoom(previewItem.path)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-semibold text-sm hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-300 flex items-center justify-center gap-2">
              <Sparkles size={16} /> Generate Similar
            </button>
          </div>

        </div>
      </motion.div>
    </motion.div>
  )
}

function MetaRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="text-gray-400">{icon}</div>
      <div className="flex-1 flex justify-between border-b border-gray-100 pb-2">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="text-gray-900 font-semibold">{value}</span>
      </div>
    </div>
  )
}