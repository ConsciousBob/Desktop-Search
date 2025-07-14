import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { IndexingService } from './services/IndexingService'
import { FileScanner } from './services/FileScanner'
import { ContentExtractor } from './services/ContentExtractor'

const isDev = process.argv.includes('--dev')

let mainWindow: BrowserWindow
let indexingService: IndexingService
let fileScanner: FileScanner
let contentExtractor: ContentExtractor

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js')
    },
    icon: join(__dirname, '../../assets/icon.png'),
    show: false
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

app.whenReady().then(() => {
  createWindow()
  
  // Initialize services
  indexingService = new IndexingService()
  fileScanner = new FileScanner()
  contentExtractor = new ContentExtractor()
  
  setupIpcHandlers()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

function setupIpcHandlers() {
  // Folder selection - Fixed implementation
  ipcMain.handle('select-folders', async () => {
    try {
      console.log('Folder selection requested')
      
      if (!mainWindow) {
        throw new Error('Main window not available')
      }

      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'multiSelections'],
        title: 'Select folders to index',
        buttonLabel: 'Select Folders'
      })

      console.log('Dialog result:', result)

      if (result.canceled) {
        return []
      }

      return result.filePaths || []
    } catch (error) {
      console.error('Error in select-folders handler:', error)
      throw error
    }
  })

  // Start indexing
  ipcMain.handle('start-indexing', async (_, folders: string[]) => {
    try {
      console.log('Starting indexing for folders:', folders)
      
      const files = await fileScanner.scanFolders(folders)
      console.log(`Found ${files.length} files to index`)
      
      // Send progress updates
      let processed = 0
      const total = files.length
      
      for (const file of files) {
        try {
          const content = await contentExtractor.extractContent(file)
          await indexingService.indexFile(file, content)
          
          processed++
          mainWindow.webContents.send('indexing-progress', {
            processed,
            total,
            currentFile: file.path
          })
        } catch (error) {
          console.error(`Error processing file ${file.path}:`, error)
        }
      }
      
      mainWindow.webContents.send('indexing-complete')
      return { success: true, filesProcessed: processed }
    } catch (error) {
      console.error('Indexing error:', error)
      return { success: false, error: error.message }
    }
  })

  // Search files
  ipcMain.handle('search-files', async (_, query: string, filters?: any) => {
    try {
      return await indexingService.searchFiles(query, filters)
    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  })

  // Get indexing stats
  ipcMain.handle('get-indexing-stats', async () => {
    try {
      return await indexingService.getStats()
    } catch (error) {
      console.error('Stats error:', error)
      throw error
    }
  })

  // Clear index
  ipcMain.handle('clear-index', async () => {
    try {
      return await indexingService.clearIndex()
    } catch (error) {
      console.error('Clear index error:', error)
      throw error
    }
  })
}
