import React from 'react'
import { motion } from 'framer-motion'

export default function NeuralHalo({ metrics }) {
  // Default metrics if missing (0.0 - 1.0)
  const coherence = metrics?.coherence || 0.1
  const stability = metrics?.stability || 0.1
  const temporal = metrics?.temporal || 0.1

  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      
      {/* 1. Outer Ring: Coherence (Contextual Fit) */}
      {/* Opacity & Thickness represents how well it fits the context */}
      <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
        <circle 
          cx="50" cy="50" r="48" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth={1 + (coherence * 4)} // Thicker = More Coherent
          className="text-blue-500/20"
          strokeDasharray={`${coherence * 300} 1000`} // Longer segments = More Coherent
          strokeLinecap="round"
        />
      </svg>

      {/* 2. Middle Ring: Stability (Identity Confidence) */}
      {/* Solid line = Stable, Dashed/Jittery = Unstable */}
      <motion.div 
        className="absolute inset-2 border-2 rounded-full border-purple-500/40"
        style={{ 
          borderStyle: stability > 0.8 ? 'solid' : 'dashed',
          borderColor: stability > 0.8 ? 'rgba(168, 85, 247, 0.8)' : 'rgba(168, 85, 247, 0.3)' 
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* 3. Inner Core: Temporal (Time Anchor) */}
      {/* Golden Glow = Strong Temporal Anchor (Core Memory) */}
      <motion.div 
        className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/10 to-orange-500/10 backdrop-blur-sm flex items-center justify-center"
        animate={{ scale: [1, 1.05 + (temporal * 0.1), 1] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <div 
          className={`w-2 h-2 rounded-full ${temporal > 0.8 ? 'bg-amber-400 shadow-[0_0_15px_#fbbf24]' : 'bg-gray-500/30'}`} 
        />
      </motion.div>

      {/* Label */}
      <div className="absolute -bottom-8 text-[9px] font-bold text-gray-400 tracking-widest uppercase text-center w-full">
        Neural State
      </div>

    </div>
  )
}
