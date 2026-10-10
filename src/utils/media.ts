/**
 * Resolves media URLs: converts direct S3 bucket URLs to the backend streaming proxy
 * so that private bucket assets load seamlessly without 403 errors.
 */
export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (url.includes('amazonaws.com') && url.includes('huma-collection-products-2026')) {
    const match = url.match(/amazonaws\.com\/(.+)$/);
    if (match) {
      const apiBase = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api/v1';
      return `${apiBase.replace(/\/$/, '')}/media/file/${match[1]}`;
    }
  }
  return url;
}
