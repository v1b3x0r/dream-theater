import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Check, X } from 'lucide-react'
import axios from 'axios'

export default function FacesView({ apiBase, onTeach }) {
  const [clusters, setClusters] = useState([])
  const [loading, setLoading] = useState(true)
  const [inputs, setInputs] = useState({})

  useEffect(() => {
    fetchClusters()
  }, [])

  const fetchClusters = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${apiBase}/api/faces/unidentified`)
      setClusters(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleTag = async (clusterId, name) => {
    const cluster = clusters.find(c => c.id === clusterId)
    if (!cluster || !name) return

    // Optimistic Remove
    setClusters(prev => prev.filter(c => c.id !== clusterId))

    try {
      await axios.post(`${apiBase}/api/identities/cluster/tag`, {
        name: name,
        anchors: cluster.examples
      })
      if(onTeach) onTeach() // Refresh system stats
    } catch (e) {
      alert("Failed to tag cluster")
    }
  }

  return (
    <div className="w-full h-full overflow-y-auto p-8 pt-24 scrollbar-hide">
      
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-2">Hall of Faces</h1>
        <p className="text-xs text-white/40 font-mono">
          {loading ? "Scanning Vector Space..." : `${clusters.length} UNIDENTIFIED CLUSTERS FOUND`}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-white/20 animate-pulse">
            Scanning...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {clusters.map((c) => (
            <motion.div 
              key={c.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all group"
            >
              {/* Cover Image */}
              <div className="aspect-square relative bg-black/50">
                <img 
                  src={`${apiBase}${c.thumb}`} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold text-white border border-white/10">
                    {c.count} PHOTOS
                </div>
              </div>

              {/* Input Area */}
              <div className="p-3 bg-black/20">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Who is this?"
                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500/50"
                        value={inputs[c.id] || ''}
                        onChange={(e) => setInputs({...inputs, [c.id]: e.target.value})}
                        onKeyDown={(e) => e.key === 'Enter' && handleTag(c.id, inputs[c.id])}
                    />
                    <button 
                        onClick={() => handleTag(c.id, inputs[c.id])}
                        disabled={!inputs[c.id]}
                        className="p-1.5 bg-blue-500 rounded-lg text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-blue-400 transition-colors"
                    >
                        <Check size={12} />
                    </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      
      {!loading && clusters.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-white/30">
              <User size={48} className="mb-4 opacity-50" />
              <p className="font-mono text-sm">NO STRANGERS FOUND</p>
          </div>
      )}

    </div>
  )
}
