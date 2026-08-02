import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../.data');

export class JsonDb<T extends { id: string; createdAt?: string; updatedAt?: string }> {
  private filePath: string;

  constructor(collectionName: string) {
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    this.ensureDirectoryExistence();
    this.ensureFileExistence();
  }

  private ensureDirectoryExistence() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private ensureFileExistence() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  public getAll(): T[] {
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content) as T[];
    } catch (e) {
      return [];
    }
  }

  public saveAll(data: T[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  public find(predicate: (item: T) => boolean): T[] {
    return this.getAll().filter(predicate);
  }

  public findOne(predicate: (item: T) => boolean): T | null {
    return this.getAll().find(predicate) || null;
  }

  public insert(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): T {
    const data = this.getAll();
    const id = Math.random().toString(36).substring(2, 11);
    const now = new Date().toISOString();
    const newItem = {
      ...item,
      id,
      createdAt: now,
      updatedAt: now
    } as unknown as T;
    data.push(newItem);
    this.saveAll(data);
    return newItem;
  }

  public update(id: string, updates: Partial<T>): T | null {
    const data = this.getAll();
    const idx = data.findIndex(item => item.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    data[idx] = {
      ...data[idx],
      ...updates,
      updatedAt: now
    };
    this.saveAll(data);
    return data[idx];
  }

  public delete(id: string): boolean {
    const data = this.getAll();
    const idx = data.findIndex(item => item.id === id);
    if (idx === -1) return false;
    data.splice(idx, 1);
    this.saveAll(data);
    return true;
  }
}
