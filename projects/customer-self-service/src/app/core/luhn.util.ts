export function stripCardDigits(cardNumber: string): string {
  return (cardNumber || '').replace(/\s+/g, '');
}

export function isValidLuhn(cardNumber: string): boolean {
  const digits = stripCardDigits(cardNumber);

  if (!/^\d{13,19}$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let alternate = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits.charAt(i));

    if (alternate) {
      n *= 2;
      if (n > 9) {
        n -= 9;
      }
    }

    sum += n;
    alternate = !alternate;
  }

  return sum % 10 === 0;
}

export function formatCardNumber(value: string): string {
  const digits = stripCardDigits(value).slice(0, 19);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function formatExpiryDate(value: string): string {
  const digits = (value || '').replace(/\D/g, '').slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function isValidExpiryDate(expiryDate: string): boolean {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate)) {
    return false;
  }

  const [month, year] = expiryDate.split('/');
  const expiry = new Date(2000 + Number(year), Number(month), 0, 23, 59, 59);
  const now = new Date();

  return expiry >= now;
}

export function isValidCvv(cvv: string): boolean {
  return /^\d{3,4}$/.test(cvv || '');
}

export const DEMO_PAYMENT_CARD = {
  number: '4242 4242 4242 4242',
  expiry: '12/30',
  cvv: '123'
} as const;
