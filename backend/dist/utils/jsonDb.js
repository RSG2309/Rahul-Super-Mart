"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonDb = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.join(__dirname, '../../.data');
class JsonDb {
    filePath;
    constructor(collectionName) {
        this.filePath = path_1.default.join(DATA_DIR, `${collectionName}.json`);
        this.ensureDirectoryExistence();
        this.ensureFileExistence();
    }
    ensureDirectoryExistence() {
        if (!fs_1.default.existsSync(DATA_DIR)) {
            fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
        }
    }
    ensureFileExistence() {
        if (!fs_1.default.existsSync(this.filePath)) {
            fs_1.default.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
        }
    }
    getAll() {
        try {
            const content = fs_1.default.readFileSync(this.filePath, 'utf-8');
            return JSON.parse(content);
        }
        catch (e) {
            return [];
        }
    }
    saveAll(data) {
        fs_1.default.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
    find(predicate) {
        return this.getAll().filter(predicate);
    }
    findOne(predicate) {
        return this.getAll().find(predicate) || null;
    }
    insert(item) {
        const data = this.getAll();
        const id = Math.random().toString(36).substring(2, 11);
        const now = new Date().toISOString();
        const newItem = {
            ...item,
            id,
            createdAt: now,
            updatedAt: now
        };
        data.push(newItem);
        this.saveAll(data);
        return newItem;
    }
    update(id, updates) {
        const data = this.getAll();
        const idx = data.findIndex(item => item.id === id);
        if (idx === -1)
            return null;
        const now = new Date().toISOString();
        data[idx] = {
            ...data[idx],
            ...updates,
            updatedAt: now
        };
        this.saveAll(data);
        return data[idx];
    }
    delete(id) {
        const data = this.getAll();
        const idx = data.findIndex(item => item.id === id);
        if (idx === -1)
            return false;
        data.splice(idx, 1);
        this.saveAll(data);
        return true;
    }
}
exports.JsonDb = JsonDb;
