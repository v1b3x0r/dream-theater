import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Box, Search, Globe, Zap, Settings, Layers, 
  Database, User, Disc, X, Plus, Trash2, Command 
} from 'lucide-react'
import axios from 'axios'

export default function Sidebar({ stats, identities, discovery, isGalaxyView, setIsGalaxyView, onIdentityClick, onDeleteIdentity, apiBase }) {
  const [activeTab, setActiveTab] = useState('grid')

  return (
    <div className="w-[280px] h-full flex flex-col bg-black/40 backdrop-blur-2xl border-r border-white/5 relative z-50">
      
      {/* 🟢 HEADER: LOGO & VERSION */}
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            <Box size={18} className="text-black" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight leading-none">DreamOS</h1>
            <p className="text-[10px] font-medium text-white/40 tracking-widest mt-0.5">VERSION 8.0</p>
          </div>
        </div>
      </div>

      {/* 🧭 NAVIGATION */}
      <div className="px-4 space-y-1">
        <NavItem 
          icon={<Globe size={18} />} 
          label="Galaxy Map" 
          active={isGalaxyView} 
          onClick={() => setIsGalaxyView(true)} 
        />
        <NavItem 
          icon={<Layers size={18} />} 
          label="Memory Grid" 
          active={!isGalaxyView} 
          onClick={() => setIsGalaxyView(false)} 
        />
      </div>

      {/* 🧬 IDENTITIES (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide">
        
        {/* Faces Section */}
        <div>
          <div className="flex items-center justify-between px-2 mb-3">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Identities</p>
            <span className="text-[10px] text-white/20">{identities.length}</span>
          </div>
          
          <div className="space-y-1">
            {identities.map((id) => (
              <div 
                key={id.name}
                className="group flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer transition-all duration-200"
                onClick={() => onIdentityClick(id.name)}
              >
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 overflow-hidden relative">
                  {id.thumb ? (
                    <img src={`${apiBase}${id.thumb}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <User size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20" />
                  )}
                </div>
                <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{id.name}</span>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteIdentity(id.name); }}
                  className="ml-auto opacity-0 group-hover:opacity-100 p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-all"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ⚙️ FOOTER */}
      <div className="p-4 border-t border-white/5">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[10px] font-bold text-white/40 uppercase">System Status</p>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-xl font-semibold text-white">{stats.total || 0}</p>
              <p className="text-[9px] text-white/30">Memories</p>
            </div>
            <div>
              <p className="text-xl font-semibold text-white">{stats.wisdom?.level || 1}</p>
              <p className="text-[9px] text-white/30">Level</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group
        ${active ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.15)]' : 'text-white/50 hover:text-white hover:bg-white/5'}
      `}
    >
      {React.cloneElement(icon, { size: 18, className: active ? "text-black" : "text-white/50 group-hover:text-white" })}
      <span className="text-sm font-semibold tracking-wide">{label}</span>
    </div>
  )
}
