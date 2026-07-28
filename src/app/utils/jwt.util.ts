export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');

    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string, skewMs = 30_000): boolean {
  const payload = decodeJwtPayload(token);
  const exp = payload?.['exp'];

  if (typeof exp !== 'number') {
    return false;
  }

  return exp * 1000 <= Date.now() + skewMs;
}
