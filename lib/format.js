/**
 * Leads are stored as bare digits, so anything user-facing has to be formatted
 * back to (XXX) XXX-XXXX. Input that is not a 10-digit US number is returned as-is.
 */
export function formatPhone(value) {
    const digits = String(value ?? '').replace(/\D/g, '');
    const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    if (local.length !== 10) return String(value ?? '');
    return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}

/** Digits-only form suitable for a tel: href. */
export function telHref(value) {
    const digits = String(value ?? '').replace(/\D/g, '');
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return digits;
}
