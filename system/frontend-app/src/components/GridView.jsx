import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Music, Disc, Aperture, Hash } from 'lucide-react'

export default function GridView({ items, selected, onSelect, onPreview, apiBase, currentTrack, isPlaying, onPlay, discovery, onSearch }) {
  const [columns, setColumns] = useState(5)
  
  // Responsive Columns
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1600) setColumns(6)
      else if (window.innerWidth > 1200) setColumns(5)
      else if (window.innerWidth > 800) setColumns(4)
      else setColumns(3)
    }
    window.addEventListener('resize', handleResize); handleResize();
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Separate Audio & Visuals
  const audioItems = items.filter(i => i.type === 'audio')
  const visualItems = items.filter(i => i.type !== 'audio')

  return (
    <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
      
      {/* 🎵 SONIC VIBES (Native Horizontal Scroll) */}
      {audioItems.length > 0 && (
        <div className="mb-10 w-full">
          <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2 px-1"><Music size={12}/> Sonic Vibes</h3>
          <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide w-full">
            {audioItems.map((item) => {
              const isActive = currentTrack?.path === item.path
              return (
                <motion.div 
                  key={item.id} layoutId={`audio-${item.id}`}
                  className={`
                    shrink-0 w-64 p-3 rounded-2xl flex items-center gap-4 transition-all border cursor-pointer
                    ${isActive ? 'bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-white border-white/5 hover:bg-white/10 hover:border-white/10'}
                  `}
                  onClick={() => onPlay(item)}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isActive ? 'bg-black text-white' : 'bg-white/10 text-white/50'}`}>
                    {isActive && isPlaying ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor" className="ml-0.5"/>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{item.metadata?.title || item.display_path.split('/').pop()}</p>
                    <p className={`text-[9px] font-medium truncate ${isActive ? 'text-black/50' : 'text-white/30'}`}>{item.metadata?.artist || 'Unknown Artist'}</p>
                  </div>
                  {isActive && isPlaying && (
                    <div className="flex gap-0.5 items-end h-3">
                      {[1,2,3,4].map(i => (
                        <motion.div key={i} animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }} className="w-0.5 bg-black rounded-full" />
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* 🧩 SEMANTIC CLUSTERS (Native Horizontal Scroll) */}
      {discovery && discovery.length > 0 && (
        <div className="mb-12 w-full">
          <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2 px-1"><Aperture size={12}/> Semantic Clusters</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide w-full">
            {discovery.map((cluster) => (
              <motion.div 
                key={cluster.id} whileHover={{ y: -5 }}
                className="shrink-0 w-40 group cursor-pointer"
                onClick={() => onSearch(cluster.label)}
              >
                <div className="aspect-square bg-white/5 rounded-2xl overflow-hidden border border-white/5 relative mb-3 shadow-lg group-hover:shadow-2xl group-hover:border-white/20 transition-all">
                  {cluster.thumb ? (
                    <img src={`${apiBase}${cluster.thumb}`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/20 to-purple-900/20">
                      <Hash size={24} className="text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-xl font-bold text-white">{cluster.count}</span>
                  </div>
                </div>
                <p className="text-xs font-bold text-white/80 truncate px-1 group-hover:text-white transition-colors">{cluster.label}</p>
                <p className="text-[9px] text-white/40 px-1 uppercase tracking-wider">Cluster #{cluster.id}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 🖼️ LIQUID GRID (Masonry-ish via Columns) */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {visualItems.map((item, index) => {
          const isSelected = selected.has(item.path)
          const thumbUrl = item.thumb ? `${apiBase}${item.thumb}` : `${apiBase}/raw/${encodeURIComponent(item.display_path)}`
          
          return (
            <motion.div
              key={item.id} layout
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
              className={`
                aspect-[3/4] relative rounded-2xl overflow-hidden cursor-pointer group
                ${isSelected ? 'ring-2 ring-white scale-95 shadow-2xl' : 'hover:scale-[1.02]'}
              `}
              onClick={() => onSelect(item.path)}
              onDoubleClick={() => onPreview(item)}
            >
              <img 
                src={thumbUrl} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                loading="lazy" 
                onError={(e) => { e.target.src = `${apiBase}/raw/${encodeURIComponent(item.display_path)}`; }} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
                <p className="text-white text-xs font-bold truncate">{item.display_path.split('/').pop()}</p>
                <div className="flex gap-2 mt-1">
                  {item.identities?.slice(0,3).map(id => (
                    <span key={id} className="text-[8px] bg-white/20 backdrop-blur-md px-1.5 py-0.5 rounded text-white/90">{id}</span>
                  ))}
                </div>
              </div>
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-white text-black rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
                  <div className="w-2.5 h-2.5 bg-black rounded-full" />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-white/20">
          <div className="w-16 h-16 rounded-full border-2 border-white/10 flex items-center justify-center mb-4">
            <Disc size={24} className="animate-spin-slow" />
          </div>
          <p className="text-sm font-medium">No memories found in this sector.</p>
        </div>
      )}
    </div>
  )
}