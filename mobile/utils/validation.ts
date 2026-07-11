/** Ghana mobile: 024XXXXXXX, 055XXXXXXX, etc. */
export function isGhanaPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, '');
  return /^0(2[0-9]|5[0-9])\d{7}$/.test(cleaned);
}

export function formatGhanaPhone(phone: string): string {
  const d = phone.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
}

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 6) return 'weak';
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  if (score >= 3) return 'strong';
  if (score >= 2) return 'good';
  return 'fair';
}

export const STRENGTH_META: Record<PasswordStrength, { label: string; color: string; width: string }> = {
  weak: { label: 'Weak', color: '#EF4444', width: '25%' },
  fair: { label: 'Fair', color: '#EAB308', width: '50%' },
  good: { label: 'Good', color: '#3B82F6', width: '75%' },
  strong: { label: 'Strong', color: '#22C55E', width: '100%' },
};
