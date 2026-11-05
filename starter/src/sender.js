import { domainToASCII } from 'node:url';

// Parses an RFC 5322-style sender such as:
//   billing@vendor.example
//   "Vendor Billing" <billing@vendor.example>
// Returns { displayName, address, domain }. domain is normalized.
export function parseSender(sender) {
  const raw = String(sender ?? '').trim();
  const angle = raw.match(/^(.*)<([^<>]+)>\s*$/);
  const displayName = angle ? angle[1].trim().replace(/^"|"$/g, '').trim() : '';
  const address = (angle ? angle[2] : raw).trim();
  const at = address.lastIndexOf('@');
  const domain = at === -1 ? '' : normalizeDomain(address.slice(at + 1));
  return { displayName, address, domain };
}

// Lowercase, trim, strip a trailing dot, convert to punycode (ASCII).
// Returns '' when the input is not a valid domain name.
export function normalizeDomain(input) {
  const trimmed = String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/\.$/, '');
  if (!trimmed || /[\s@/*]/.test(trimmed)) return '';
  const ascii = domainToASCII(trimmed);
  if (!ascii || !ascii.includes('.')) return '';
  return ascii;
}
