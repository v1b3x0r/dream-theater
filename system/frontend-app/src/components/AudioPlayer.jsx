import React, { useRef, useEffect, useState } from 'react'
import { Play, Pause, Music, Volume2, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AudioPlayer({ currentTrack, isPlaying, onPlay, apiBase }) {
  const audioRef = useRef(null)
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    if (currentTrack && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play()
          .then(() => setIsBlocked(false))
          .catch(e => {
            console.log("Autoplay blocked by browser policy")
            setIsBlocked(true)
          })
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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] w-full max-w-xl h-20 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] px-8 flex items-center justify-between shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
    >
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/3 min-w-0">
        <div className="w-10 h-10 rounded-2xl bg-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">
          <Music size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{currentTrack.metadata?.title || currentTrack.display_path.split('/').pop()}</p>
          <p className="text-[9px] font-black uppercase text-white/30 tracking-widest truncate">{currentTrack.metadata?.artist || 'Unknown Artist'}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center justify-center gap-1 w-1/3">
        <button 
          onClick={() => onPlay(currentTrack)}
          className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl group"
        >
          {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
        </button>
        {isBlocked && (
          <div className="flex items-center gap-1 text-[8px] text-yellow-400 font-black uppercase tracking-tighter animate-pulse">
            <AlertCircle size={8} /> Click Play to enable audio
          </div>
        )}
      </div>

      {/* Volume (Visual only for now) */}
      <div className="flex items-center justify-end gap-4 w-1/3 text-white/20">
        <Volume2 size={14} />
        <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="w-2/3 h-full bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
        </div>
      </div>

      <audio ref={audioRef} src={rawUrl} onEnded={() => onPlay(currentTrack)} />
    </motion.div>
  )
}