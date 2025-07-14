import React, { useState, useEffect } from 'react'
import { Header } from './components/Header'
import { IndexingPanel } from './components/IndexingPanel'
import { SearchPanel } from './components/SearchPanel'
import { StatsPanel } from './components/StatsPanel'
import { IndexingStats } from './types'

declare global {
  interface Window {
    electronAPI: {
      selectFolders: () => Promise<string[]>
      startIndexing: (folders: string[]) => Promise<{ success: boolean; filesProcessed?: number; error?: string }>
      searchFiles: (query: string, filters?: any) => Promise<any[]>
      getIndexingStats: () => Promise<IndexingStats>
      clearIndex: () => Promise<void>
      onIndexingProgress: (callback: (data: any) => void) => void
      onIndexingComplete: (callback: () => void) => void
      removeAllListeners: () => void
    }
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<'index' | 'search' | 'stats'>('index')
  const [stats, setStats] = useState<IndexingStats | null>(null)

  useEffect(() => {
    // Check if electronAPI is available
    if (window.electronAPI) {
      loadStats()
    } else {
      console.error('Electron API not available')
    }
    
    // Cleanup listeners on unmount
    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners()
      }
    }
  }, [])

  const loadStats = async () => {
    try {
      if (!window.electronAPI) {
        console.error('Electron API not available for stats')
        return
      }
      
      const statsData = await window.electronAPI.getIndexingStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleIndexingComplete = () => {
    loadStats()
  }

  // Show loading if electronAPI is not available yet
  if (!window.electronAPI) {
    return (
      <div className="app">
        <div className="loading-message">
          <p>Loading application...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="main-content">
        {activeTab === 'index' && (
          <IndexingPanel onIndexingComplete={handleIndexingComplete} />
        )}
        
        {activeTab === 'search' && (
          <SearchPanel />
        )}
        
        {activeTab === 'stats' && (
          <StatsPanel stats={stats} onRefresh={loadStats} />
        )}
      </main>
    </div>
  )
}

export default App
