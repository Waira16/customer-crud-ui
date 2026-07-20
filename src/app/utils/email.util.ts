const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || !email.trim()) {
    return false;
  }

  return EMAIL_PATTERN.test(email.trim());
}

export function getEmailErrorMessage(email: string | null | undefined): string {
  const value = (email || '').trim();

  if (!value) {
    return 'E-posta zorunludur.';
  }

  if (!value.includes('@')) {
    return 'Geçersiz e-posta. @ işareti bulunmalıdır.';
  }

  if (value.startsWith('@') || value.endsWith('@')) {
    return 'Geçersiz e-posta formatı.';
  }

  if (!value.includes('.')) {
    return 'Geçersiz e-posta. Domain uzantısı eksik.';
  }

  return 'Geçersiz e-posta formatı. Örnek: ad@ornek.com';
}
