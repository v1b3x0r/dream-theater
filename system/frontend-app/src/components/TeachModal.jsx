import React from 'react'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'

export default function TeachModal({ selectedCount, teachName, setTeachName, onCancel, onConfirm }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-[#111] border border-white/10 p-10 rounded-[3rem] w-full max-w-md shadow-2xl text-center">
        <Users className="mx-auto mb-6 text-blue-400" size={48} />
        <h2 className="text-2xl font-bold mb-2">Identify Concept</h2>
        <p className="text-[10px] text-white/30 mb-10 uppercase tracking-[0.3em]">Teaching with {selectedCount} fragments</p>
        <input 
          autoFocus 
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-xl mb-8 text-center outline-none focus:border-blue-500" 
          placeholder="Name this concept..." 
          value={teachName || ""} 
          onChange={(e) => setTeachName(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && onConfirm()} 
        />
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-white/10 font-bold text-[10px] uppercase">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-[10px] uppercase">Learn</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
