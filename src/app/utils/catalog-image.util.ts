const UNSPLASH = 'https://images.unsplash.com/';

const FALLBACK_IMAGES: Record<string, string> = {
  FIBER: '/catalog/fiber-modem.svg',
  MOBILE: `${UNSPLASH}photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80`,
  INTERNET: `${UNSPLASH}photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80`,
  SECURITY: `${UNSPLASH}photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80`,
  STREAMING: `${UNSPLASH}photo-1522869635100-9f4c5e86aa37?auto=format&fit=crop&w=600&q=80`,
  TV: `${UNSPLASH}photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80`,
  PHONE: `${UNSPLASH}photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80`,
  TABLET: `${UNSPLASH}photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80`,
  HEADPHONE: `${UNSPLASH}photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80`,
  LAPTOP: `${UNSPLASH}photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80`,
  DESKTOP: `${UNSPLASH}photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80`,
  WEARABLE: `${UNSPLASH}photo-1692658939471-1ceaaa8b2004?auto=format&fit=crop&w=600&q=80`,
  DEFAULT: `${UNSPLASH}photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80`
};

const NAME_OVERRIDES: Record<string, string> = {
  Exxen: '/catalog/exxen.svg',
  BluTV: '/catalog/blutv.svg',
  'BeIN Connect': '/catalog/bein.svg',
  'iPhone 15 Pro': `${UNSPLASH}photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80`,
  'Samsung Galaxy S24 Ultra': `${UNSPLASH}photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80`,
  'Xiaomi 14 Pro': `${UNSPLASH}photo-1598327108557-0f3087f0c608?auto=format&fit=crop&w=600&q=80`,
  'iPad Pro 12.9': `${UNSPLASH}photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80`,
  'Samsung Galaxy Tab S9': `${UNSPLASH}photo-1625868994283-316fdca88366?auto=format&fit=crop&w=600&q=80`,
  'AirPods Pro 2': `${UNSPLASH}photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=600&q=80`,
  'Sony WH-1000XM5': `${UNSPLASH}photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=600&q=80`,
  'MacBook Air M3': `${UNSPLASH}photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80`,
  'MacBook Pro 14 M3 Pro': `${UNSPLASH}photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80`,
  'ASUS ROG Gaming PC': `${UNSPLASH}photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80`,
  'Lenovo Legion Tower': `${UNSPLASH}photo-1587302912306-cf1ed9c33146?auto=format&fit=crop&w=600&q=80`,
  'Apple Watch Series 9': `${UNSPLASH}photo-1692658939471-1ceaaa8b2004?auto=format&fit=crop&w=600&q=80`,
  Netflix: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
  'Netflix Basic': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
  'Netflix Standard': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
  'Netflix Premium': 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
  'Disney+': 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg',
  'Amazon Prime Video': 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png'
};

export function catalogImageUrl(
  imageUrl: string | undefined | null,
  fallbackKey: string,
  name?: string
): string {
  if (name && NAME_OVERRIDES[name]) {
    return NAME_OVERRIDES[name];
  }

  if (imageUrl?.trim()) {
    const trimmed = imageUrl.trim();

    if (isBrokenLegacyImage(trimmed) && name && NAME_OVERRIDES[name]) {
      return NAME_OVERRIDES[name];
    }

    if (isBrokenLegacyImage(trimmed)) {
      return FALLBACK_IMAGES[fallbackKey] ?? FALLBACK_IMAGES['DEFAULT'];
    }

    if (trimmed.startsWith('/catalog/')) {
      return trimmed;
    }

    return trimmed;
  }

  return FALLBACK_IMAGES[fallbackKey] ?? FALLBACK_IMAGES['DEFAULT'];
}

export function onCatalogImageError(
  event: Event,
  fallbackKey: string,
  name?: string
): void {
  const img = event.target as HTMLImageElement | null;
  if (!img) {
    return;
  }

  if (name && NAME_OVERRIDES[name]) {
    const override = NAME_OVERRIDES[name];
    if (img.src !== absoluteUrl(override)) {
      img.src = override;
      return;
    }
  }

  const fallback = FALLBACK_IMAGES[fallbackKey] ?? FALLBACK_IMAGES['DEFAULT'];
  if (img.src !== fallback) {
    img.src = fallback;
  }
}

function isBrokenLegacyImage(url: string): boolean {
  return url.includes('photo-1527864550417-7fd91fc51a46')
    || url.includes('photo-1546868871-7043774660e3');
}

function absoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }
  return path;
}
