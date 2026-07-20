const FALLBACK_IMAGES: Record<string, string> = {
  FIBER: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82?auto=format&fit=crop&w=600&q=80',
  MOBILE: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
  STREAMING: 'https://images.unsplash.com/photo-1574267432644-f610fd85f4e6?auto=format&fit=crop&w=600&q=80',
  TV: 'https://images.unsplash.com/photo-1593359673509-e7471c2f2fbf?auto=format&fit=crop&w=600&q=80',
  PHONE: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
  TABLET: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
  HEADPHONE: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  LAPTOP: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
  DESKTOP: 'https://images.unsplash.com/photo-1593640408182-31c70c15c725?auto=format&fit=crop&w=600&q=80',
  WEARABLE: 'https://images.unsplash.com/photo-1434494878577-86c23a06fe09?auto=format&fit=crop&w=600&q=80',
  DEFAULT: 'https://images.unsplash.com/photo-1557821552-051071ad747b?auto=format&fit=crop&w=600&q=80'
};

export function catalogImageUrl(
  imageUrl: string | undefined | null,
  fallbackKey: string
): string {
  if (imageUrl?.trim()) {
    return imageUrl.trim();
  }
  return FALLBACK_IMAGES[fallbackKey] ?? FALLBACK_IMAGES['DEFAULT'];
}

export function onCatalogImageError(
  event: Event,
  fallbackKey: string
): void {
  const img = event.target as HTMLImageElement | null;
  if (!img) {
    return;
  }
  const fallback = FALLBACK_IMAGES[fallbackKey] ?? FALLBACK_IMAGES['DEFAULT'];
  if (img.src !== fallback) {
    img.src = fallback;
  }
}
