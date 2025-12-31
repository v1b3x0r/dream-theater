import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, SkipBack, SkipForward, Volume2, Mic2 } from 'lucide-react'

export default function AudioPlayer({ currentTrack, isPlaying, onPlay, apiBase }) {
  const audioRef = useRef(null)
  const canvasRef = useRef(null)
  const [progress, setProgress] = useState(0)
  
  // Audio Context for Visualizer
  const contextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)

  useEffect(() => {
    if (isPlaying) audioRef.current?.play()
    else audioRef.current?.pause()
  }, [isPlaying, currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateProgress = () => setProgress((audio.currentTime / audio.duration) * 100)
    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('ended', () => onPlay(currentTrack)) // Toggle off/next

    // --- VISUALIZER SETUP ---
    if (!contextRef.current) {
        // Init Context on first user interaction (browser policy)
        const AudioContext = window.AudioContext || window.webkitAudioContext
        contextRef.current = new AudioContext()
        analyserRef.current = contextRef.current.createAnalyser()
        analyserRef.current.fftSize = 64 // 32 bars
        
        try {
            sourceRef.current = contextRef.current.createMediaElementSource(audio)
            sourceRef.current.connect(analyserRef.current)
            analyserRef.current.connect(contextRef.current.destination)
        } catch(e) { console.log("Audio Graph Error:", e) }
    }

    // --- RENDER LOOP ---
    let animationId
    const renderFrame = () => {
        if (!canvasRef.current || !analyserRef.current) return
        
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        
        analyserRef.current.getByteFrequencyData(dataArray)
        
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        const barWidth = (canvas.width / bufferLength) * 2.5
        let barHeight
        let x = 0
        
        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2 // Scale down height
            
            // Gradient Color
            const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
            gradient.addColorStop(0, '#3b82f6') // Blue
            gradient.addColorStop(1, '#a855f7') // Purple
            
            ctx.fillStyle = gradient
            // Rounded Caps (Fake)
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight)
            
            x += barWidth + 2
        }
        
        animationId = requestAnimationFrame(renderFrame)
    }
    
    if(isPlaying) {
        if (contextRef.current?.state === 'suspended') contextRef.current.resume()
        renderFrame()
    } else {
        cancelAnimationFrame(animationId)
    }

    return () => {
        audio.removeEventListener('timeupdate', updateProgress)
        audio.removeEventListener('ended', () => {})
        cancelAnimationFrame(animationId)
    }
  }, [isPlaying, currentTrack])

  if (!currentTrack) return null

  // 🛡️ Safe Metadata Parsing
  let meta = {}
  try {
    meta = typeof currentTrack.metadata === 'string' ? JSON.parse(currentTrack.metadata) : currentTrack.metadata || {}
  } catch (e) { meta = {} }

  return (
    <motion.div 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      onClick={() => { if(contextRef.current?.state === 'suspended') contextRef.current.resume() }}
      className="fixed bottom-0 left-0 right-0 h-24 bg-[#050505]/90 backdrop-blur-xl border-t border-white/10 z-[100] flex items-center px-8 gap-6"
    >
      <audio ref={audioRef} src={`${apiBase}/raw/${currentTrack.path}`} crossOrigin="anonymous" />

      {/* 🖼️ COVER ART */}
      <div className="w-16 h-16 rounded-lg bg-white/5 overflow-hidden relative group shrink-0">
        <img src={`${apiBase}/thumbs/music_cover.jpg`} className="w-full h-full object-cover opacity-80" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <Mic2 size={20} className="text-white" />
        </div>
      </div>

      {/* 🎵 INFO & CONTROLS */}
      <div className="flex flex-col gap-1 w-64 shrink-0">
        <h3 className="text-sm font-bold text-white truncate">{meta.title || currentTrack.path.split('/').pop()}</h3>
        <p className="text-xs text-white/40 truncate">{meta.artist || "Unknown Artist"}</p>
        
        <div className="flex items-center gap-4 mt-1">
            <button className="text-white/50 hover:text-white"><SkipBack size={16} /></button>
            <button onClick={() => onPlay(currentTrack)} className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform">
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
            </button>
            <button className="text-white/50 hover:text-white"><SkipForward size={16} /></button>
        </div>
      </div>

      {/* 📊 SONIC VISUALIZER (Center Stage) */}
      <div className="flex-1 h-full relative flex flex-col justify-end pb-6 px-4">
         <canvas ref={canvasRef} width={600} height={60} className="w-full h-full opacity-80" />
         
         {/* Progress Bar (Overlay on visualizer) */}
         <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 cursor-pointer hover:h-2 transition-all">
            <motion.div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
         </div>
      </div>

      {/* 🔊 VOLUME */}
      <div className="w-32 flex items-center gap-2 text-white/50 shrink-0">
         <Volume2 size={16} />
         <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full w-2/3 bg-white/50" />
         </div>
      </div>

    </motion.div>
  )
}