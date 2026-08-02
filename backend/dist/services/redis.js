"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
class MockRedisCache {
    cache = new Map();
    async get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (item.expiry && item.expiry < Date.now()) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, ttlSeconds) {
        const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
        this.cache.set(key, { value, expiry });
    }
    async del(key) {
        this.cache.delete(key);
    }
    async clear() {
        this.cache.clear();
    }
}
exports.cacheService = new MockRedisCache();
