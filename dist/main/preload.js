"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const electronAPI = {
    selectFolders: async () => {
        try {
            console.log('Preload: selectFolders called');
            const result = await electron_1.ipcRenderer.invoke('select-folders');
            console.log('Preload: selectFolders result:', result);
            return result;
        }
        catch (error) {
            console.error('Preload: selectFolders error:', error);
            throw error;
        }
    },
    startIndexing: (folders) => electron_1.ipcRenderer.invoke('start-indexing', folders),
    searchFiles: (query, filters) => electron_1.ipcRenderer.invoke('search-files', query, filters),
    getIndexingStats: () => electron_1.ipcRenderer.invoke('get-indexing-stats'),
    clearIndex: () => electron_1.ipcRenderer.invoke('clear-index'),
    // Event listeners
    onIndexingProgress: (callback) => {
        electron_1.ipcRenderer.on('indexing-progress', (_, data) => callback(data));
    },
    onIndexingComplete: (callback) => {
        electron_1.ipcRenderer.on('indexing-complete', callback);
    },
    // Cleanup
    removeAllListeners: () => {
        electron_1.ipcRenderer.removeAllListeners('indexing-progress');
        electron_1.ipcRenderer.removeAllListeners('indexing-complete');
    }
};
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
