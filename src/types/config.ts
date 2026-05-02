/**
 * Application configuration
 */
export interface AppConfig {
  readeckUrl: string;
  readeckToken: string;
  port: number;
  cacheTtlSeconds: number;
  feedTitle: string;
  feedDescription: string;
  feedLink: string;
}
