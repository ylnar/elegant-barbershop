export type ImageUsageType = 'hero' | 'content' | 'thumbnail' | 'gallery' | 'avatar' | 'logo';

/** Deteksi URL gambar remote (bukan path lokal). */
export function isRemoteImageUrl(src: string): boolean {
  if (!src) return false;
  return /^https?:\/\//i.test(src);
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

export function ensureStableImageUrl(source: string): string {
  return getDirectImageSource(source);
}