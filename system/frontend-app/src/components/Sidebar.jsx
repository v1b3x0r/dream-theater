import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, Orbit, Layers, Tag, Box, Activity, Play, Users, X, Trophy, ShieldCheck, Image as ImageIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'

export default function Sidebar({ 
  stats, identities, discovery, isGalaxyView, setIsGalaxyView, 
  onIdentityClick, onDeleteIdentity, apiBase 
}) {
  const [scanStatus, setScanStatus] = useState({ current: 0, total: 0, status: 'idle', last_event: 'System Standby' })
  const prevEvent = useRef('')

  // 🛡️ ISOLATED POLLING: This only triggers re-renders INSIDE the Sidebar!
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await axios.get(`${apiBase}/api/scan/progress`)
        setScanStatus(res.data)
      } catch (e) { }
    }, 1500)
    return () => clearInterval(timer)
  }, [apiBase])

  const wisdom = stats.wisdom || { level: 0, xp_percent: 0, rank: 'Initializing...' }
  const progressPercent = scanStatus.total > 0 ? (scanStatus.current / scanStatus.total * 100) : 0

  return (
    <aside className="w-72 bg-white/[0.03] backdrop-blur-[100px] border-r border-white/10 flex flex-col z-50 shadow-2xl overflow-hidden shrink-0 h-screen font-sans">
      
      {/* 🏰 User Rank (Liquid Glass Header) */}
      <div className="p-8 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 flex items-center justify-center relative shadow-inner">
            <Trophy className="text-blue-400" size={24} />
            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded-full">LV.{wisdom.level}</div>
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black tracking-tighter text-white/90 italic uppercase truncate">DreamOS</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] truncate">Stellar v7.4.0</p>
          </div>
        </div>
        
        {/* XP Bar */}
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div animate={{ width: `${wisdom.xp_percent}%` }} className="h-full bg-gradient-to-r from-blue-600 to-indigo-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-10 scrollbar-hide py-8">
        <nav className="grid grid-cols-2 gap-2">
          <NavBlock icon={<Orbit size={18}/>} label="Galaxy" active={isGalaxyView} onClick={() => setIsGalaxyView(true)} />
          <NavBlock icon={<Layers size={18}/>} label="Grid" active={!isGalaxyView} onClick={() => setIsGalaxyView(false)} />
        </nav>

        {/* 🤖 AI Discovery */}
        {discovery && discovery.length > 0 && (
          <section>
            <p className="text-[9px] font-black text-white/20 uppercase mb-4 tracking-widest flex items-center gap-2"><Sparkles size={10} /> Bio-Clusters</p>
            <div className="grid grid-cols-3 gap-2">
              {discovery.slice(0, 9).map(album => (
                <div key={album.id} onClick={() => onIdentityClick(album.label)} className="aspect-square bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center relative overflow-hidden group">
                  {album.thumb ? (
                    <img src={`${apiBase}${album.thumb}`} className="w-full h-full object-cover opacity-40 group-hover:opacity-80 transition-all duration-500 scale-110 group-hover:scale-100" />
                  ) : <Box size={14} className="text-white/10" />}
                  <p className="absolute bottom-1 left-1 right-1 text-[6px] font-black uppercase text-center bg-black/40 backdrop-blur-md rounded-md py-0.5 truncate">{album.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <p className="text-[9px] font-black text-white/20 uppercase mb-4 tracking-widest flex items-center gap-2"><Users size={10} /> Entities</p>
          <div className="space-y-1.5 px-1">
            {identities.map(id => (
              <div key={id.name} onClick={() => onIdentityClick(id.name)} className="group flex items-center justify-between bg-white/[0.02] p-2 rounded-xl border border-white/5 hover:bg-white/[0.05] transition-all cursor-pointer">
                <div className="flex items-center gap-3">
                  {id.thumb ? <img src={`${apiBase}${id.thumb}`} className="w-8 h-8 rounded-lg object-cover border border-white/10" /> : <div className="w-8 h-8 rounded-lg bg-blue-600/20" />}
                  <div>
                    <p className="text-xs font-bold text-white/70">{id.name}</p>
                    <p className="text-[8px] opacity-30 font-black uppercase">{id.count} Scenes</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDeleteIdentity(id.name); }} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 p-1 transition-all"><X size={12} /></button>
              </div>
            ))}
          </div>
        </section>

        {/* ⛏️ Neural Load */}
        <section className="px-2 pb-10">
          <p className="text-[9px] font-black text-white/20 uppercase mb-4 tracking-widest flex items-center gap-2"><Activity size={10} /> Neural Stream</p>
          <div className="bg-black/40 rounded-2xl p-4 border border-white/10 relative overflow-hidden">
            <div className="flex justify-between items-center text-[10px] mb-3">
              <span className="opacity-40 uppercase tracking-tighter">{scanStatus.status}</span>
              <span className={`${scanStatus.status === 'dreaming' ? 'text-purple-400' : 'text-blue-400'} font-bold`}>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden mb-3">
              <motion.div animate={scanStatus.status === 'indexing' ? { width: `${progressPercent}%` } : { x: [-100, 200], width: '50%' }} className={`h-full ${scanStatus.status === 'dreaming' ? 'bg-purple-500' : 'bg-blue-500'}`} />
            </div>
            {(scanStatus.status === 'indexing' || scanStatus.status === 'dreaming') && (
              <p className="text-[8px] text-white/30 italic truncate uppercase">{scanStatus.last_event}</p>
            )}
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-white/5 bg-black/20 shrink-0">
        <button onClick={() => axios.post(`${apiBase}/api/scan`)} disabled={scanStatus.status === 'indexing'} className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50">
          Start Deep Survey
        </button>
      </div>
    </aside>
  )
}

function NavBlock({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center justify-center py-4 rounded-xl border cursor-pointer transition-all duration-300 ${active ? 'bg-blue-600/20 border-blue-500/50 text-blue-200 backdrop-blur-md' : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10'}`}>
      {icon}
      <span className="text-[8px] font-black uppercase mt-2 tracking-widest">{label}</span>
    </div>
  )
}