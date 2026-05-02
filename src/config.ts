import { AppConfig } from './types/config';

/**
 * Load and validate application configuration from environment variables
 */
function loadConfig(): AppConfig {
  const readeckToken = process.env.READECK_TOKEN;

  if (!readeckToken) {
    throw new Error('READECK_TOKEN environment variable is required');
  }

  const config: AppConfig = {
    readeckUrl: process.env.READECK_URL || 'http://localhost:8000/api',
    readeckToken,
    port: parseInt(process.env.PORT || '3000', 10),
    cacheTtlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '300', 10),
    feedTitle: process.env.FEED_TITLE || 'My Readeck Favourites',
    feedDescription: process.env.FEED_DESCRIPTION || 'A feed of my bookmarked articles from Readeck',
    feedLink: process.env.FEED_LINK || 'https://readeck.local',
  };

  // Validate port
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('PORT must be a valid port number between 1 and 65535');
  }

  // Validate cache TTL
  if (isNaN(config.cacheTtlSeconds) || config.cacheTtlSeconds < 1) {
    throw new Error('CACHE_TTL_SECONDS must be a positive number');
  }

  return config;
}

// Load config on module import
let config: AppConfig | null = null;

/**
 * Get the application configuration (singleton)
 */
export function getConfig(): AppConfig {
  if (!config) {
    config = loadConfig();
  }
  return config;
}

/**
 * Reset config (useful for testing)
 */
export function resetConfig(): void {
  config = null;
}
