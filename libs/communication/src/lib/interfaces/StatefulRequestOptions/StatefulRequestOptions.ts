export interface StatefulRequestOptions{
  baseUrl: string;
  path: string;
  username: string;
  maxRetries?: number;
  retryDelay?: number;
}