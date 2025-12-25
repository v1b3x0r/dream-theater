import React from 'react'
import { motion } from 'framer-motion'
import { Music, Play, Pause } from 'lucide-react'

export default function GridView({ items, selected, onSelect, onPreview, isStoryMode, apiBase, currentTrack, isPlaying, onPlay }) {
  // Separate Audio & Images
  const audioItems = items.filter(i => i.type === 'audio')
  const imageItems = items.filter(i => i.type === 'image')

  return (
    <div id="gallery-scroll" className="flex-1 overflow-y-auto pt-40 px-12 pb-24 scroll-smooth">
      
      {/* 🎵 Audio Pill Row */}
      {audioItems.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] font-black text-white/30 uppercase mb-3 tracking-widest pl-1">Sonic Vibes</p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {audioItems.map(item => (
              <AudioPill 
                key={item.path} item={item} 
                isActive={currentTrack?.path === item.path} 
                isPlaying={isPlaying} 
                onPlay={() => onPlay(item)} 
              />
            ))}
          </div>
        </div>
      )}

      {/* 📸 Image Grid */}
      <div className={isStoryMode ? 'max-w-3xl mx-auto space-y-32' : 'flex flex-wrap gap-4'}>
        {imageItems.map((item) => (
          <MemoryCard 
            key={item.path} 
            item={item} 
            isStoryMode={isStoryMode} 
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
    <div className={`flex items-center gap-3 border px-4 py-2 rounded-full min-w-[200px] transition-all cursor-pointer group ${isActive ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
         onClick={onPlay}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${isActive ? 'bg-blue-500 text-white' : 'bg-blue-600/20 text-blue-400'}`}>
        {isActive && isPlaying ? <Pause size={12} fill="currentColor"/> : <Play size={12} fill="currentColor" className="ml-0.5"/>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-bold truncate max-w-[120px] ${isActive ? 'text-blue-400' : 'text-white'}`}>{item.metadata?.title || item.display_path.split('/').pop()}</p>
        <p className="text-[9px] font-black uppercase text-white/30 tracking-widest truncate">{item.metadata?.artist || 'Unknown'}</p>
      </div>
    </div>
  )
}

function MemoryCard({ item, isStoryMode, isSelected, onSelect, onPreview, apiBase }) {
  const imgUrl = item.thumb ? `${apiBase}${item.thumb}` : `${apiBase}/raw/${item.display_path.split('/').map(encodeURIComponent).join('/')}`
  return (
    <div className={`relative cursor-zoom-in group ${isStoryMode ? 'w-full' : 'h-64 flex-grow'}`} style={{ contentVisibility: 'auto' }} onClick={() => onPreview(item)}>
      <div className={`h-full w-full relative overflow-hidden rounded-[2rem] transition-all duration-700 ${isSelected ? 'ring-2 ring-blue-500 scale-90 shadow-[0_0_40px_rgba(37,99,235,0.3)]' : 'border border-white/5 group-hover:border-white/20'}`}>
        <img src={imgUrl} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110" />
        
        {item.tags && item.tags.length > 0 && (
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-1">
            {item.tags.map(tag => (
              <span key={tag} className="bg-blue-600/80 backdrop-blur-md text-[8px] font-black uppercase px-2 py-1 rounded-md tracking-widest border border-white/10">{tag}</span>
            ))}
          </div>
        )}

        <div onClick={(e) => { e.stopPropagation(); onSelect(item.path); }} className={`absolute top-5 right-5 w-8 h-8 rounded-full border border-white/20 backdrop-blur-xl flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-blue-500 border-blue-500' : 'opacity-0 group-hover:opacity-100 hover:scale-110'}`}>
          <div className="w-2 h-2 bg-white rounded-full shadow-lg" />
        </div>
      </div>
    </div>
  )
}