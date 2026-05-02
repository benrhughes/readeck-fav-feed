import { createApp } from './app';
import { getConfig } from './config';

/**
 * Start the Express server
 */
async function main(): Promise<void> {
  try {
    // Load configuration
    const config = getConfig();
    console.log(`[config] Using Readeck URL: ${config.readeckUrl}`);
    console.log(`[config] Cache TTL: ${config.cacheTtlSeconds} seconds`);
    console.log(`[config] Feed title: ${config.feedTitle}`);

    // Create Express app
    const app = createApp();

    // Start server
    app.listen(config.port, () => {
      const now = new Date().toISOString();
      console.log(`[${now}] Server started on http://localhost:${config.port}`);
      console.log(`[${now}] Atom feed available at http://localhost:${config.port}/feed.atom`);
    });
  } catch (error) {
    console.error('[fatal]', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[fatal]', error);
  process.exit(1);
});
