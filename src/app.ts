import express, { Request, Response, NextFunction } from 'express';
import { readeckClient } from './services/readeck-client';
import { feedGenerator } from './services/feed-generator';
import { cache } from './services/cache';
import { getConfig } from './config';

export function createApp(): express.Application {
  const app = express();
  const FEED_CACHE_KEY = 'atom-feed';

  // Middleware for logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const now = new Date().toISOString();
    console.log(`[${now}] ${req.method} ${req.path}`);
    next();
  });

  /**
   * GET /feed.atom
   * Returns an Atom feed of marked bookmarks
   * Cached for CACHE_TTL_SECONDS
   */
  app.get('/feed.atom', async (_req: Request, res: Response): Promise<Response | void> => {
    const config = getConfig();

    // Check if we have valid cached feed
    const cachedFeed = cache.get<string>(FEED_CACHE_KEY);
    if (cachedFeed) {
      console.log('[cache hit] Returning cached feed');
      res.set('Content-Type', 'application/atom+xml; charset=utf-8');
      res.set('X-Cache', 'HIT');
      return res.send(cachedFeed);
    }

    // Cache miss or expired - fetch from API
    try {
      console.log('[cache miss] Fetching bookmarks from Readeck');
      const startTime = Date.now();

      // Fetch marked bookmarks from Readeck
      const bookmarks = await readeckClient.fetchMarkedBookmarks();
      const duration = Date.now() - startTime;
      console.log(`[readeck] Fetched ${bookmarks.length} marked bookmarks in ${duration}ms`);

      // Generate Atom feed
      const atomFeed = feedGenerator.generateAtomFeed(bookmarks);

      // Cache the feed
      cache.set(FEED_CACHE_KEY, atomFeed, config.cacheTtlSeconds);
      console.log(`[cache set] Feed cached for ${config.cacheTtlSeconds} seconds`);

      // Return feed
      res.set('Content-Type', 'application/atom+xml; charset=utf-8');
      res.set('X-Cache', 'MISS');
      return res.send(atomFeed);
    } catch (error) {
      console.error('[error]', error);

      // If no cached feed at all, return error feed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorFeed = feedGenerator.generateErrorFeed(
        new Error(errorMessage)
      );

      res.set('Content-Type', 'application/atom+xml; charset=utf-8');
      res.status(500);
      return res.send(errorFeed);
    }
  });

  /**
   * GET /health
   * Health check endpoint for container orchestration
   */
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  /**
   * 404 handler
   */
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.path} not found. Try GET /feed.atom`,
    });
  });

  /**
   * Error handler
   */
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[unhandled error]', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  });

  return app;
}
