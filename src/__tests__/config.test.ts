import { getConfig, resetConfig } from '../config';

describe('Config', () => {
  beforeEach(() => {
    resetConfig();
    delete process.env.READECK_TOKEN;
    delete process.env.READECK_URL;
    delete process.env.PORT;
    delete process.env.CACHE_TTL_SECONDS;
    delete process.env.FEED_TITLE;
    delete process.env.FEED_DESCRIPTION;
    delete process.env.FEED_LINK;
  });

  afterEach(() => {
    resetConfig();
  });

  describe('getConfig', () => {
    it('should throw if READECK_TOKEN is not set', () => {
      expect(() => getConfig()).toThrow('READECK_TOKEN environment variable is required');
    });

    it('should use default values when env vars are not set', () => {
      process.env.READECK_TOKEN = 'test-token';

      const config = getConfig();

      expect(config.readeckToken).toBe('test-token');
      expect(config.readeckUrl).toBe('http://localhost:8000/api');
      expect(config.port).toBe(3000);
      expect(config.cacheTtlSeconds).toBe(300);
      expect(config.feedTitle).toBe('My Readeck Favourites');
      expect(config.feedDescription).toBe('A feed of my bookmarked articles from Readeck');
      expect(config.feedLink).toBe('https://readeck.local');
    });

    it('should use custom values from environment variables', () => {
      process.env.READECK_TOKEN = 'custom-token';
      process.env.READECK_URL = 'http://example.com/api';
      process.env.PORT = '8080';
      process.env.CACHE_TTL_SECONDS = '600';
      process.env.FEED_TITLE = 'Custom Feed';
      process.env.FEED_DESCRIPTION = 'Custom Description';
      process.env.FEED_LINK = 'https://example.com';

      const config = getConfig();

      expect(config.readeckToken).toBe('custom-token');
      expect(config.readeckUrl).toBe('http://example.com/api');
      expect(config.port).toBe(8080);
      expect(config.cacheTtlSeconds).toBe(600);
      expect(config.feedTitle).toBe('Custom Feed');
      expect(config.feedDescription).toBe('Custom Description');
      expect(config.feedLink).toBe('https://example.com');
    });

    it('should throw if PORT is invalid', () => {
      process.env.READECK_TOKEN = 'test-token';
      process.env.PORT = 'invalid';

      expect(() => getConfig()).toThrow('PORT must be a valid port number');
    });

    it('should throw if PORT is out of range', () => {
      process.env.READECK_TOKEN = 'test-token';
      process.env.PORT = '99999';

      expect(() => getConfig()).toThrow('PORT must be a valid port number');
    });

    it('should throw if CACHE_TTL_SECONDS is invalid', () => {
      process.env.READECK_TOKEN = 'test-token';
      process.env.CACHE_TTL_SECONDS = 'invalid';

      expect(() => getConfig()).toThrow('CACHE_TTL_SECONDS must be a positive number');
    });

    it('should throw if CACHE_TTL_SECONDS is negative', () => {
      process.env.READECK_TOKEN = 'test-token';
      process.env.CACHE_TTL_SECONDS = '-1';

      expect(() => getConfig()).toThrow('CACHE_TTL_SECONDS must be a positive number');
    });

    it('should return singleton instance', () => {
      process.env.READECK_TOKEN = 'test-token';

      const config1 = getConfig();
      const config2 = getConfig();

      expect(config1).toBe(config2);
    });
  });
});
