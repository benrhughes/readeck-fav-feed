import { Cache } from '../../services/cache';

describe('Cache', () => {
  let cache: Cache;

  beforeEach(() => {
    cache = new Cache();
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      cache.set('key1', 'value1', 60);

      const result = cache.get('key1');

      expect(result).toBe('value1');
    });

    it('should return undefined for non-existent keys', () => {
      const result = cache.get('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should store objects', () => {
      const obj = { a: 1, b: 'test' };
      cache.set('obj', obj, 60);

      const result = cache.get('obj');

      expect(result).toEqual(obj);
    });

    it('should store arrays', () => {
      const arr = [1, 2, 3, 'test'];
      cache.set('arr', arr, 60);

      const result = cache.get('arr');

      expect(result).toEqual(arr);
    });
  });

  describe('TTL and expiration', () => {
    it('should expire entries after TTL', async () => {
      cache.set('key1', 'value1', 1); // 1 second TTL

      // Value should exist immediately
      expect(cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // Value should be expired
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should not expire entries before TTL', async () => {
      cache.set('key1', 'value1', 2); // 2 second TTL

      // Wait less than TTL
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Value should still exist
      expect(cache.get('key1')).toBe('value1');
    });

    it('should allow updating a value', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key1', 'value2', 60);

      const result = cache.get('key1');

      expect(result).toBe('value2');
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired keys', () => {
      cache.set('key1', 'value1', 60);

      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired keys', async () => {
      cache.set('key1', 'value1', 1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key2', 'value2', 60);

      cache.clear();

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key2', 'value2', 60);

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });

    it('should clean up expired entries in getStats', async () => {
      cache.set('key1', 'value1', 1);
      cache.set('key2', 'value2', 60);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      const stats = cache.getStats();

      expect(stats.size).toBe(1);
      expect(stats.keys).not.toContain('key1');
      expect(stats.keys).toContain('key2');
    });

    it('should return empty stats for empty cache', () => {
      const stats = cache.getStats();

      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  describe('multiple keys', () => {
    it('should handle multiple unrelated keys', () => {
      cache.set('key1', 'value1', 60);
      cache.set('key2', { data: 'value2' }, 60);
      cache.set('key3', [1, 2, 3], 60);

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toEqual({ data: 'value2' });
      expect(cache.get('key3')).toEqual([1, 2, 3]);
    });

    it('should not affect other keys when one expires', async () => {
      cache.set('key1', 'value1', 1);
      cache.set('key2', 'value2', 60);

      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
    });
  });
});
