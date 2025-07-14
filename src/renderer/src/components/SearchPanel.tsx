import React, { useState, useEffect } from 'react'
import { Search, FileText, Image, Music, Video, Archive, Book, Filter } from 'lucide-react'
import { SearchResult } from '../types'

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

export function SearchPanel() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim()) {
        performSearch()
      } else {
        setResults([])
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  const performSearch = async () => {
    setIsSearching(true)
    try {
      const searchResults = await window.electronAPI.searchFiles(query)
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 B'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const highlightMatches = (text: string, matches: any[]): React.ReactNode => {
    if (!matches || matches.length === 0) return text

    const contentMatch = matches.find(m => m.field === 'content')
    if (!contentMatch || !contentMatch.indices) return text

    // Simple highlighting - in a real app, you'd want more sophisticated highlighting
    let highlightedText = text
    contentMatch.indices.forEach(([start, end]: [number, number]) => {
      const before = text.substring(0, start)
      const match = text.substring(start, end + 1)
      const after = text.substring(end + 1)
      highlightedText = before + `<mark>${match}</mark>` + after
    })

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />
  }

  return (
    <div className="search-panel">
      <div className="search-header">
        <div className="search-input-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Search files and content..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isSearching && <div className="search-spinner" />}
        </div>
      </div>

      <div className="search-content">
        <div className="search-results">
          {results.length > 0 && (
            <div className="results-header">
              <span>{results.length} results found</span>
            </div>
          )}

          <div className="results-list">
            {results.map((result, index) => {
              const IconComponent = fileTypeIcons[result.file.type as keyof typeof fileTypeIcons] || FileText
              
              return (
                <div
                  key={result.file.id}
                  className={`result-item ${selectedResult?.file.id === result.file.id ? 'selected' : ''}`}
                  onClick={() => setSelectedResult(result)}
                >
                  <div className="result-icon">
                    <IconComponent size={20} />
                  </div>
                  
                  <div className="result-content">
                    <div className="result-title">{result.file.name}</div>
                    <div className="result-path">{result.file.path}</div>
                    <div className="result-meta">
                      <span>{formatFileSize(result.file.size)}</span>
                      <span>•</span>
                      <span>{result.file.type}</span>
                      <span>•</span>
                      <span>Score: {Math.round((1 - result.score) * 100)}%</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {selectedResult && (
          <div className="result-preview">
            <div className="preview-header">
              <h3>{selectedResult.file.name}</h3>
              <button
                className="open-file-btn"
                onClick={() => {
                  // In a real app, you'd implement file opening
                  console.log('Opening file:', selectedResult.file.path)
                }}
              >
                Open File
              </button>
            </div>
            
            <div className="preview-content">
              <div className="file-details">
                <div className="detail-row">
                  <span className="detail-label">Path:</span>
                  <span className="detail-value">{selectedResult.file.path}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Size:</span>
                  <span className="detail-value">{formatFileSize(selectedResult.file.size)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Type:</span>
                  <span className="detail-value">{selectedResult.file.type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Modified:</span>
                  <span className="detail-value">
                    {new Date(selectedResult.file.lastModified).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="content-preview">
                <h4>Content Preview</h4>
                <div className="content-text">
                  {highlightMatches(
                    selectedResult.file.content.substring(0, 1000) + 
                    (selectedResult.file.content.length > 1000 ? '...' : ''),
                    selectedResult.matches
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
