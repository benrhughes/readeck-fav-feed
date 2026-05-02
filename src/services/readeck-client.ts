import axios, { AxiosError } from 'axios';
import { Bookmark } from '../types/bookmark';
import { getConfig } from '../config';

/**
 * Readeck API client for fetching bookmarks
 */
export class ReadeckClient {
  private axiosInstance = axios.create({
    timeout: 10000, // 10 second timeout for API requests
  });

  /**
   * Fetch marked bookmarks from Readeck
   * Returns all bookmarks that are marked as favorites
   */
  async fetchMarkedBookmarks(): Promise<Bookmark[]> {
    const config = getConfig();
    const allBookmarks: Bookmark[] = [];
    const perPage = 100; // Number of bookmarks to fetch per page
    let page = 1;
    let hasMore = true;
    const maxPages = 100; // Safety limit to prevent infinite loops

    while (hasMore && page <= maxPages) {
      try {
        console.log(`[readeck] Fetching page ${page}...`);
        const response = await this.axiosInstance.get(
          `${config.readeckUrl}/bookmarks`,
          {
            params: {
              is_marked: true,
              page: page,
              per_page: perPage,
            },
            headers: {
              Authorization: `Bearer ${config.readeckToken}`,
              'Accept': 'application/json',
            },
          }
        );

        // API returns a direct array of bookmarks per OpenAPI spec
        const bookmarks = response.data;

        if (!Array.isArray(bookmarks)) {
          throw new Error('Expected array response from Readeck API');
        }

        if (bookmarks.length > 0) {
          allBookmarks.push(...this.mapBookmarks(bookmarks));
          page++;
        }

        // Check if this is the last page
        if (bookmarks.length === 0 || bookmarks.length < perPage) {
          hasMore = false;
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          if (axiosError.response?.status === 401) {
            throw new Error('Unauthorized: Invalid READECK_TOKEN');
          }
          if (axiosError.response?.status === 404) {
            throw new Error('Not found: Invalid READECK_URL');
          }
          throw new Error(`Readeck API error: ${axiosError.message}`);
        }
        throw error;
      }
    }

    if (page > maxPages) {
      console.warn(`[readeck] Reached maximum page limit (${maxPages}). May have missed some bookmarks.`);
    }

    return allBookmarks;
  }

  /**
   * Map Readeck API response to our Bookmark interface
   */
  private mapBookmarks(apiBookmarks: any[]): Bookmark[] {
    return apiBookmarks.map((item) => ({
      id: item.id,
      url: item.url,
      title: item.title || 'Untitled',
      description: item.description || undefined,
      updated: item.updated, // ISO 8601 datetime of last update
      site_name: item.site_name || undefined,
      site: item.site || undefined,
    }));
  }
}

// Export singleton instance
export const readeckClient = new ReadeckClient();
