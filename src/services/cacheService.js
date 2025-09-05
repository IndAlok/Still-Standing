// Simple cache service for improving performance
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live
  }

  // Set cache with TTL (time to live in milliseconds)
  set(key, value, ttlMs = 60000) { // Default 1 minute
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  }

  // Get from cache
  get(key) {
    const expiration = this.ttl.get(key);
    if (expiration && Date.now() > expiration) {
      this.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  // Delete from cache
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  // Check if key exists and is valid
  has(key) {
    const expiration = this.ttl.get(key);
    if (expiration && Date.now() > expiration) {
      this.delete(key);
      return false;
    }
    return this.cache.has(key);
  }

  // Invalidate all keys that start with a prefix
  invalidate(prefix) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.delete(key));
  }
}

export default new CacheService();
