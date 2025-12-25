import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Info, X, Clock, Layers, Camera, Maximize2, Palette, ChevronDown, ChevronUp } from 'lucide-react'

export default function Inspector({ previewItem, onClose, apiBase }) {
  const [colors, setColors] = useState([])
  const [showExif, setShowExif] = useState(false)
  const imgRef = useRef(null)
  
  const imgUrl = `${apiBase}/raw/${previewItem.display_path.split('/').map(encodeURIComponent).join('/')}`

  // --- Color Palette Extraction ---
  useEffect(() => {
    const extractColors = () => {
      if (!imgRef.current) return
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = imgRef.current
      
      canvas.width = 100; canvas.height = 100
      ctx.drawImage(img, 0, 0, 100, 100)
      
      const data = ctx.getImageData(0, 0, 100, 100).data
      const counts = {}
      for (let i = 0; i < data.length; i += 40) { // Sample points
        const rgb = `rgb(${data[i]}, ${data[i+1]}, ${data[i+2]})`
        counts[rgb] = (counts[rgb] || 0) + 1
      }
      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(c => c[0])
      setColors(sorted)
    }
    
    if (imgRef.current?.complete) extractColors()
  }, [previewItem])

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
      className="fixed inset-0 z-[100] bg-black/95 flex backdrop-blur-3xl"
    >
      {/* 🖼️ Main Preview Area */}
      <div className="flex-1 flex flex-col p-12 relative overflow-hidden" onClick={onClose}>
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <motion.img 
            ref={imgRef}
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            src={imgUrl} 
            className="max-w-full max-h-[80vh] rounded-[2rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] object-contain transition-all duration-500"
            crossOrigin="anonymous"
          />
        </div>
        
        {/* Bottom Vibe Bar */}
        <div className="mt-8 flex items-center justify-center gap-4">
          {colors.map((c, i) => (
            <motion.div 
              key={i} 
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i*0.1 }}
              className="w-10 h-10 rounded-full border border-white/20 shadow-lg"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      
      {/* 🕵️‍♂️ Inspector Side Panel */}
      <div className="w-[400px] bg-white/[0.02] border-l border-white/10 flex flex-col shadow-2xl">
        <div className="p-8 flex justify-between items-center border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold tracking-tighter flex items-center gap-2 italic">
              <Sparkle size={18} className="text-blue-400" /> Insight
            </h2>
            <p className="text-[9px] text-white/30 uppercase tracking-[0.3em]">Neural Context v3.0</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
          {/* Section: Vibe */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Resonance</p>
              <span className="text-blue-400 font-black text-sm">{(previewItem.score * 100).toFixed(1)}%</span>
            </div>
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/10 p-6 rounded-[2rem] border border-blue-500/20 shadow-lg">
              <p className="text-lg font-bold tracking-tight mb-1 capitalize text-white/90">
                {previewItem.metadata?.exif?.Model ? `Shot on ${previewItem.metadata.exif.Model}` : 'A Captured Echo'}
              </p>
              <p className="text-xs text-blue-300 opacity-70 font-medium">
                {previewItem.metadata?.res} • {previewItem.metadata?.size_kb} KB
              </p>
            </div>
          </section>

          {/* Section: Identities (In This Memory) */}
          {previewItem.tags && previewItem.tags.length > 0 && (
            <section>
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-4">In This Memory</p>
              <div className="flex flex-wrap gap-2">
                {previewItem.tags.map(tag => (
                  <div key={tag} className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] font-bold">{tag[0]}</div>
                    <span className="text-xs font-bold text-white/80">{tag}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section: Temporal Mapping */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={12} className="text-white/20" />
              <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Time Sphere</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-[9px] opacity-30 uppercase font-bold mb-1">Mapped Date</p>
                <p className="text-xs font-semibold">{new Date(previewItem.ts * 1000).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-right">
                <p className="text-[9px] opacity-30 uppercase font-bold mb-1">Confidence</p>
                <p className={`text-xs font-black ${previewItem.conf > 0.5 ? 'text-blue-400' : 'text-orange-400'}`}>{(previewItem.conf * 100).toFixed(0)}%</p>
              </div>
            </div>
          </section>

          {/* Section: EXIF Snapshot (Collapsible) */}
          <section className="border-t border-white/5 pt-8">
            <button 
              onClick={() => setShowExif(!showExif)}
              className="w-full flex items-center justify-between text-white/40 hover:text-white transition-all mb-4"
            >
              <div className="flex items-center gap-2">
                <Camera size={14} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">EXIF Snapshot</p>
              </div>
              {showExif ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            
            <AnimatePresence>
              {showExif && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-black/40 rounded-3xl p-6 font-mono text-[10px] space-y-3 border border-white/5">
                    {previewItem.metadata?.exif && Object.entries(previewItem.metadata.exif).length > 0 ? (
                      Object.entries(previewItem.metadata.exif).map(([k, v]) => (
                        <div key={k} className="flex justify-between border-b border-white/5 pb-2">
                          <span className="opacity-30 truncate pr-4">{k}</span>
                          <span className="text-blue-300 text-right">{v}</span>
                        </div>
                      ))
                    ) : <p className="opacity-20 text-center py-4 italic">No EXIF data found</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
        
        {/* Action Bar */}
        <div className="p-8 border-t border-white/5 bg-black/20">
          <button className="w-full py-4 rounded-2xl bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-transform">
            Add to Memories
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function Sparkle({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364-6.364l-2.121 2.121M8.757 15.243l-2.121 2.121m0-10.607l2.121 2.121m7.071 7.071l2.121 2.121" />
    </svg>
  )
}