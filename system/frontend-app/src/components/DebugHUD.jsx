import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, X, Box, Activity, Database, Cpu, Zap, Radio, Image as ImageIcon, Music, Video, Settings, Save, Upload } from 'lucide-react'
import axios from 'axios'

export default function DebugHUD({ stats, itemsCount, apiBase }) {
  const [isVisible, setIsVisible] = useState(true)
  const [showConfig, setShowConfig] = useState(false)
  const [scanStatus, setScanStatus] = useState({ current: 0, total: 0, status: 'idle', last_event: 'Standby' })
  const [logs, setLogs] = useState([])
  
  // AI State
  const [aiStatus, setAiStatus] = useState({ available: false, models: [] })
  const [systemPrompt, setSystemPrompt] = useState(localStorage.getItem('dream_system_prompt') || "Describe this image in detail.")

  // 🛡️ Polling & Log Buffer
  useEffect(() => {
    // 1. Initial AI Check
    axios.get(`${apiBase}/api/ai/status`).then(res => setAiStatus(res.data)).catch(()=>{})

    const timer = setInterval(async () => {
      try {
        const res = await axios.get(`${apiBase}/api/scan/progress`)
        setScanStatus(prev => {
          if (res.data.last_event !== prev.last_event) {
            setLogs(l => [res.data.last_event, ...l].slice(0, 3))
          }
          return res.data
        })
      } catch (e) { }
    }, 1000)
    return () => clearInterval(timer)
  }, [apiBase])

  const handleModelChange = async (type, name) => {
      await axios.post(`${apiBase}/api/ai/config`, { type, model: name })
      setAiStatus(prev => ({ ...prev, [`${type}_model`]: name }))
  }

  const handlePromptChange = (val) => {
      setSystemPrompt(val)
      localStorage.setItem('dream_system_prompt', val)
  }

  const handleBackup = async () => {
      const res = await axios.post(`${apiBase}/api/system/backup`)
      setLogs(l => [`💾 Backup Saved: ${res.data.stats}`, ...l])
  }

  const handleRestore = async () => {
      if(!confirm("Restore Memory? This might duplicate data.")) return
      const res = await axios.post(`${apiBase}/api/system/restore`)
      setLogs(l => [`♻️ System Restored`, ...l])
  }

  if (!isVisible) return null

  const isWorking = scanStatus.status !== 'idle'
  const progress = scanStatus.total > 0 ? (scanStatus.current / scanStatus.total) * 100 : 0
  const distribution = stats?.distribution || {}

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-28 right-6 z-[200] w-80 font-mono text-[10px]"
    >
      {/* 🔮 The Glass Container */}
      <div className="relative bg-[#050505]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden group">
        
        {/* Neon Glow (Breathing) */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[60px] rounded-full pointer-events-none transition-all duration-1000 ${isWorking ? 'bg-purple-500/30 scale-125' : 'scale-100'}`} />

        {/* --- HEADER --- */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            {/* The Pulse Core */}
            <div className="relative flex h-3 w-3">
               <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isWorking ? 'bg-purple-400' : 'bg-emerald-400'}`}></span>
               <span className={`relative inline-flex rounded-full h-3 w-3 ${isWorking ? 'bg-purple-500' : 'bg-emerald-500'}`}></span>
            </div>
            <div>
              <div className="text-white font-black tracking-[0.2em] uppercase text-[10px]">Cortex v7.7</div>
              <div className="text-white/30 text-[8px] flex items-center gap-1">
                <Cpu size={8} /> {stats?.device || 'MPS'} :: {isWorking ? 'PROCESSING' : 'ONLINE'}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowConfig(!showConfig)} className={`text-white/20 hover:text-white transition-colors ${showConfig ? 'text-blue-400' : ''}`}>
                <Settings size={14} />
            </button>
            <button onClick={() => setIsVisible(false)} className="text-white/20 hover:text-white transition-colors">
                <X size={14} />
            </button>
          </div>
        </div>

        {/* --- CONFIG PANEL (Sliding) --- */}
        <AnimatePresence>
            {showConfig && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mb-4 space-y-3 bg-white/5 p-3 rounded-xl border border-white/5"
                >
                    <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Neural Configuration</div>
                    
                    {/* Chat Model */}
                    <div>
                        <label className="block text-white/40 mb-1">CEREBRAL CORTEX (CHAT)</label>
                        <select 
                            className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
                            value={aiStatus.chat_model || ''}
                            onChange={(e) => handleModelChange('chat', e.target.value)}
                        >
                            {aiStatus.models?.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    {/* Vision Model */}
                    <div>
                        <label className="block text-white/40 mb-1">OCCIPITAL LOBE (VISION)</label>
                        <select 
                            className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-white focus:outline-none"
                            value={aiStatus.vision_model || ''}
                            onChange={(e) => handleModelChange('vision', e.target.value)}
                        >
                            {aiStatus.models?.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    {/* System Prompt */}
                    <div>
                        <label className="block text-white/40 mb-1">SYSTEM PERSONA</label>
                        <textarea 
                            className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-white focus:outline-none text-[9px] h-12 resize-none"
                            value={systemPrompt}
                            onChange={(e) => handlePromptChange(e.target.value)}
                            placeholder="e.g. Describe in Thai, be poetic..."
                        />
                    </div>

                    {/* System Ops */}
                    <div>
                        <label className="block text-white/40 mb-1">MEMORY CRYSTAL</label>
                        <div className="flex gap-2">
                            <button onClick={handleBackup} className="flex-1 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded flex items-center justify-center gap-1 hover:bg-green-500/20">
                                <Save size={10} /> BACKUP
                            </button>
                            <button onClick={handleRestore} className="flex-1 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded flex items-center justify-center gap-1 hover:bg-blue-500/20">
                                <Upload size={10} /> RESTORE
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* --- ASSET BREAKDOWN (New Section) --- */}
        <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
            <MiniStat icon={<ImageIcon size={10} />} value={distribution.image || 0} label="IMG" />
            <MiniStat icon={<Music size={10} />} value={distribution.audio || 0} label="AUD" />
            <MiniStat icon={<Video size={10} />} value={distribution.video || 0} label="VID" color="text-red-400" />
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-2 gap-2 relative z-10 mb-6">
           <BitStat label="Total Synapses" value={stats?.total || 0} icon={<Database size={10}/>} />
           <BitStat label="Active Visuals" value={itemsCount} icon={<Box size={10}/>} color="text-blue-400" />
        </div>

        {/* --- ACTIVE TASK (Progress) --- */}
        <AnimatePresence>
          {isWorking && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="flex justify-between text-[8px] text-white/50 mb-1 uppercase font-bold tracking-wider">
                 <span>Indexing Memory...</span>
                 <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- TERMINAL LOGS --- */}
        <div className="relative z-10 border-t border-white/5 pt-4">
          <div className="space-y-1.5 h-16 overflow-hidden mask-fade-bottom">
             {logs.length === 0 && <span className="text-white/20 italic">Awaiting signals...</span>}
             <AnimatePresence mode='popLayout'>
                {logs.map((log, i) => (
                  <motion.div 
                    key={log + i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1 - (i * 0.3), x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-white/60"
                  >
                    <span className="text-blue-500">›</span> {log}
                  </motion.div>
                ))}
             </AnimatePresence>
          </div>
        </div>

      </div>
    </motion.div>
  )
}

function MiniStat({ icon, value, label, color="text-white" }) {
    return (
        <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col items-center justify-center">
            <div className="text-white/30 mb-1">{icon}</div>
            <div className={`text-xs font-bold ${color}`}>{value}</div>
            <div className="text-[6px] font-black uppercase tracking-widest text-white/20">{label}</div>
        </div>
    )
}

function BitStat({ label, value, icon, color="text-white" }) {
  return (
    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
      <div className="flex justify-between items-start mb-1">
        <span className="text-white/30">{icon}</span>
      </div>
      <div className={`text-xl font-bold tracking-tighter ${color}`}>{value}</div>
      <div className="text-[8px] font-black uppercase tracking-widest text-white/20">{label}</div>
    </div>
  )
}