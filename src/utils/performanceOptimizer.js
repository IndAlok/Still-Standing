/**
 * Performance optimization utilities for CrewConnect
 */

// Debounce utility to prevent excessive function calls
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle utility to limit function execution frequency
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Batch parallel requests utility
export const batchParallelRequests = async (requests, batchSize = 5) => {
  const results = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch);
    results.push(...batchResults);
  }
  
  return results;
};

// Cache with TTL (Time To Live)
export class TTLCache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key, value, ttl = 300000) { // Default 5 minutes
    // Clear existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set value
    this.cache.set(key, value);

    // Set expiration timer
    const timer = setTimeout(() => {
      this.cache.delete(key);
      this.timers.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  get(key) {
    return this.cache.get(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    return this.cache.delete(key);
  }

  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    this.cache.clear();
  }
}

// Global performance cache instance
export const performanceCache = new TTLCache();

// Optimize profile picture sync calls
export const optimizedGoogleSync = throttle(async (userId, storageService, options = {}) => {
  const cacheKey = `google-sync-${userId}-${Date.now()}`;
  
  if (performanceCache.has(cacheKey)) {
    return performanceCache.get(cacheKey);
  }

  try {
    const result = await storageService.syncGoogleProfilePicture(userId, { 
      silent: true, 
      ...options 
    });
    
    // Cache successful results for 10 minutes
    if (result.success) {
      performanceCache.set(cacheKey, result, 600000);
    }
    
    return result;
  } catch (error) {
    console.warn('Optimized Google sync failed:', error);
    return { success: false, error: error.message };
  }
}, 30000); // Throttle to maximum once every 30 seconds

export default {
  debounce,
  throttle,
  batchParallelRequests,
  TTLCache,
  performanceCache,
  optimizedGoogleSync
};
