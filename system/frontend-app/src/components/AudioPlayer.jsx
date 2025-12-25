import React, { useRef, useEffect } from 'react'
import { Play, Pause, SkipForward, Music, Volume2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AudioPlayer({ currentTrack, isPlaying, onPlay, apiBase }) {
  const audioRef = useRef(null)

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Autoplay blocked"))
      } else {
        audioRef.current.pause()
      }
    }
  }, [currentTrack, isPlaying])

  if (!currentTrack) return null

  const rawUrl = `${apiBase}/raw/${currentTrack.display_path.split('/').map(encodeURIComponent).join('/')}`

  return (
    <motion.div 
      initial={{ y: 100 }} 
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-[120] bg-black/80 backdrop-blur-3xl border-t border-white/10 h-20 px-8 flex items-center justify-between"
    >
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg animate-pulse-slow">
          <Music size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">{currentTrack.metadata?.title || currentTrack.display_path.split('/').pop()}</p>
          <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">{currentTrack.metadata?.artist || 'Unknown Artist'}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-6 w-1/3">
        <button 
          onClick={() => onPlay(currentTrack)}
          className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          {isPlaying ? <Pause size={18} fill="black" /> : <Play size={18} fill="black" className="ml-0.5" />}
        </button>
      </div>

      {/* Volume / Extra */}
      <div className="flex items-center justify-end gap-4 w-1/3 text-white/30">
        <Volume2 size={16} />
        <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="w-2/3 h-full bg-white/50" />
        </div>
      </div>

      <audio ref={audioRef} src={rawUrl} onEnded={() => onPlay(currentTrack)} />
    </motion.div>
  )
}
