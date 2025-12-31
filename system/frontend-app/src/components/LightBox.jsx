import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, Scan, BrainCircuit, Activity, Clock, FileType, Hash, Zap, ChevronLeft, ChevronRight, Wand2 } from 'lucide-react'

export default function LightBox({ item, onClose, onLoom, apiBase, onQuickTeach, knownIdentities, currentTrack, isPlaying, onPlay }) {
  const [teachInput, setTeachInput] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [localTags, setLocalTags] = useState(item.identities || [])
  
  // AI State
  const [aiResponse, setAiResponse] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)

  const handleAskAI = async () => {
      setAiLoading(true)
      try {
          const userPrompt = localStorage.getItem('dream_system_prompt') || "Describe this image in detail."
          
          // 💉 Context Injection
          let context = ""
          if (localTags.length > 0) {
              context += `The people in this image are: ${localTags.join(', ')}. `
          }
          if (item.ts_inferred) {
              const date = new Date(item.ts_inferred * 1000).toLocaleDateString()
              context += `This photo was taken on ${date}. `
          }
          
          const finalPrompt = `${context}\n\n${userPrompt}`

          const res = await fetch(`${apiBase}/api/ai/ask`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ prompt: finalPrompt, image_path: item.path })
          })
          const data = await res.json()
          setAiResponse(data.response)
      } catch (e) { setAiResponse("AI Brain Offline.") }
      setAiLoading(false)
  }

  const handleUntag = async (name) => {
      try {
          // Optimistic Update
          setLocalTags(prev => prev.filter(t => t !== name))
          setFeedback(`Removing ${name}...`)
          
          await fetch(`${apiBase}/api/identities/untag`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, path: item.path })
          })
          setFeedback(`Removed ${name}`)
          setTimeout(() => setFeedback(null), 2000)
      } catch (e) {
          setFeedback("Error removing tag")
          setLocalTags(prev => [...prev, name]) // Revert
      }
  }

  const handleTeach = async (name) => {
      if(!name) return
      setFeedback(`Learning ${name}...`)
      await onQuickTeach(item.path, name)
      setLocalTags(prev => [...prev, name])
      setTeachInput('')
      setFeedback(`Learned ${name}!`)
      setTimeout(() => setFeedback(null), 2000)
  }

  const isAudio = item.type === 'audio'
  const isVideo = item.type === 'video'
  
  // 🛡️ Safe Metadata Parsing
  let meta = {}
  try {
    meta = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata || {}
  } catch (e) { meta = {} }

  const dateStr = item.ts_inferred ? new Date(item.ts_inferred * 1000).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : "Unknown Time"
  const seed = item.path.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const dnaBars = Array.from({ length: 24 }).map((_, i) => Math.abs(Math.sin(seed * (i + 1)) * 100))

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 sm:p-12"
      onClick={onClose} // Click outside to close
    >
      
      {/* 🎭 THE STAGE (Container) */}
      <div 
        className="w-full h-full max-w-7xl flex gap-8 items-center justify-center"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
      >
        
        {/* 🖼️ HERO CONTENT (Left/Center) */}
        <motion.div 
          layoutId={`hero-${item.path}`}
          className="flex-1 h-full flex items-center justify-center relative group"
        >
            {isAudio ? (
                <div className="w-96 h-96 bg-white/5 rounded-full border border-white/10 flex items-center justify-center animate-pulse">
                     <div className="w-64 h-64 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur-[80px] opacity-50" />
                     <img src={`${apiBase}/thumbs/music_cover.jpg`} className="w-64 h-64 rounded-full object-cover relative z-10 shadow-2xl" />
                     <button 
                        onClick={() => onPlay(item)}
                        className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                            {isPlaying && currentTrack?.path === item.path ? <Pause size={32} className="text-black" /> : <Play size={32} className="text-black ml-1" />}
                        </div>
                     </button>
                </div>
            ) : isVideo ? (
                <video 
                    src={`${apiBase}/raw/${item.path}`} 
                    className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                    controls autoPlay loop playsInline
                />
            ) : (
                <img 
                    src={`${apiBase}/raw/${item.path}`} 
                    className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm"
                    alt="Memory"
                />
            )}
        </motion.div>

        {/* ℹ️ INFO PANEL (Right) - Apple Photos Style */}
        <motion.div 
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-[320px] h-full flex flex-col bg-[#111]/80 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shrink-0"
        >
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-start">
                <div>
                    <h2 className="text-sm font-bold text-white line-clamp-1">{item.path.split('/').pop()}</h2>
                    <p className="text-[10px] text-white/40 mt-1 uppercase tracking-wider">{dateStr}</p>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X size={16} className="text-white/50" /></button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide text-[10px] font-mono">
                
                {/* 1. Neural Context */}
                <div>
                    <SectionLabel icon={<BrainCircuit size={12}/>} label="NEURAL CONTEXT" />
                    <div className="h-12 flex items-end gap-[1px] mt-2 opacity-50 mb-3">
                        {dnaBars.map((h, i) => (
                            <div key={i} className={`flex-1 rounded-t-sm ${h > 60 ? 'bg-purple-500' : 'bg-white/20'}`} style={{ height: `${h}%` }} />
                        ))}
                    </div>
                    
                    <div className="flex gap-2">
                        <button onClick={() => onLoom(item.path)} className="flex-1 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 font-bold hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2">
                            <Scan size={12} /> SCAN SIMILAR
                        </button>
                        <button onClick={handleAskAI} disabled={aiLoading} className="px-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 font-bold hover:bg-purple-500/20 transition-all flex items-center justify-center disabled:opacity-50">
                            {aiLoading ? <Activity size={12} className="animate-spin"/> : <Wand2 size={12} />}
                        </button>
                    </div>

                    {/* AI Response Box */}
                    <AnimatePresence>
                        {aiResponse && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mt-3 bg-purple-500/5 border border-purple-500/10 p-3 rounded-xl overflow-hidden"
                            >
                                <div className="flex items-center gap-2 text-purple-300 mb-1">
                                    <Wand2 size={10} /> <span className="text-[8px] font-black uppercase">Ollama Insight</span>
                                </div>
                                <p className="text-white/70 leading-relaxed italic">{aiResponse}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 2. Metadata Grid */}
                <div>
                    <SectionLabel icon={<Activity size={12}/>} label="METADATA" />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <InfoTile label="DIMENSIONS" value={meta.res} />
                        <InfoTile label="SIZE" value={meta.size_kb ? `${meta.size_kb} KB` : null} />
                        <InfoTile label="ISO" value={meta.exif?.ISOSpeedRatings} />
                        <InfoTile label="F-STOP" value={meta.exif?.FNumber} />
                    </div>
                </div>

                {/* 3. Teaching */}
                {!isAudio && (
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5 relative">
                        {feedback && (
                            <div className="absolute -top-8 left-0 right-0 bg-green-500/20 text-green-400 text-[9px] font-bold py-1 px-3 rounded-lg text-center animate-pulse border border-green-500/30">
                                {feedback}
                            </div>
                        )}
                        <SectionLabel icon={<Zap size={12}/>} label="TEACH NEURAL NET" />
                        
                        {/* Current Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {localTags.length > 0 ? localTags.map(tag => (
                                <div key={tag} className="flex items-center gap-1 pl-2 pr-1 py-0.5 bg-blue-500/20 border border-blue-500/30 rounded-md text-blue-300">
                                    <span>{tag}</span>
                                    <button onClick={() => handleUntag(tag)} className="p-0.5 hover:bg-white/10 rounded-full text-blue-300/50 hover:text-white transition-colors">
                                        <X size={8} />
                                    </button>
                                </div>
                            )) : <span className="text-white/20 italic">No identities linked</span>}
                        </div>

                        <div className="flex gap-2 mt-2">
                            <input 
                                value={teachInput} onChange={e => setTeachInput(e.target.value)}
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2 text-white/90 h-8 focus:outline-none focus:border-white/30"
                                placeholder="Name..."
                            />
                            <button onClick={() => handleTeach(teachInput)} className="px-3 bg-white text-black font-bold rounded-lg h-8 hover:bg-gray-200">OK</button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {knownIdentities.map(id => (
                                <button key={id.name} onClick={() => handleTeach(id.name)} className="px-2 py-0.5 bg-white/5 rounded text-white/30 hover:text-white hover:bg-white/10 transition-colors">
                                    {id.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

        </motion.div>

      </div>
    </motion.div>
  )
}

function SectionLabel({ icon, label }) {
    return (
        <div className="flex items-center gap-2 text-white/30 mb-1">
            {icon} <span className="font-bold tracking-widest text-[9px]">{label}</span>
        </div>
    )
}

function InfoTile({ label, value }) {
    if (!value) return null
    return (
        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
            <div className="text-white/80 font-bold truncate">{value}</div>
            <div className="text-[8px] text-white/20 font-black uppercase">{label}</div>
        </div>
    )
}
