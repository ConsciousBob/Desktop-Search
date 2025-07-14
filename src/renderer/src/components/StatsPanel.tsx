import React from 'react'
import { RefreshCw, FileText, Image, Music, Video, Archive, Book, HardDrive } from 'lucide-react'
import { IndexingStats } from '../types'

interface StatsPanelProps {
  stats: IndexingStats | null
  onRefresh: () => void
}

const fileTypeIcons = {
  document: FileText,
  image: Image,
  audio: Music,
  video: Video,
  archive: Archive,
  ebook: Book,
  text: FileText,
  other: FileText
}

export function StatsPanel({ stats, onRefresh }: StatsPanelProps) {
  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString()
  }

  if (!stats) {
    return (
      <div className="stats-panel">
        <div className="stats-header">
          <h2>Statistics</h2>
          <button className="refresh-btn" onClick={onRefresh}>
            <RefreshCw size={18} />
            Refresh
          </button>
        </div>
        <div className="loading">Loading statistics...</div>
      </div>
    )
  }

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <h2>Index Statistics</h2>
        <button className="refresh-btn" onClick={onRefresh}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="stats-content">
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{formatNumber(stats.totalFiles)}</div>
              <div className="stat-label">Total Files</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <HardDrive size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">{formatFileSize(stats.totalSize)}</div>
              <div className="stat-label">Total Size</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <RefreshCw size={24} />
            </div>
            <div className="stat-info">
              <div className="stat-value">
                {stats.lastIndexed 
                  ? new Date(stats.lastIndexed).toLocaleDateString()
                  : 'Never'
                }
              </div>
              <div className="stat-label">Last Indexed</div>
            </div>
          </div>
        </div>

        <div className="file-types-breakdown">
          <h3>File Types</h3>
          <div className="file-types-grid">
            {Object.entries(stats.fileTypes).map(([type, count]) => {
              const IconComponent = fileTypeIcons[type as keyof typeof fileTypeIcons] || FileText
              
              return (
                <div key={type} className="file-type-item">
                  <div className="file-type-icon">
                    <IconComponent size={20} />
                  </div>
                  <div className="file-type-info">
                    <div className="file-type-name">{type}</div>
                    <div className="file-type-count">{formatNumber(count)} files</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
