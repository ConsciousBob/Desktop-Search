import { promises as fs } from 'fs'
import { extname } from 'path'
import * as pdf from 'pdf-parse'
import * as mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import * as cheerio from 'cheerio'
import { FileInfo, FileType } from '../types/FileTypes'

export class ContentExtractor {
  async extractContent(file: FileInfo): Promise<string> {
    try {
      switch (file.type) {
        case FileType.TEXT:
          return await this.extractTextContent(file.path)
        
        case FileType.DOCUMENT:
          return await this.extractDocumentContent(file.path, file.extension)
        
        case FileType.IMAGE:
          return await this.extractImageMetadata(file.path)
        
        case FileType.AUDIO:
        case FileType.VIDEO:
          return await this.extractMediaMetadata(file.path)
        
        default:
          return file.name // Fallback to filename
      }
    } catch (error) {
      console.error(`Error extracting content from ${file.path}:`, error)
      return file.name
    }
  }

  private async extractTextContent(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8')
    return content
  }

  private async extractDocumentContent(filePath: string, extension: string): Promise<string> {
    switch (extension) {
      case '.pdf':
        return await this.extractPdfContent(filePath)
      
      case '.doc':
      case '.docx':
        return await this.extractWordContent(filePath)
      
      case '.xls':
      case '.xlsx':
        return await this.extractExcelContent(filePath)
      
      case '.html':
      case '.htm':
        return await this.extractHtmlContent(filePath)
      
      case '.rtf':
        return await this.extractRtfContent(filePath)
      
      default:
        return await this.extractTextContent(filePath)
    }
  }

  private async extractPdfContent(filePath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filePath)
      const data = await pdf(buffer)
      return data.text
    } catch (error) {
      console.error(`Error extracting PDF content from ${filePath}:`, error)
      return ''
    }
  }

  private async extractWordContent(filePath: string): Promise<string> {
    try {
      const buffer = await fs.readFile(filePath)
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    } catch (error) {
      console.error(`Error extracting Word content from ${filePath}:`, error)
      return ''
    }
  }

  private async extractExcelContent(filePath: string): Promise<string> {
    try {
      const workbook = XLSX.readFile(filePath)
      let content = ''
      
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName]
        const sheetContent = XLSX.utils.sheet_to_txt(sheet)
        content += `Sheet: ${sheetName}\n${sheetContent}\n\n`
      })
      
      return content
    } catch (error) {
      console.error(`Error extracting Excel content from ${filePath}:`, error)
      return ''
    }
  }

  private async extractHtmlContent(filePath: string): Promise<string> {
    try {
      const html = await fs.readFile(filePath, 'utf-8')
      const $ = cheerio.load(html)
      
      // Remove script and style elements
      $('script, style').remove()
      
      // Extract text content
      return $.text().replace(/\s+/g, ' ').trim()
    } catch (error) {
      console.error(`Error extracting HTML content from ${filePath}:`, error)
      return ''
    }
  }

  private async extractRtfContent(filePath: string): Promise<string> {
    try {
      // Basic RTF text extraction (simplified)
      const content = await fs.readFile(filePath, 'utf-8')
      return content.replace(/\\[a-z]+\d*\s?/g, '').replace(/[{}]/g, '')
    } catch (error) {
      console.error(`Error extracting RTF content from ${filePath}:`, error)
      return ''
    }
  }

  private async extractImageMetadata(filePath: string): Promise<string> {
    // For now, return filename and basic info
    // In future phases, we can add EXIF data extraction
    return `Image file: ${filePath}`
  }

  private async extractMediaMetadata(filePath: string): Promise<string> {
    // For now, return filename and basic info
    // In future phases, we can add media metadata extraction
    return `Media file: ${filePath}`
  }
}
