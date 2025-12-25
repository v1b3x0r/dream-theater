import React from 'react'
import { Sparkles, Orbit, Layers, Tag, Box, Activity, Play, Users, X } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Sidebar({ 
  stats, identities, isGalaxyView, setIsGalaxyView, 
  onScan, onIdentityClick, onDeleteIdentity, progressPercent, scanStatus 
}) {
  return (
    <aside className="w-80 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col z-20 shadow-2xl overflow-hidden">
      <div className="p-8 flex items-center gap-4 cursor-pointer" onClick={() => setIsGalaxyView(true)}>
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
          <Sparkles size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tighter italic text-white/90">DreamOS</h1>
          <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.3em]">Modular v2.9.6</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-10 scrollbar-hide pb-40">
        <nav className="space-y-2">
          <NavItem icon={<Orbit size={18}/>} label="Galaxy View" active={isGalaxyView} onClick={() => setIsGalaxyView(true)} />
          <NavItem icon={<Layers size={18}/>} label="Memory Grid" active={!isGalaxyView} onClick={() => setIsGalaxyView(false)} />
        </nav>

        <section>
          <p className="text-[10px] font-black text-white/20 uppercase mb-6 tracking-widest flex items-center gap-2"><Users size={12} /> Identities</p>
          <div className="space-y-3 px-1">
            {identities.map(id => (
              <div key={id.name} className="group flex items-center justify-between bg-white/[0.03] p-2 pr-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                <div className="flex items-center gap-3" onClick={() => onIdentityClick(id.name)}>
                  {id.thumb ? (
                    <img src={`http://localhost:8000${id.thumb}`} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 text-xs font-bold">{id.name[0]}</div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-white/80">{id.name}</p>
                    <p className="text-[9px] opacity-40 font-black">{id.count} Echoes</p>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onDeleteIdentity(id.name); }} className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-400 transition-all"><X size={14} /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white/5 rounded-[2rem] p-6 border border-white/5">
          <p className="text-[10px] font-black text-white/20 uppercase mb-6 tracking-widest flex items-center gap-2"><Box size={12} /> Stats</p>
          <StatRow label="Total" value={stats.total} color="text-white" />
          {Object.entries(stats.distribution).map(([type, count]) => (
            <StatRow key={type} label={type} value={count} color="text-blue-400" />
          ))}
        </section>

        <section className="px-2">
          <p className="text-[10px] font-black text-white/20 uppercase mb-4 tracking-widest flex items-center gap-2"><Activity size={12} /> Engine</p>
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex justify-between items-center text-[10px] mb-3">
              <span className="opacity-40">{scanStatus.status === 'indexing' ? 'SCANNING' : '4070 Ti READY'}</span>
              <span className="text-blue-400 font-bold">{scanStatus.status === 'indexing' ? `${Math.round(progressPercent)}%` : 'ACTIVE'}</span>
            </div>
            <div className="w-full h-0.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div animate={scanStatus.status === 'indexing' ? { width: `${progressPercent}%` } : { x: [-100, 200], width: '50%' }} className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
            </div>
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-white/5">
        <button onClick={onScan} disabled={scanStatus.status === 'indexing'} className="w-full py-4 rounded-3xl bg-blue-600 hover:bg-blue-500 font-black text-[10px] uppercase tracking-widest transition-all">Sync Universe</button>
      </div>
    </aside>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className={`flex items-center gap-4 px-5 py-4 rounded-[1.5rem] cursor-pointer transition-all duration-500 ${active ? 'bg-blue-600 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] scale-105' : 'text-white/30 hover:bg-white/5'}`}>
      {icon} <span className="text-xs font-black uppercase tracking-widest">{label}</span>
    </div>
  )
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5"><span className="text-[9px] opacity-20 font-black uppercase">{label}</span><span className={`text-xs font-black ${color}`}>{value}</span></div>
  )
}
