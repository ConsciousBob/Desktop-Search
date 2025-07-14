import React, { useState } from 'react'
import { FolderOpen, Play, Trash2, AlertCircle } from 'lucide-react'
import { IndexingProgress } from '../types'

interface IndexingPanelProps {
  onIndexingComplete: () => void
}

export function IndexingPanel({ onIndexingComplete }: IndexingPanelProps) {
  const [selectedFolders, setSelectedFolders] = useState<string[]>([])
  const [isIndexing, setIsIndexing] = useState(false)
  const [progress, setProgress] = useState<IndexingProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSelectFolders = async () => {
    try {
      console.log('Requesting folder selection...')
      setError(null)
      
      // Check if electronAPI is available
      if (!window.electronAPI) {
        throw new Error('Electron API not available')
      }

      const folders = await window.electronAPI.selectFolders()
      console.log('Selected folders:', folders)
      
      setSelectedFolders(folders)
      
      if (folders.length === 0) {
        console.log('No folders selected (user cancelled)')
      }
    } catch (err) {
      console.error('Error selecting folders:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to select folders'
      setError(errorMessage)
    }
  }

  const handleStartIndexing = async () => {
    if (selectedFolders.length === 0) {
      setError('Please select at least one folder to index')
      return
    }

    setIsIndexing(true)
    setProgress(null)
    setError(null)

    try {
      // Listen for progress updates
      window.electronAPI.onIndexingProgress((data: IndexingProgress) => {
        setProgress(data)
      })

      // Listen for completion
      window.electronAPI.onIndexingComplete(() => {
        setIsIndexing(false)
        setProgress(null)
        onIndexingComplete()
      })

      const result = await window.electronAPI.startIndexing(selectedFolders)
      if (!result.success) {
        setError(result.error || 'Indexing failed')
        setIsIndexing(false)
      }
    } catch (err) {
      console.error('Error starting indexing:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to start indexing'
      setError(errorMessage)
      setIsIndexing(false)
    }
  }

  const handleClearIndex = async () => {
    if (confirm('Are you sure you want to clear the entire index? This action cannot be undone.')) {
      try {
        await window.electronAPI.clearIndex()
        onIndexingComplete()
        setError(null)
      } catch (err) {
        console.error('Error clearing index:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to clear index'
        setError(errorMessage)
      }
    }
  }

  return (
    <div className="indexing-panel">
      <div className="panel-header">
        <h2>File Indexing</h2>
        <p>Select folders to scan and index their contents for fast searching.</p>
      </div>

      <div className="indexing-content">
        <div className="folder-selection">
          <button 
            className="select-folders-btn" 
            onClick={handleSelectFolders}
            disabled={isIndexing}
          >
            <FolderOpen size={20} />
            Select Folders to Index
          </button>
          
          {selectedFolders.length > 0 && (
            <div className="selected-folders">
              <h3>Selected Folders ({selectedFolders.length})</h3>
              <ul className="folder-list">
                {selectedFolders.map((folder, index) => (
                  <li key={index} className="folder-item">
                    {folder}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="indexing-actions">
          <button
            className="start-indexing-btn"
            onClick={handleStartIndexing}
            disabled={isIndexing || selectedFolders.length === 0}
          >
            <Play size={20} />
            {isIndexing ? 'Indexing...' : 'Start Indexing'}
          </button>

          <button
            className="clear-index-btn"
            onClick={handleClearIndex}
            disabled={isIndexing}
          >
            <Trash2 size={20} />
            Clear Index
          </button>
        </div>

        {progress && (
          <div className="indexing-progress">
            <div className="progress-info">
              <span>Processing: {progress.processed} / {progress.total} files</span>
              <span>{Math.round((progress.processed / progress.total) * 100)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(progress.processed / progress.total) * 100}%` }}
              />
            </div>
            <div className="current-file">
              Current: {progress.currentFile}
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            <AlertCircle size={20} />
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
