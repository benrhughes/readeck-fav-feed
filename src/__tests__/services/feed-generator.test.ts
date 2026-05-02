import { FeedGenerator } from '../../services/feed-generator';
import { Bookmark } from '../../types/bookmark';
import { resetConfig } from '../../config';

describe('FeedGenerator', () => {
  let generator: FeedGenerator;

  beforeEach(() => {
    resetConfig();
    process.env.READECK_TOKEN = 'test-token';
    process.env.FEED_TITLE = 'Test Feed';
    process.env.FEED_DESCRIPTION = 'Test Description';
    process.env.FEED_LINK = 'https://test.local';
    generator = new FeedGenerator();
  });

  afterEach(() => {
    resetConfig();
  });

  describe('generateAtomFeed', () => {
    it('should generate valid Atom feed XML', () => {
      const bookmarks: Bookmark[] = [
        {
          id: '1',
          url: 'https://example.com/article1',
          title: 'Article 1',
          updated: '2024-01-15T10:00:00Z',
          description: 'Description 1',
        },
      ];

      const feed = generator.generateAtomFeed(bookmarks);

      expect(feed).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(feed).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
      expect(feed).toContain('</feed>');
    });

    it('should include feed metadata', () => {
      const bookmarks: Bookmark[] = [];

      const feed = generator.generateAtomFeed(bookmarks);

      expect(feed).toContain('<title>Test Feed</title>');
      expect(feed).toContain('<subtitle>Test Description</subtitle>');
      expect(feed).toContain('<id>https://test.local</id>');
      expect(feed).toMatch(/<link[^>]*href="https:\/\/test\.local"[^>]*\/>/);
    });

    it('should include all bookmark entries', () => {
      const bookmarks: Bookmark[] = [
        {
          id: '1',
          url: 'https://example.com/article1',
          title: 'Article 1',
          updated: '2024-01-15T10:00:00Z',
        },
        {
          id: '2',
          url: 'https://example.com/article2',
          title: 'Article 2',
          updated: '2024-01-10T14:30:00Z',
        },
      ];

      const feed = generator.generateAtomFeed(bookmarks);

      expect(feed).toContain('<entry>');
      expect(feed).toContain('Article 1');
      expect(feed).toContain('Article 2');
      expect(feed).toContain('https://example.com/article1');
      expect(feed).toContain('https://example.com/article2');
    });

    it('should use bookmark updated date as published date', () => {
      const bookmarks: Bookmark[] = [
        {
          id: '1',
          url: 'https://example.com/article',
          title: 'Article',
          updated: '2024-01-15T10:00:00Z',
        },
      ];

      const feed = generator.generateAtomFeed(bookmarks);

      // The date should be in the feed entry
      expect(feed).toContain('2024-01-15T10:00:00');
    });

    it('should sort bookmarks by updated date (newest first)', () => {
      const bookmarks: Bookmark[] = [
        {
          id: '1',
          url: 'https://example.com/article1',
          title: 'Article 1',
          updated: '2024-01-10T10:00:00Z',
        },
        {
          id: '2',
          url: 'https://example.com/article2',
          title: 'Article 2',
          updated: '2024-01-20T10:00:00Z',
        },
        {
          id: '3',
          url: 'https://example.com/article3',
          title: 'Article 3',
          updated: '2024-01-15T10:00:00Z',
        },
      ];

      const feed = generator.generateAtomFeed(bookmarks);

      // Check that entries appear in order (newest first)
      const article2Index = feed.indexOf('Article 2');
      const article3Index = feed.indexOf('Article 3');
      const article1Index = feed.indexOf('Article 1');

      expect(article2Index).toBeGreaterThan(0);
      expect(article2Index).toBeLessThan(article3Index);
      expect(article3Index).toBeLessThan(article1Index);
    });

    it('should include entry id', () => {
      const bookmarks: Bookmark[] = [
        {
          id: 'unique-id-123',
          url: 'https://example.com/article',
          title: 'Article',
          updated: '2024-01-15T10:00:00Z',
        },
      ];

      const feed = generator.generateAtomFeed(bookmarks);

      expect(feed).toContain('<id>unique-id-123</id>');
    });

    it('should include entry links pointing to source URL', () => {
      const bookmarks: Bookmark[] = [
        {
          id: '1',
          url: 'https://example.com/article',
          title: 'Article',
          updated: '2024-01-15T10:00:00Z',
        },
      ];

      const feed = generator.generateAtomFeed(bookmarks);

      expect(feed).toContain('<link href="https://example.com/article"');
    });

    it('should include author from site_name if available', () => {
      const bookmarks: Bookmark[] = [
        {
          id: '1',
          url: 'https://example.com/article',
          title: 'Article',
          updated: '2024-01-15T10:00:00Z',
          site_name: 'Example Site',
        },
      ];

      const feed = generator.generateAtomFeed(bookmarks);

      expect(feed).toContain('<author>');
      expect(feed).toContain('Example Site');
      expect(feed).toContain('</author>');
    });

    it('should include description when available', () => {
      const bookmarks: Bookmark[] = [
        {
          id: '1',
          url: 'https://example.com/article',
          title: 'Article',
          updated: '2024-01-15T10:00:00Z',
          description: 'This is a summary of the article',
        },
      ];

      const feed = generator.generateAtomFeed(bookmarks);

      expect(feed).toContain('This is a summary of the article');
    });

    it('should handle empty description', () => {
      const bookmarks: Bookmark[] = [
        {
          id: '1',
          url: 'https://example.com/article',
          title: 'Article',
          updated: '2024-01-15T10:00:00Z',
        },
      ];

      const feed = generator.generateAtomFeed(bookmarks);

      // Should generate valid feed without error
      expect(feed).toContain('<entry>');
      expect(feed).toContain('</entry>');
    });

    it('should handle empty bookmark list', () => {
      const bookmarks: Bookmark[] = [];

      const feed = generator.generateAtomFeed(bookmarks);

      expect(feed).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
      expect(feed).toContain('</feed>');
      // No entries, but still valid feed
    });

    it('should include generator attribution', () => {
      const bookmarks: Bookmark[] = [];

      const feed = generator.generateAtomFeed(bookmarks);

      expect(feed).toContain('Readeck Favorites Feed Generator');
    });
  });

  describe('generateErrorFeed', () => {
    it('should generate error feed', () => {
      const error = new Error('API connection failed');

      const feed = generator.generateErrorFeed(error);

      expect(feed).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(feed).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
      expect(feed).toContain('Error Fetching Feed');
      expect(feed).toContain('API connection failed');
    });

    it('should include error message in description', () => {
      const error = new Error('Specific error message');

      const feed = generator.generateErrorFeed(error);

      expect(feed).toContain('Specific error message');
    });

    it('should include error entry', () => {
      const error = new Error('Test error');

      const feed = generator.generateErrorFeed(error);

      expect(feed).toContain('<entry>');
      expect(feed).toContain('</entry>');
      expect(feed).toContain('<id>error</id>');
    });
  });
});
