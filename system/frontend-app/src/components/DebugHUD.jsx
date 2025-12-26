import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Terminal, X, Box, Activity, Database, Cpu } from 'lucide-react'
import axios from 'axios'

export default function DebugHUD({ stats, itemsCount, identitiesCount, apiBase }) {
  const [isVisible, setIsVisible] = useState(true)
  const [scanStatus, setScanStatus] = useState({ current: 0, total: 0, status: 'idle', last_event: 'Standby' })

  // 🛡️ INDEPENDENT POLLING: Doesn't trigger global re-renders
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await axios.get(`${apiBase}/api/scan/progress`)
        setScanStatus(res.data)
      } catch (e) { }
    }, 2000)
    return () => clearInterval(timer)
  }, [apiBase])

  if (!isVisible) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 right-6 z-[200] w-80 bg-black/90 backdrop-blur-3xl border border-blue-500/20 rounded-2xl shadow-2xl p-5 font-mono text-[10px] overflow-hidden"
    >
      <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
        <div className="flex items-center gap-2 text-blue-400">
          <Terminal size={12} />
          <span className="font-black uppercase tracking-widest">System Cortex</span>
        </div>
        <button onClick={() => setIsVisible(false)} className="text-white/20 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StateBit icon={<Database size={10}/>} label="DB_TOTAL" value={stats?.total || 0} />
          <StateBit icon={<Box size={10}/>} label="VIEW_ITEMS" value={itemsCount} />
          <StateBit icon={<Cpu size={10}/>} label="MAPPED" value={stats?.wisdom?.mapped || 0} color="text-purple-400" />
          <StateBit icon={<Activity size={10}/>} label="LOAD" value={scanStatus?.status?.toUpperCase()} color="text-green-400" />
        </div>

        <div className="space-y-1 pt-2 border-t border-white/5">
          <p className="text-blue-400/50 uppercase text-[8px] font-black tracking-tighter">Raw Engine Logs</p>
          <div className="bg-black/40 p-2 rounded-lg border border-white/5 text-[9px] text-white/40 leading-tight">
            <p>{`> Engine: ${stats?.device || 'CUDA'}`}</p>
            <p>{`> Status: ${scanStatus?.last_event || 'Standby'}`}</p>
            <p className="truncate">{`> Memory: ${scanStatus?.last_file || 'None'}`}</p>
          </div>
        </div>

        <div className="flex justify-between items-center text-[8px] text-white/10 uppercase font-black">
          <span>DreamOS Kernel v7.5.2</span>
          <span className="animate-pulse">Live_Sync_OK</span>
        </div>
      </div>
    </motion.div>
  )
}

function StateBit({ icon, label, value, color = "text-blue-400" }) {
  return (
    <div className="bg-white/5 p-2 rounded-xl border border-white/5">
      <div className="flex items-center gap-1.5 opacity-30 mb-1">
        {icon} <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
      </div>
      <div className={`text-xs font-bold ${color}`}>{value}</div>
    </div>
  )
}