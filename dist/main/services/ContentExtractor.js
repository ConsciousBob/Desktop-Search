"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentExtractor = void 0;
const fs_1 = require("fs");
const pdf = __importStar(require("pdf-parse"));
const mammoth = __importStar(require("mammoth"));
const XLSX = __importStar(require("xlsx"));
const cheerio = __importStar(require("cheerio"));
const FileTypes_1 = require("../types/FileTypes");
class ContentExtractor {
    async extractContent(file) {
        try {
            switch (file.type) {
                case FileTypes_1.FileType.TEXT:
                    return await this.extractTextContent(file.path);
                case FileTypes_1.FileType.DOCUMENT:
                    return await this.extractDocumentContent(file.path, file.extension);
                case FileTypes_1.FileType.IMAGE:
                    return await this.extractImageMetadata(file.path);
                case FileTypes_1.FileType.AUDIO:
                case FileTypes_1.FileType.VIDEO:
                    return await this.extractMediaMetadata(file.path);
                default:
                    return file.name; // Fallback to filename
            }
        }
        catch (error) {
            console.error(`Error extracting content from ${file.path}:`, error);
            return file.name;
        }
    }
    async extractTextContent(filePath) {
        const content = await fs_1.promises.readFile(filePath, 'utf-8');
        return content;
    }
    async extractDocumentContent(filePath, extension) {
        switch (extension) {
            case '.pdf':
                return await this.extractPdfContent(filePath);
            case '.doc':
            case '.docx':
                return await this.extractWordContent(filePath);
            case '.xls':
            case '.xlsx':
                return await this.extractExcelContent(filePath);
            case '.html':
            case '.htm':
                return await this.extractHtmlContent(filePath);
            case '.rtf':
                return await this.extractRtfContent(filePath);
            default:
                return await this.extractTextContent(filePath);
        }
    }
    async extractPdfContent(filePath) {
        try {
            const buffer = await fs_1.promises.readFile(filePath);
            const data = await pdf(buffer);
            return data.text;
        }
        catch (error) {
            console.error(`Error extracting PDF content from ${filePath}:`, error);
            return '';
        }
    }
    async extractWordContent(filePath) {
        try {
            const buffer = await fs_1.promises.readFile(filePath);
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        }
        catch (error) {
            console.error(`Error extracting Word content from ${filePath}:`, error);
            return '';
        }
    }
    async extractExcelContent(filePath) {
        try {
            const workbook = XLSX.readFile(filePath);
            let content = '';
            workbook.SheetNames.forEach(sheetName => {
                const sheet = workbook.Sheets[sheetName];
                const sheetContent = XLSX.utils.sheet_to_txt(sheet);
                content += `Sheet: ${sheetName}\n${sheetContent}\n\n`;
            });
            return content;
        }
        catch (error) {
            console.error(`Error extracting Excel content from ${filePath}:`, error);
            return '';
        }
    }
    async extractHtmlContent(filePath) {
        try {
            const html = await fs_1.promises.readFile(filePath, 'utf-8');
            const $ = cheerio.load(html);
            // Remove script and style elements
            $('script, style').remove();
            // Extract text content
            return $.text().replace(/\s+/g, ' ').trim();
        }
        catch (error) {
            console.error(`Error extracting HTML content from ${filePath}:`, error);
            return '';
        }
    }
    async extractRtfContent(filePath) {
        try {
            // Basic RTF text extraction (simplified)
            const content = await fs_1.promises.readFile(filePath, 'utf-8');
            return content.replace(/\\[a-z]+\d*\s?/g, '').replace(/[{}]/g, '');
        }
        catch (error) {
            console.error(`Error extracting RTF content from ${filePath}:`, error);
            return '';
        }
    }
    async extractImageMetadata(filePath) {
        // For now, return filename and basic info
        // In future phases, we can add EXIF data extraction
        return `Image file: ${filePath}`;
    }
    async extractMediaMetadata(filePath) {
        // For now, return filename and basic info
        // In future phases, we can add media metadata extraction
        return `Media file: ${filePath}`;
    }
}
exports.ContentExtractor = ContentExtractor;
