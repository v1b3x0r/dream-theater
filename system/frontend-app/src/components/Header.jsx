import React from 'react'
import { Search } from 'lucide-react'

export default function Header({ query, setQuery, onSearch, selectedCount, onTeach, onWeave, threshold, setThreshold }) {
  return (
    <header className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-30">
      <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-full flex items-center p-1.5 shadow-2xl gap-4 pr-6">
        <div className="flex-1 flex items-center">
          <div className="ml-5 text-white/20"><Search size={18} /></div>
          <input 
            className="bg-transparent border-none outline-none flex-1 px-4 py-3 text-md text-white placeholder:text-white/20" 
            placeholder="Search memories..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            onKeyDown={(e) => e.key === 'Enter' && onSearch(query)} 
          />
        </div>
        
        {/* Tuning Knob */}
        <div className="flex items-center gap-2" title="Sensitivity">
          <div className="w-20 h-1 bg-white/10 rounded-full relative group cursor-pointer">
            <input 
              type="range" min="0.05" max="0.35" step="0.01" 
              value={threshold} 
              onChange={(e) => {
                setThreshold(parseFloat(e.target.value))
                // Debounce search update could be added here
              }}
              onMouseUp={() => onSearch(query)} // Trigger search on release
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
            />
            <div 
              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full pointer-events-none transition-all" 
              style={{ width: `${((threshold - 0.05) / 0.3) * 100}%` }} 
            />
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg pointer-events-none transition-all" 
              style={{ left: `${((threshold - 0.05) / 0.3) * 100}%` }} 
            />
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="flex gap-2 mr-1">
            <button onClick={onTeach} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase border border-white/10 transition-all">🏷️ Teach</button>
            <button onClick={onWeave} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase transition-all">🧵 Weave</button>
          </div>
        )}
      </div>
    </header>
  )
}
