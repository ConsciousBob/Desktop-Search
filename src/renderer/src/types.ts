export interface IndexingStats {
  totalFiles: number
  totalSize: number
  lastIndexed: Date | null
  fileTypes: Record<string, number>
}

export interface SearchResult {
  file: {
    id: number
    path: string
    name: string
    extension: string
    size: number
    lastModified: Date
    type: string
    content: string
    indexedAt: Date
  }
  score: number
  matches: Array<{
    field: string
    value: string
    indices: number[][]
  }>
}

export interface IndexingProgress {
  processed: number
  total: number
  currentFile: string
}
