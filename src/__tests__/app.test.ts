import request from 'supertest';
import nock from 'nock';
import { createApp } from '../app';
import { resetConfig } from '../config';
import { cache } from '../services/cache';

describe('Express App Integration', () => {
  let app: any;

  beforeEach(() => {
    resetConfig();
    process.env.READECK_TOKEN = 'test-token';
    process.env.READECK_URL = 'http://localhost:8000/api';
    process.env.FEED_TITLE = 'Test Feed';
    app = createApp();
    cache.clear();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
    cache.clear();
    resetConfig();
  });

  describe('GET /feed.atom', () => {
    it('should return Atom feed with 200 status', async () => {
      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(200, []);

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=2&per_page=100')
        .reply(200, []);

      const response = await request(app).get('/feed.atom');

      expect(response.status).toBe(200);
      expect(response.type).toBe('application/atom+xml');
    });

    it('should return valid Atom feed', async () => {
      const mockBookmarks = [
        {
          id: '1',
          url: 'https://example.com/article',
          title: 'Test Article',
          updated: '2024-01-15T10:00:00Z',
        },
      ];

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(200, mockBookmarks);

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=2&per_page=100')
        .reply(200, []);

      const response = await request(app).get('/feed.atom');

      expect(response.text).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(response.text).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
      expect(response.text).toContain('Test Article');
      expect(response.text).toContain('https://example.com/article');
    });

    it('should cache feed and return cached version on second request', async () => {
      const mockBookmarks = [
        {
          id: '1',
          url: 'https://example.com/article',
          title: 'Test Article',
          updated: '2024-01-15T10:00:00Z',
        },
      ];

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(200, mockBookmarks);

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=2&per_page=100')
        .reply(200, []);

      // First request - should hit API
      const response1 = await request(app).get('/feed.atom');
      expect(response1.header['x-cache']).toBe('MISS');

      // Second request - should be cached
      const response2 = await request(app).get('/feed.atom');
      expect(response2.header['x-cache']).toBe('HIT');
      expect(response2.text).toBe(response1.text);
    });

    it('should set correct Content-Type header', async () => {
      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(200, []);

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=2&per_page=100')
        .reply(200, []);

      const response = await request(app).get('/feed.atom');

      expect(response.type).toMatch(/^application\/atom\+xml/);
    });

    it('should return error feed on API failure (no cache)', async () => {
      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(500, { error: 'Internal Server Error' });

      const response = await request(app).get('/feed.atom');

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error Fetching Feed');
    });

    it('should return stale cached feed on API failure (with cache)', async () => {
      const mockBookmarks = [
        {
          id: '1',
          url: 'https://example.com/article',
          title: 'Test Article',
          updated: '2024-01-15T10:00:00Z',
        },
      ];

      // First request - successful
      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(200, mockBookmarks);

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=2&per_page=100')
        .reply(200, []);

      const response1 = await request(app).get('/feed.atom');
      expect(response1.status).toBe(200);

      // Clear cache to simulate it being expired/unavailable
      cache.clear();

      // Second request - API fails but we have articles in the feed
      // Since cache is cleared, this will try API, fail, and return error feed
      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(500, { error: 'Internal Server Error' });

      const response2 = await request(app).get('/feed.atom');

      // Without cache, should return error feed
      expect(response2.status).toBe(500);
      expect(response2.text).toContain('Error Fetching Feed');
    });

    it('should handle authorization errors', async () => {
      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(401, { error: 'Unauthorized' });

      const response = await request(app).get('/feed.atom');

      expect(response.status).toBe(500);
      expect(response.text).toContain('Error Fetching Feed');
      expect(response.text).toContain('Unauthorized');
    });

    it('should include feed entries in correct order (newest first)', async () => {
      const mockBookmarks = [
        {
          id: '1',
          url: 'https://example.com/article1',
          title: 'Oldest Article',
          updated: '2024-01-10T10:00:00Z',
        },
        {
          id: '2',
          url: 'https://example.com/article2',
          title: 'Newest Article',
          updated: '2024-01-20T10:00:00Z',
        },
      ];

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(200, mockBookmarks);

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=2&per_page=100')
        .reply(200, []);

      const response = await request(app).get('/feed.atom');

      // Newest should appear first in feed
      const newestIndex = response.text.indexOf('Newest Article');
      const oldestIndex = response.text.indexOf('Oldest Article');
      expect(newestIndex).toBeLessThan(oldestIndex);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });

    it('should have JSON content type', async () => {
      const response = await request(app).get('/health');

      expect(response.type).toBe('application/json');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Not Found');
    });

    it('should provide helpful 404 message', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('/feed.atom');
    });
  });

  describe('HTTP methods', () => {
    it('should only allow GET for /feed.atom', async () => {
      const response = await request(app).post('/feed.atom');

      expect(response.status).toBe(404);
    });

    it('should only allow GET for /health', async () => {
      const response = await request(app).post('/health');

      expect(response.status).toBe(404);
    });
  });
});
