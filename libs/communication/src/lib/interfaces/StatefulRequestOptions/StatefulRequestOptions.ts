export interface StatefulRequestOptions{
  baseUrl: string;
  path: string;
  username: string;
  inviteCode: string
  maxRetries?: number;
  retryDelay?: number;
}