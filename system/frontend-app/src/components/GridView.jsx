import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Music, Play, Pause, Sparkles } from 'lucide-react'

export default function GridView({ items, selected, onSelect, onPreview, apiBase, currentTrack, isPlaying, onPlay }) {
  const audioItems = useMemo(() => items.filter(i => i.type === 'audio').slice(0, 12), [items])
  const imageItems = useMemo(() => items.filter(i => i.type === 'image'), [items])

  if (items.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-white/5 uppercase font-black tracking-[1em]">Empty Space</div>
  }

  return (
    <div id="gallery-scroll" className="flex-1 overflow-y-auto pt-40 px-12 pb-48 scroll-smooth scrollbar-hide">
      
      {/* 🎼 SONIC VIBES */}
      {audioItems.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6 pl-2">
            <div className="bg-blue-600/20 p-1.5 rounded-lg text-blue-400"><Sparkles size={14} /></div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Sonic Pairings</p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
            {audioItems.map(item => (
              <AudioPill key={item.path} item={item} isActive={currentTrack?.path === item.path} isPlaying={isPlaying} onPlay={() => onPlay(item)} />
            ))}
          </div>
        </div>
      )}

      {/* 📸 THE JUSTIFIED OCEAN (Apple Style) */}
      <div className="flex flex-wrap gap-4 justify-start">
        {imageItems.map((item, idx) => (
          <MemoryCard 
            key={item.path} 
            item={item} 
            index={idx}
            isSelected={selected.has(item.path)} 
            onSelect={onSelect} 
            onPreview={onPreview} 
            apiBase={apiBase} 
          />
        ))}
      </div>
    </div>
  )
}

function AudioPill({ item, isActive, isPlaying, onPlay }) {
  return (
    <div onClick={onPlay} className={`flex items-center gap-4 border px-6 py-3.5 rounded-full min-w-[260px] transition-all cursor-pointer shadow-xl backdrop-blur-3xl ${isActive ? 'bg-blue-600/30 border-blue-500' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.08]'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${isActive ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
        {isActive && isPlaying ? <Pause size={18} fill="currentColor"/> : <Play size={18} fill="currentColor" className="ml-1"/>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-white truncate">{item.metadata?.title || item.display_path.split('/').pop()}</p>
        <p className="text-[9px] font-black opacity-30 uppercase tracking-tighter truncate">{item.metadata?.artist || 'Ambient'}</p>
      </div>
    </div>
  )
}

function MemoryCard({ item, isSelected, onSelect, onPreview, apiBase, index }) {
  // 🛡️ Master URL Sync: Use whatever the backend says is the right URL
  const imgUrl = item.thumb ? `${apiBase}${item.thumb}` : `${apiBase}${item.raw_url}`
  const isHero = item.score > 0.3
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.01 }}
      className={`relative cursor-zoom-in group ${isHero ? 'h-96 flex-grow' : 'h-64 flex-grow'} min-w-[200px]`}
      onClick={() => onPreview(item)}
    >
      <div className={`h-full w-full relative overflow-hidden rounded-[2rem] transition-all duration-700 ${isSelected ? 'ring-2 ring-blue-500 scale-90' : 'border border-white/5 group-hover:border-white/20'}`}>
        <img 
          src={imgUrl} 
          loading="lazy" 
          className="h-full w-full object-cover transition-transform duration-[2s] group-hover:scale-110" 
          style={{ imageOrientation: 'from-image' }} // 🛡️ FORCE BROWSER TO RESPECT EXIF
        />
        <div onClick={(e) => { e.stopPropagation(); onSelect(item.path); }} className={`absolute top-5 right-5 w-8 h-8 rounded-full border border-white/20 backdrop-blur-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-blue-500' : 'opacity-0 group-hover:opacity-100 shadow-lg'}`}>
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      </div>
    </motion.div>
  )
}
