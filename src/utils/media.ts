/**
 * Resolves media URLs: converts direct S3 bucket URLs or localhost media URLs
 * to the active backend streaming proxy so images always load seamlessly.
 */
export function getMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  const apiBase = (import.meta.env.VITE_API_URL as string)?.trim() || 'https://api.humacollection.in/api/v1';
  const cleanBase = apiBase.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

  // If URL points to media streaming proxy, ensure it targets active API host
  if (url.includes('/api/v1/media/file/')) {
    const key = url.split('/api/v1/media/file/')[1];
    return `${cleanBase}/api/v1/media/file/${key}`;
  }

  // If direct private S3 link
  if (url.includes('amazonaws.com') && url.includes('huma-collection-products-2026')) {
    const match = url.match(/amazonaws\.com\/(.+)$/);
    if (match) {
      return `${cleanBase}/api/v1/media/file/${match[1]}`;
    }
  }

  return url;
}
