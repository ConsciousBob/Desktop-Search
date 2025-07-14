"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const IndexingService_1 = require("./services/IndexingService");
const FileScanner_1 = require("./services/FileScanner");
const ContentExtractor_1 = require("./services/ContentExtractor");
const isDev = process.argv.includes('--dev');
let mainWindow;
let indexingService;
let fileScanner;
let contentExtractor;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: (0, path_1.join)(__dirname, 'preload.js')
        },
        icon: (0, path_1.join)(__dirname, '../../assets/icon.png'),
        show: false
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile((0, path_1.join)(__dirname, '../renderer/index.html'));
    }
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    // Initialize services
    indexingService = new IndexingService_1.IndexingService();
    fileScanner = new FileScanner_1.FileScanner();
    contentExtractor = new ContentExtractor_1.ContentExtractor();
    setupIpcHandlers();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
function setupIpcHandlers() {
    // Folder selection - Fixed implementation
    electron_1.ipcMain.handle('select-folders', async () => {
        try {
            console.log('Folder selection requested');
            if (!mainWindow) {
                throw new Error('Main window not available');
            }
            const result = await electron_1.dialog.showOpenDialog(mainWindow, {
                properties: ['openDirectory', 'multiSelections'],
                title: 'Select folders to index',
                buttonLabel: 'Select Folders'
            });
            console.log('Dialog result:', result);
            if (result.canceled) {
                return [];
            }
            return result.filePaths || [];
        }
        catch (error) {
            console.error('Error in select-folders handler:', error);
            throw error;
        }
    });
    // Start indexing
    electron_1.ipcMain.handle('start-indexing', async (_, folders) => {
        try {
            console.log('Starting indexing for folders:', folders);
            const files = await fileScanner.scanFolders(folders);
            console.log(`Found ${files.length} files to index`);
            // Send progress updates
            let processed = 0;
            const total = files.length;
            for (const file of files) {
                try {
                    const content = await contentExtractor.extractContent(file);
                    await indexingService.indexFile(file, content);
                    processed++;
                    mainWindow.webContents.send('indexing-progress', {
                        processed,
                        total,
                        currentFile: file.path
                    });
                }
                catch (error) {
                    console.error(`Error processing file ${file.path}:`, error);
                }
            }
            mainWindow.webContents.send('indexing-complete');
            return { success: true, filesProcessed: processed };
        }
        catch (error) {
            console.error('Indexing error:', error);
            return { success: false, error: error.message };
        }
    });
    // Search files
    electron_1.ipcMain.handle('search-files', async (_, query, filters) => {
        try {
            return await indexingService.searchFiles(query, filters);
        }
        catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    });
    // Get indexing stats
    electron_1.ipcMain.handle('get-indexing-stats', async () => {
        try {
            return await indexingService.getStats();
        }
        catch (error) {
            console.error('Stats error:', error);
            throw error;
        }
    });
    // Clear index
    electron_1.ipcMain.handle('clear-index', async () => {
        try {
            return await indexingService.clearIndex();
        }
        catch (error) {
            console.error('Clear index error:', error);
            throw error;
        }
    });
}
