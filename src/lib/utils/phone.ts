/**
 * Validates whether a given string is a valid phone number.
 * Accepts international numbers with '+' prefix, or local numbers with digits, spaces, hyphens, and parentheses.
 * Requires total digit count to be between 7 and 15 digits.
 */
export function isValidPhoneNumber(phone?: string | null): boolean {
  if (!phone) return false;
  const trimmed = phone.trim();
  if (!trimmed) return false;

  const validPattern = /^\+?[0-9\s\-()]{7,20}$/;
  if (!validPattern.test(trimmed)) {
    return false;
  }

  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Formats a given phone number string with default '+62' country code prefix.
 * Formats Indonesian numbers into clean groups: +62 XXX-XXXX-XXXX
 */
export function formatPhoneNumber(input?: string | null): string {
  if (input === null || input === undefined) return '+62 ';
  const trimmed = input.trim();
  if (!trimmed) return '+62 ';

  if (trimmed.startsWith('+')) {
    const digits = trimmed.replace(/\D/g, '');
    if (digits.startsWith('62')) {
      const rest = digits.slice(2);
      if (!rest) return '+62 ';
      return formatIndonesianRest(rest);
    }
    const countryDigits = digits.slice(0, 2);
    const rest = digits.slice(2);
    if (!rest) return `+${digits}`;
    return `+${countryDigits} ${rest}`;
  }

  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  } else if (digits.startsWith('62')) {
    digits = digits.slice(2);
  }

  if (!digits) return '+62 ';
  return formatIndonesianRest(digits);
}

function formatIndonesianRest(rest: string): string {
  if (rest.length <= 3) {
    return `+62 ${rest}`;
  } else if (rest.length <= 7) {
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3)}`;
  } else if (rest.length <= 11) {
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
  } else {
    return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7, 12)}`;
  }
}

/**
 * Formats a 6-digit OTP code into clean group format: XXX-XXX (e.g., 123-456).
 * Strips non-digit characters and limits length to 6 digits.
 */
export function formatOtp(input?: string | null): string {
  if (!input) return '';
  const digits = input.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 3) {
    return digits;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

/**
 * Cleans an OTP string by removing all non-numeric characters.
 */
export function cleanOtp(input?: string | null): string {
  if (!input) return '';
  return input.replace(/\D/g, '').slice(0, 6);
}
