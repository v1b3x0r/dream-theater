import { useState, useEffect, useRef } from 'react'
import axios from 'axios'

export function useDreamSystem(apiBase) {
  const [stats, setStats] = useState({ 
    total: 0, distribution: {}, identities: 0, 
    wisdom: { level: 0, xp_percent: 0, rank: 'Booting...' } 
  })
  const [identities, setIdentities] = useState([])
  const [discovery, setDiscovery] = useState([])

  const fetchData = async () => {
    try {
      const [s, i, d] = await Promise.all([
        axios.get(`${apiBase}/api/stats`),
        axios.get(`${apiBase}/api/identities`),
        axios.get(`${apiBase}/api/discovery`)
      ])
      setStats(s.data)
      setIdentities(i.data)
      setDiscovery(d.data)
    } catch (e) { }
  }

  useEffect(() => {
    fetchData()
    // Slow down regular metadata polling
    const timer = setInterval(fetchData, 10000) 
    return () => clearInterval(timer)
  }, [])

  return { stats, identities, discovery, refresh: fetchData }
}
