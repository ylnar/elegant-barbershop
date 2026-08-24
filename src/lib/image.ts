export type ImageUsageType = 'hero' | 'content' | 'thumbnail' | 'gallery' | 'avatar' | 'logo';

export function isSupabaseStorageUrl(src: string): boolean {
  if (!src) return false;

  return /https?:\/\/[^/]+\.supabase\.co\/storage\/v1\/(object|render)\//i.test(src);
}

export function getDirectImageSource(src: string): string {
  if (!src) return src;

  const candidate = src.trim();
  if (!candidate) return candidate;

  if (candidate.includes('?')) {
    return candidate.split('?')[0];
  }

  return candidate;
}

export function shouldUseNextImage(type: ImageUsageType): boolean {
  return type === 'hero' || type === 'content';
}

export function ensureStableSupabaseImageUrl(source: string): string {
  const directUrl = getDirectImageSource(source);

  if (!isSupabaseStorageUrl(directUrl)) {
    return directUrl;
  }

  return directUrl.replace(/\?.*$/, '');
}
