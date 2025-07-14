import { promises as fs } from 'fs'
import { join, extname, basename } from 'path'
import { FileInfo, FileType } from '../types/FileTypes'

export class FileScanner {
  private readonly supportedExtensions = {
    [FileType.DOCUMENT]: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf', '.rtf', '.txt', '.html', '.htm'],
    [FileType.IMAGE]: ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.ico', '.webp', '.svg'],
    [FileType.AUDIO]: ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'],
    [FileType.VIDEO]: ['.mp4', '.mov', '.avi', '.mpeg', '.mpg', '.wmv', '.mkv'],
    [FileType.ARCHIVE]: ['.zip', '.rar', '.7z', '.tar', '.gz'],
    [FileType.EBOOK]: ['.mobi', '.epub', '.azw3', '.azw', '.fb2'],
    [FileType.TEXT]: ['.txt', '.md', '.json', '.xml', '.csv', '.log']
  }

  async scanFolders(folders: string[]): Promise<FileInfo[]> {
    const allFiles: FileInfo[] = []
    
    for (const folder of folders) {
      const files = await this.scanFolder(folder)
      allFiles.push(...files)
    }
    
    return allFiles
  }

  private async scanFolder(folderPath: string): Promise<FileInfo[]> {
    const files: FileInfo[] = []
    
    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = join(folderPath, entry.name)
        
        if (entry.isDirectory()) {
          // Skip system and hidden directories
          if (this.shouldSkipDirectory(entry.name)) {
            continue
          }
          
          const subFiles = await this.scanFolder(fullPath)
          files.push(...subFiles)
        } else if (entry.isFile()) {
          const fileInfo = await this.getFileInfo(fullPath)
          if (fileInfo && this.isSupportedFile(fileInfo.extension)) {
            files.push(fileInfo)
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning folder ${folderPath}:`, error)
    }
    
    return files
  }

  private async getFileInfo(filePath: string): Promise<FileInfo | null> {
    try {
      const stats = await fs.stat(filePath)
      const extension = extname(filePath).toLowerCase()
      const name = basename(filePath)
      
      return {
        path: filePath,
        name,
        extension,
        size: stats.size,
        lastModified: stats.mtime,
        type: this.getFileType(extension)
      }
    } catch (error) {
      console.error(`Error getting file info for ${filePath}:`, error)
      return null
    }
  }

  private getFileType(extension: string): FileType {
    for (const [type, extensions] of Object.entries(this.supportedExtensions)) {
      if (extensions.includes(extension)) {
        return type as FileType
      }
    }
    return FileType.OTHER
  }

  private isSupportedFile(extension: string): boolean {
    return Object.values(this.supportedExtensions)
      .flat()
      .includes(extension)
  }

  private shouldSkipDirectory(dirName: string): boolean {
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
    ]
    
    return skipDirs.includes(dirName) || dirName.startsWith('.')
  }
}
