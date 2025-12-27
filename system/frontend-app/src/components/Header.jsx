import React from 'react'
import { Search, Sliders, Zap, X, Sparkles, BookOpen } from 'lucide-react'

export default function Header({ query, setQuery, onSearch, threshold, setThreshold, selectedCount, onTeach, onWeave }) {
  
  return (
    <div className="h-20 flex items-center px-8 relative z-40 shrink-0">
      
      {/* 🔍 FLOATING SEARCH BAR */}
      <div className="flex-1 max-w-2xl relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search size={16} className="text-white/30 group-focus-within:text-white transition-colors" />
        </div>
        <input 
          className="w-full bg-white/5 border border-white/10 rounded-full py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-white/20 outline-none focus:bg-white/10 focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all shadow-lg backdrop-blur-xl"
          placeholder="Search memories, feelings, or time..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
        />
        {query && (
          <button onClick={() => { setQuery(''); onSearch(''); }} className="absolute inset-y-0 right-3 flex items-center text-white/20 hover:text-white transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* 🎛️ RIGHT CONTROLS */}
      <div className="flex items-center gap-3 ml-6">
        
        {/* Story Mode Action */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-in fade-in slide-in-from-bottom-2 duration-300">
            <span className="text-xs font-bold mr-2">{selectedCount} Selected</span>
            <button onClick={onTeach} className="p-1.5 hover:bg-black/10 rounded-full transition-colors"><BookOpen size={14}/></button>
            <div className="w-px h-3 bg-black/10" />
            <button onClick={onWeave} className="p-1.5 hover:bg-black/10 rounded-full transition-colors"><Sparkles size={14}/></button>
          </div>
        )}

        {/* Threshold Slider (Minimal) */}
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/5 rounded-full backdrop-blur-md group hover:bg-white/10 transition-all">
          <Zap size={14} className={`transition-colors ${threshold > 0.25 ? 'text-yellow-400' : 'text-white/20'}`} />
          <input 
            type="range" min="0" max="0.5" step="0.01" 
            value={threshold} onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>

      </div>
    </div>
  )
}