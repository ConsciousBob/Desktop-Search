import { contextBridge, ipcRenderer } from 'electron'

// Define the API interface
interface ElectronAPI {
  selectFolders: () => Promise<string[]>
  startIndexing: (folders: string[]) => Promise<{ success: boolean; filesProcessed?: number; error?: string }>
  searchFiles: (query: string, filters?: any) => Promise<any[]>
  getIndexingStats: () => Promise<any>
  clearIndex: () => Promise<void>
  onIndexingProgress: (callback: (data: any) => void) => void
  onIndexingComplete: (callback: () => void) => void
  removeAllListeners: () => void
}

const electronAPI: ElectronAPI = {
  selectFolders: async () => {
    try {
      console.log('Preload: selectFolders called')
      const result = await ipcRenderer.invoke('select-folders')
      console.log('Preload: selectFolders result:', result)
      return result
    } catch (error) {
      console.error('Preload: selectFolders error:', error)
      throw error
    }
  },
  
  startIndexing: (folders: string[]) => ipcRenderer.invoke('start-indexing', folders),
  
  searchFiles: (query: string, filters?: any) => ipcRenderer.invoke('search-files', query, filters),
  
  getIndexingStats: () => ipcRenderer.invoke('get-indexing-stats'),
  
  clearIndex: () => ipcRenderer.invoke('clear-index'),
  
  // Event listeners
  onIndexingProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('indexing-progress', (_, data) => callback(data))
  },
  
  onIndexingComplete: (callback: () => void) => {
    ipcRenderer.on('indexing-complete', callback)
  },
  
  // Cleanup
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('indexing-progress')
    ipcRenderer.removeAllListeners('indexing-complete')
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
