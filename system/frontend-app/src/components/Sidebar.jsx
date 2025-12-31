import React, { useState } from 'react'
import { 
  Box, Globe, Layers, User, X, Cpu, Fingerprint, ScanFace
} from 'lucide-react'

export default function Sidebar({ stats, identities, isGalaxyView, setIsGalaxyView, isFacesView, setIsFacesView, onIdentityClick, onDeleteIdentity, apiBase }) {
  
  return (
    <div className="fixed left-6 top-6 bottom-28 w-[260px] z-50 flex flex-col font-mono text-[10px]">
      
      {/* 🔮 GLASS CONTAINER */}
      <div className="flex-1 flex flex-col bg-[#050505]/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group">
        
        {/* Ambient Glow */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* 🟢 HEADER */}
        <div className="p-6 relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-white to-white/80 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Box size={20} className="text-black" />
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-wider leading-none uppercase">DreamTheater</h1>
              <p className="text-[8px] font-bold text-white/30 tracking-[0.2em] mt-1">THEATER CORE v7.7.0</p>
            </div>
          </div>

          {/* 🧭 NAVIGATION PILLS */}
          <div className="space-y-1">
            <NavItem 
              icon={<Globe size={14} />} 
              label="GALAXY_MAP" 
              active={isGalaxyView && !isFacesView} 
              onClick={() => { setIsGalaxyView(true); setIsFacesView(false); }} 
              color="bg-purple-500"
            />
            <NavItem 
              icon={<Layers size={14} />} 
              label="MEMORY_GRID" 
              active={!isGalaxyView && !isFacesView} 
              onClick={() => { setIsGalaxyView(false); setIsFacesView(false); }} 
              color="bg-blue-500"
            />
            <NavItem 
              icon={<ScanFace size={14} />} 
              label="IDENTIFY" 
              active={isFacesView} 
              onClick={() => { setIsFacesView(true); setIsGalaxyView(false); }} 
              color="bg-orange-500"
            />
          </div>
        </div>

        {/* 🧬 IDENTITIES SECTION */}
        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 relative z-10 scrollbar-hide">
          <div className="flex items-center gap-2 text-white/30 border-b border-white/5 pb-2">
            <Fingerprint size={10} />
            <span className="font-bold tracking-widest text-[9px]">IDENTITIES ({identities.length})</span>
          </div>
          
          <div className="space-y-1">
            {identities.map((id) => (
              <div 
                key={id.name}
                onClick={() => onIdentityClick(id.name)}
                className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all duration-200 border border-transparent hover:border-white/5"
              >
                {/* Avatar Ring */}
                <div className="w-8 h-8 rounded-full p-[1px] bg-gradient-to-tr from-white/20 to-transparent group-hover:from-white/50 transition-all">
                  <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                    {id.thumb ? (
                      <img src={`${apiBase}${id.thumb}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <User size={12} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20" />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white/60 group-hover:text-white truncate transition-colors">{id.name}</div>
                  <div className="text-[8px] text-white/20 group-hover:text-white/40">{id.count || 0} Synapses</div>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteIdentity(id.name); }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg text-white/20 hover:text-red-400 transition-all"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ⚙️ COMPACT FOOTER */}
        <div className="p-4 border-t border-white/5 relative z-10 bg-black/20">
            <div className="flex items-center gap-3 text-white/30">
                <Cpu size={12} />
                <div className="flex flex-col">
                    <span className="text-[8px] font-bold tracking-widest">SYSTEM_HEALTH</span>
                    <span className="text-[8px] text-green-400">OPTIMAL</span>
                </div>
            </div>
        </div>

      </div>
    </div>
  )
}

function NavItem({ icon, label, active, onClick, color }) {
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 border
        ${active 
          ? `bg-white/10 border-white/10 text-white shadow-lg backdrop-blur-md` 
          : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'}
      `}
    >
      {/* Active Indicator Dot */}
      {active && <div className={`w-1.5 h-1.5 rounded-full ${color} shadow-[0_0_8px_currentColor]`} />}
      
      {!active && React.cloneElement(icon, { size: 14, className: "opacity-50" })}
      <span className="font-bold tracking-widest text-[9px]">{label}</span>
    </div>
  )
}