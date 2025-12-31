import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Database, Cpu, Layers, X, Activity } from 'lucide-react'

export default function OmniscientDebug({ godObject }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('FOCUS')

  // 🎹 Keyboard Shortcut: Toggle with `~`
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '`' || e.key === '~') {
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isOpen) return null

  const tabs = {
    'FOCUS': godObject.focus,
    'UNIVERSE': godObject.universe,
    'SEARCH': godObject.search,
    'SYSTEM': godObject.system
  }

  return (
    <div className="fixed bottom-0 left-0 w-full h-[400px] z-[9999] flex flex-col font-mono text-xs shadow-2xl">
      
      {/* 🟢 HEADER BAR */}
      <div className="h-8 bg-[#1a1a1a] border-t border-white/10 flex items-center px-4 justify-between select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-green-500 font-bold">
            <Terminal size={14} />
            <span>GOD_MODE_CONSOLE</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <div className="flex gap-1">
            {Object.keys(tabs).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-0.5 rounded-sm transition-colors ${activeTab === tab ? 'bg-green-900/30 text-green-400 border border-green-500/20' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
            <span className="text-gray-600">Press ' ~ ' to close</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white"><X size={14} /></button>
        </div>
      </div>

      {/* ⚫ TERMINAL BODY */}
      <div className="flex-1 bg-[#0d0d0d]/95 backdrop-blur-xl overflow-y-auto p-4 border-t border-white/5">
        <JsonTree data={tabs[activeTab]} />
      </div>
      
    </div>
  )
}

// 🌳 Recursive JSON Viewer (Matrix Style)
function JsonTree({ data, level = 0 }) {
  if (data === null) return <span className="text-gray-500">null</span>
  if (data === undefined) return <span className="text-gray-600">undefined</span>
  
  // Primitive Types
  if (typeof data === 'string') return <span className="text-yellow-300">"{data}"</span>
  if (typeof data === 'number') return <span className="text-blue-400">{data}</span>
  if (typeof data === 'boolean') return <span className="text-purple-400">{data.toString()}</span>

  // Arrays
  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-gray-500">[]</span>
    return (
      <div className="ml-4">
        <span className="text-gray-500">Array({data.length}) [</span>
        {data.slice(0, 50).map((item, i) => ( // Limit visualization to 50 items to prevent lag
          <div key={i} className="my-0.5">
            <span className="text-gray-600 select-none mr-2">{i}:</span>
            <JsonTree data={item} level={level + 1} />
          </div>
        ))}
        {data.length > 50 && <div className="text-gray-500 italic">... {data.length - 50} more items ...</div>}
        <span className="text-gray-500">]</span>
      </div>
    )
  }

  // Objects
  const keys = Object.keys(data)
  if (keys.length === 0) return <span className="text-gray-500">{"{}"}</span>
  
  return (
    <div className="ml-4">
      <span className="text-gray-500">{"{"}</span>
      {keys.map(key => (
        <div key={key} className="flex items-start my-0.5">
          <span className="text-green-400 mr-2 select-none">"{key}":</span>
          <JsonTree data={data[key]} level={level + 1} />
        </div>
      ))}
      <span className="text-gray-500">{"}"}</span>
    </div>
  )
}
