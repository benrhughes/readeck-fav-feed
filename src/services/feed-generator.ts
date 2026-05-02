import { Feed } from 'feed';
import { Bookmark } from '../types/bookmark';
import { getConfig } from '../config';

/**
 * Generate Atom feed from bookmarks
 */
export class FeedGenerator {
  /**
   * Generate an Atom feed from a list of bookmarks
   */
  generateAtomFeed(bookmarks: Bookmark[]): string {
    const config = getConfig();

    const feed = new Feed({
      title: config.feedTitle,
      description: config.feedDescription,
      id: config.feedLink,
      link: config.feedLink,
      language: 'en',
      generator: 'Readeck Favorites Feed Generator',
      copyright: `© ${new Date().getFullYear()}`,
    });

    // Add bookmarks as feed items
    // Sort by update date, newest first
    const sortedBookmarks = [...bookmarks].sort((a, b) => {
      return new Date(b.updated).getTime() - new Date(a.updated).getTime();
    });

    for (const bookmark of sortedBookmarks) {
      feed.addItem({
        id: bookmark.id,
        title: bookmark.title,
        link: bookmark.url,
        // Published date is when the bookmark was last updated
        date: new Date(bookmark.updated),
        description: `<p>${bookmark.description || ''}</p><p><a href="${bookmark.url}" target="_blank">Read more</a></p>`, // Empty if not available
        author: bookmark.site_name ? [{ name: bookmark.site_name }] : undefined,
      });
    }

    // Return as Atom XML
    return feed.atom1();
  }

  /**
   * Generate an error feed item (for when fetching fails)
   */
  generateErrorFeed(error: Error): string {
    const config = getConfig();

    const feed = new Feed({
      title: config.feedTitle,
      description: config.feedDescription,
      id: config.feedLink,
      link: config.feedLink,
      language: 'en',
      generator: 'Readeck Favorites Feed Generator',
      copyright: `© ${new Date().getFullYear()}`,
    });

    feed.addItem({
      id: 'error',
      title: 'Error Fetching Feed',
      link: config.feedLink,
      date: new Date(),
      description: `Failed to fetch bookmarks: ${error.message}`,
    });

    return feed.atom1();
  }
}

// Export singleton instance
export const feedGenerator = new FeedGenerator();
