"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileScanner = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const FileTypes_1 = require("../types/FileTypes");
class FileScanner {
    constructor() {
        this.supportedExtensions = {
            [FileTypes_1.FileType.DOCUMENT]: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf', '.rtf', '.txt', '.html', '.htm'],
            [FileTypes_1.FileType.IMAGE]: ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.ico', '.webp', '.svg'],
            [FileTypes_1.FileType.AUDIO]: ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'],
            [FileTypes_1.FileType.VIDEO]: ['.mp4', '.mov', '.avi', '.mpeg', '.mpg', '.wmv', '.mkv'],
            [FileTypes_1.FileType.ARCHIVE]: ['.zip', '.rar', '.7z', '.tar', '.gz'],
            [FileTypes_1.FileType.EBOOK]: ['.mobi', '.epub', '.azw3', '.azw', '.fb2'],
            [FileTypes_1.FileType.TEXT]: ['.txt', '.md', '.json', '.xml', '.csv', '.log']
        };
    }
    async scanFolders(folders) {
        const allFiles = [];
        for (const folder of folders) {
            const files = await this.scanFolder(folder);
            allFiles.push(...files);
        }
        return allFiles;
    }
    async scanFolder(folderPath) {
        const files = [];
        try {
            const entries = await fs_1.promises.readdir(folderPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = (0, path_1.join)(folderPath, entry.name);
                if (entry.isDirectory()) {
                    // Skip system and hidden directories
                    if (this.shouldSkipDirectory(entry.name)) {
                        continue;
                    }
                    const subFiles = await this.scanFolder(fullPath);
                    files.push(...subFiles);
                }
                else if (entry.isFile()) {
                    const fileInfo = await this.getFileInfo(fullPath);
                    if (fileInfo && this.isSupportedFile(fileInfo.extension)) {
                        files.push(fileInfo);
                    }
                }
            }
        }
        catch (error) {
            console.error(`Error scanning folder ${folderPath}:`, error);
        }
        return files;
    }
    async getFileInfo(filePath) {
        try {
            const stats = await fs_1.promises.stat(filePath);
            const extension = (0, path_1.extname)(filePath).toLowerCase();
            const name = (0, path_1.basename)(filePath);
            return {
                path: filePath,
                name,
                extension,
                size: stats.size,
                lastModified: stats.mtime,
                type: this.getFileType(extension)
            };
        }
        catch (error) {
            console.error(`Error getting file info for ${filePath}:`, error);
            return null;
        }
    }
    getFileType(extension) {
        for (const [type, extensions] of Object.entries(this.supportedExtensions)) {
            if (extensions.includes(extension)) {
                return type;
            }
        }
        return FileTypes_1.FileType.OTHER;
    }
    isSupportedFile(extension) {
        return Object.values(this.supportedExtensions)
            .flat()
            .includes(extension);
    }
    shouldSkipDirectory(dirName) {
        const skipDirs = [
            'node_modules',
            '.git',
            '.svn',
            '.hg',
            'System Volume Information',
            '$RECYCLE.BIN',
            'Windows',
            'Program Files',
            'Program Files (x86)',
            'ProgramData',
            'AppData'
        ];
        return skipDirs.includes(dirName) || dirName.startsWith('.');
    }
}
exports.FileScanner = FileScanner;
