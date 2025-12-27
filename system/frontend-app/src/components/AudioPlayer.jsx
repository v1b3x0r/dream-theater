import React, { useRef, useEffect, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, Maximize2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AudioPlayer({ currentTrack, isPlaying, onPlay, apiBase }) {
  const audioRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(() => {})
      else audioRef.current.pause()
    }
  }, [isPlaying, currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => setProgress((audio.currentTime / audio.duration) * 100)
    const updateDuration = () => setDuration(audio.duration)
    
    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('loadedmetadata', updateDuration)
    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [currentTrack])

  if (!currentTrack) return null

  const rawUrl = `${apiBase}/raw/${currentTrack.display_path.split('/').map(encodeURIComponent).join('/')}`
  const meta = currentTrack.metadata || {}

  return (
    <div className="fixed bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none">
      <AnimatePresence>
        <motion.div 
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="pointer-events-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 🏝️ DYNAMIC ISLAND CONTAINER */}
          <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full p-2 pr-6 shadow-2xl flex items-center gap-4 relative overflow-hidden group">
            
            {/* Progress Bar (Background) */}
            <div className="absolute bottom-0 left-0 h-[2px] bg-white/20 w-full">
              <div className="h-full bg-white transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
            </div>

            {/* 💿 Album Art (Spinning) */}
            <div className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center relative overflow-hidden ${isPlaying ? 'animate-spin-slow' : ''}`}>
              {currentTrack.thumb ? (
                <img src={`${apiBase}${currentTrack.thumb}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-4 h-4 bg-white/20 rounded-full" />
              )}
              {/* Center hole for vinyl look */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-black rounded-full border border-white/10" />
              </div>
            </div>

            {/* 🎵 Info */}
            <div className="flex flex-col min-w-[120px] max-w-[200px]">
              <span className="text-xs font-bold text-white truncate">{meta.title || currentTrack.display_path.split('/').pop()}</span>
              <span className="text-[9px] font-medium text-white/50 uppercase tracking-wider truncate">{meta.artist || 'Unknown Frequency'}</span>
            </div>

            {/* 🎛️ Controls */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <button className="p-2 text-white/40 hover:text-white transition-colors"><SkipBack size={16} fill="currentColor" /></button>
              
              <button 
                onClick={() => onPlay(currentTrack)}
                className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
              
              <button className="p-2 text-white/40 hover:text-white transition-colors"><SkipForward size={16} fill="currentColor" /></button>
            </div>

            {/* Volume / Expand (Hidden by default, show on hover) */}
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isHovered ? 'auto' : 0, opacity: isHovered ? 1 : 0 }}
              className="overflow-hidden flex items-center gap-1"
            >
              <div className="w-px h-6 bg-white/10 mx-2" />
              <button className="p-2 text-white/40 hover:text-white transition-colors"><Volume2 size={16} /></button>
            </motion.div>

          </div>

          <audio ref={audioRef} src={rawUrl} onEnded={() => onPlay(currentTrack)} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
