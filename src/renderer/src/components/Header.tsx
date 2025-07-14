import React from 'react'
import { Search, Database, BarChart3 } from 'lucide-react'

interface HeaderProps {
  activeTab: 'index' | 'search' | 'stats'
  onTabChange: (tab: 'index' | 'search' | 'stats') => void
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <Database className="logo-icon" />
          <h1>File Search Indexer</h1>
        </div>
        
        <nav className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === 'index' ? 'active' : ''}`}
            onClick={() => onTabChange('index')}
          >
            <Database size={18} />
            Index Files
          </button>
          
          <button
            className={`nav-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => onTabChange('search')}
          >
            <Search size={18} />
            Search
          </button>
          
          <button
            className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => onTabChange('stats')}
          >
            <BarChart3 size={18} />
            Statistics
          </button>
        </nav>
      </div>
    </header>
  )
}
