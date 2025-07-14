export interface FileInfo {
  path: string
  name: string
  extension: string
  size: number
  lastModified: Date
  type: FileType
}

export interface IndexedFile extends FileInfo {
  id?: number
  content: string
  metadata?: Record<string, any>
  tags?: string[]
  indexedAt: Date
}

export enum FileType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  ARCHIVE = 'archive',
  EBOOK = 'ebook',
  TEXT = 'text',
  OTHER = 'other'
}

export interface SearchResult {
  file: IndexedFile
  score: number
  matches: SearchMatch[]
}

export interface SearchMatch {
  field: string
  value: string
  indices: number[][]
}

export interface IndexingStats {
  totalFiles: number
  totalSize: number
  lastIndexed: Date | null
  fileTypes: Record<FileType, number>
}
