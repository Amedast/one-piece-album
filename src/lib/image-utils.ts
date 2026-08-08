/**
 * Helper to get the proxied image URL using weserv.nl proxy.
 * This bypasses hotlinking restrictions and rate limits by caching images on Cloudflare CDN.
 */
export function getCardImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  }
  return url;
}
