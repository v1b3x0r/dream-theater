import { useState, useCallback } from 'react'
import axios from 'axios'

export function useSearchEngine(apiBase, setStatus, setIsStoryMode, setCurrentTrack, setIsPlaying) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [threshold, setThreshold] = useState(0.15)

  const handleSearch = useCallback(async (val, isAuto = false) => {
    const q = (typeof val === 'string') ? val : query
    const cleanQ = q.trim()
    
    if (isAuto && query !== '') return;

    setStatus(cleanQ === '' ? 'Syncing latest scenes...' : `🧠 Recalling: ${cleanQ}...`)
    
    try {
      const res = await axios.get(`${apiBase}/api/search?q=${encodeURIComponent(cleanQ)}&threshold=${threshold}`)
      setItems(res.data)
      setIsStoryMode(false)
      
      const am = res.data.filter(i => i.type === 'audio')
      if (am.length > 0) {
        setCurrentTrack(am[0])
        setIsPlaying(true)
      }
      
      setStatus(cleanQ === '' ? `Restored ${res.data.length} scenes` : `Found ${res.data.length} matches`)
    } catch (err) { 
      setStatus('Recall Failed')
      console.error(err)
    }
  }, [query, threshold, apiBase, setStatus, setIsStoryMode, setCurrentTrack, setIsPlaying])

  return { items, setItems, query, setQuery, threshold, setThreshold, handleSearch }
}
