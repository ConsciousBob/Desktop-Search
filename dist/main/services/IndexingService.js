"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingService = void 0;
const sqlite3_1 = require("sqlite3");
const path_1 = require("path");
const electron_1 = require("electron");
const fuse_js_1 = __importDefault(require("fuse.js"));
class IndexingService {
    constructor() {
        const dbPath = (0, path_1.join)(electron_1.app.getPath('userData'), 'file-index.db');
        this.db = new sqlite3_1.Database(dbPath);
        this.initializeDatabase();
    }
    initializeDatabase() {
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS indexed_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        extension TEXT NOT NULL,
        size INTEGER NOT NULL,
        last_modified DATETIME NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        tags TEXT,
        indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
        this.db.run(createTableQuery, (err) => {
            if (err) {
                console.error('Error creating database table:', err);
            }
            else {
                console.log('Database initialized successfully');
                this.buildSearchIndex();
            }
        });
    }
    async indexFile(file, content) {
        return new Promise((resolve, reject) => {
            const query = `
        INSERT OR REPLACE INTO indexed_files 
        (path, name, extension, size, last_modified, type, content, indexed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
            this.db.run(query, [
                file.path,
                file.name,
                file.extension,
                file.size,
                file.lastModified.toISOString(),
                file.type,
                content
            ], function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async searchFiles(query, filters) {
        if (!query.trim()) {
            return [];
        }
        // First, get all files from database
        const files = await this.getAllFiles();
        // Build search index if not exists
        if (!this.searchIndex) {
            this.buildSearchIndex();
        }
        // Perform fuzzy search
        const fuseOptions = {
            keys: [
                { name: 'name', weight: 0.3 },
                { name: 'content', weight: 0.7 }
            ],
            threshold: 0.4,
            includeScore: true,
            includeMatches: true
        };
        const fuse = new fuse_js_1.default(files, fuseOptions);
        const results = fuse.search(query);
        return results.map(result => ({
            file: result.item,
            score: result.score || 0,
            matches: result.matches?.map(match => ({
                field: match.key || '',
                value: match.value || '',
                indices: match.indices || []
            })) || []
        }));
    }
    async getAllFiles() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM indexed_files ORDER BY indexed_at DESC';
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    const files = rows.map(row => ({
                        id: row.id,
                        path: row.path,
                        name: row.name,
                        extension: row.extension,
                        size: row.size,
                        lastModified: new Date(row.last_modified),
                        type: row.type,
                        content: row.content,
                        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
                        tags: row.tags ? JSON.parse(row.tags) : undefined,
                        indexedAt: new Date(row.indexed_at)
                    }));
                    resolve(files);
                }
            });
        });
    }
    async buildSearchIndex() {
        try {
            const files = await this.getAllFiles();
            const fuseOptions = {
                keys: ['name', 'content'],
                threshold: 0.4
            };
            this.searchIndex = new fuse_js_1.default(files, fuseOptions);
        }
        catch (error) {
            console.error('Error building search index:', error);
        }
    }
    async getStats() {
        return new Promise((resolve, reject) => {
            const queries = [
                'SELECT COUNT(*) as total FROM indexed_files',
                'SELECT SUM(size) as totalSize FROM indexed_files',
                'SELECT MAX(indexed_at) as lastIndexed FROM indexed_files',
                'SELECT type, COUNT(*) as count FROM indexed_files GROUP BY type'
            ];
            Promise.all([
                this.runQuery(queries[0]),
                this.runQuery(queries[1]),
                this.runQuery(queries[2]),
                this.runQuery(queries[3])
            ]).then(([totalResult, sizeResult, lastResult, typesResult]) => {
                const fileTypes = {};
                if (Array.isArray(typesResult)) {
                    typesResult.forEach((row) => {
                        fileTypes[row.type] = row.count;
                    });
                }
                resolve({
                    totalFiles: totalResult[0]?.total || 0,
                    totalSize: sizeResult[0]?.totalSize || 0,
                    lastIndexed: lastResult[0]?.lastIndexed ? new Date(lastResult[0].lastIndexed) : null,
                    fileTypes
                });
            }).catch(reject);
        });
    }
    runQuery(query) {
        return new Promise((resolve, reject) => {
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    async clearIndex() {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM indexed_files', [], (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    this.searchIndex = new fuse_js_1.default([], { keys: ['name', 'content'] });
                    resolve();
                }
            });
        });
    }
}
exports.IndexingService = IndexingService;
