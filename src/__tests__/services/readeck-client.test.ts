import nock from 'nock';
import { ReadeckClient } from '../../services/readeck-client';
import { resetConfig } from '../../config';

describe('ReadeckClient', () => {
  let client: ReadeckClient;

  beforeEach(() => {
    resetConfig();
    process.env.READECK_TOKEN = 'test-token';
    process.env.READECK_URL = 'http://localhost:8000/api';
    client = new ReadeckClient();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
    resetConfig();
  });

  describe('fetchMarkedBookmarks', () => {
    it('should fetch marked bookmarks', async () => {
      const mockBookmarks = [
        {
          id: '1',
          url: 'https://example.com/article1',
          title: 'Article 1',
          updated: '2024-01-15T10:00:00Z',
          description: 'A great article',
          site_name: 'Example Site',
        },
        {
          id: '2',
          url: 'https://example.com/article2',
          title: 'Article 2',
          updated: '2024-01-10T14:30:00Z',
        },
      ];

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(200, mockBookmarks);

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=2&per_page=100')
        .reply(200, []);

      const bookmarks = await client.fetchMarkedBookmarks();

      expect(bookmarks).toHaveLength(2);
      expect(bookmarks[0].id).toBe('1');
      expect(bookmarks[0].url).toBe('https://example.com/article1');
      expect(bookmarks[0].title).toBe('Article 1');
      expect(bookmarks[0].updated).toBe('2024-01-15T10:00:00Z');
      expect(bookmarks[1].id).toBe('2');
    });

    it('should handle empty bookmark list', async () => {
      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(200, []);

      const bookmarks = await client.fetchMarkedBookmarks();

      expect(bookmarks).toHaveLength(0);
    });

    it('should handle pagination', async () => {
      const page1Bookmarks = Array.from({ length: 100 }, (_, i) => ({
        id: String(i + 1),
        url: `https://example.com/article${i + 1}`,
        title: `Article ${i + 1}`,
        updated: '2024-01-15T10:00:00Z',
      }));

      const page2Bookmarks = Array.from({ length: 50 }, (_, i) => ({
        id: String(i + 101),
        url: `https://example.com/article${i + 101}`,
        title: `Article ${i + 101}`,
        updated: '2024-01-15T10:00:00Z',
      }));

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(200, page1Bookmarks);

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=2&per_page=100')
        .reply(200, page2Bookmarks);

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=3&per_page=100')
        .reply(200, []);

      const bookmarks = await client.fetchMarkedBookmarks();

      expect(bookmarks).toHaveLength(150);
      expect(bookmarks[0].id).toBe('1');
      expect(bookmarks[149].id).toBe('150');
    });

    it('should map bookmarks correctly', async () => {
      const mockBookmark = {
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test Title',
        updated: '2024-01-15T10:00:00Z',
        description: 'Test description',
        site_name: 'Example',
        site: 'example.com',
      };

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(200, [mockBookmark]);

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=2&per_page=100')
        .reply(200, []);

      const bookmarks = await client.fetchMarkedBookmarks();

      expect(bookmarks[0]).toEqual({
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test Title',
        updated: '2024-01-15T10:00:00Z',
        description: 'Test description',
        site_name: 'Example',
        site: 'example.com',
      });
    });

    it('should use undefined for missing optional fields', async () => {
      const mockBookmark = {
        id: 'test-id',
        url: 'https://example.com',
        title: 'Test Title',
        updated: '2024-01-15T10:00:00Z',
      };

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(200, [mockBookmark]);

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=2&per_page=100')
        .reply(200, []);

      const bookmarks = await client.fetchMarkedBookmarks();

      expect(bookmarks[0].description).toBeUndefined();
      expect(bookmarks[0].site_name).toBeUndefined();
      expect(bookmarks[0].site).toBeUndefined();
    });

    it('should throw on 401 Unauthorized', async () => {
      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(401, { error: 'Unauthorized' });

      await expect(client.fetchMarkedBookmarks()).rejects.toThrow(
        'Unauthorized: Invalid READECK_TOKEN'
      );
    });

    it('should throw on 404 Not Found', async () => {
      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(404, { error: 'Not Found' });

      await expect(client.fetchMarkedBookmarks()).rejects.toThrow(
        'Not found: Invalid READECK_URL'
      );
    });

    it('should throw on network error', async () => {
      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .replyWithError('Connection refused');

      await expect(client.fetchMarkedBookmarks()).rejects.toThrow();
    });

    it('should throw if response is not an array', async () => {
      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(200, { error: 'unexpected' });

      await expect(client.fetchMarkedBookmarks()).rejects.toThrow(
        'Expected array response from Readeck API'
      );
    });

    it('should include Bearer token in request', async () => {
      const scope = nock('http://localhost:8000', {
        reqheaders: {
          authorization: 'Bearer test-token',
        },
      })
        .get('/api/bookmarks?is_marked=true&page=1&per_page=100')
        .reply(200, []);

      nock('http://localhost:8000')
        .get('/api/bookmarks?is_marked=true&page=2&per_page=100')
        .reply(200, []);

      await client.fetchMarkedBookmarks();

      expect(scope.isDone()).toBe(true);
    });
  });
});
