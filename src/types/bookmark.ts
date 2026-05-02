/**
 * Represents a bookmark from Readeck
 */
export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description?: string;
  updated: string; // ISO 8601 datetime of last update
  site_name?: string;
  site?: string;
}

/**
 * Result from fetching marked bookmarks
 */
export interface BookmarkListResponse {
  bookmarks: Bookmark[];
  page?: number;
  total?: number;
}
