import { getSupabase } from './supabase.js';

const CACHE_TTL_MS = 60 * 1000;
const MAX_FAQS = 8;

const cache = new Map();
let clientsTableMissing = false;

export function safeLogoUrl(value) {
    const raw = String(value ?? '').trim();
    if (!raw || raw.length > 500) return '';
    try {
        const url = new URL(raw);
        if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
        return url.toString();
    } catch {
        return '';
    }
}

export function normalizeFaqs(value) {
    let list = value;
    if (typeof list === 'string') {
        try {
            list = JSON.parse(list);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(list)) return [];

    const faqs = [];
    for (const entry of list) {
        if (!entry || typeof entry !== 'object') continue;
        const q = String(entry.q ?? entry.question ?? '').trim().slice(0, 200);
        const a = String(entry.a ?? entry.answer ?? '').trim().slice(0, 1000);
        if (!q || !a) continue;
        faqs.push({ q, a });
        if (faqs.length >= MAX_FAQS) break;
    }
    return faqs;
}

export function mapClientRow(row) {
    if (!row) return null;
    return {
        slug: String(row.slug || ''),
        companyName: String(row.company_name || '').trim().slice(0, 80),
        contractorEmail: String(row.contractor_email || '').trim(),
        logoUrl: safeLogoUrl(row.logo_url),
        faqs: normalizeFaqs(row.faqs),
        active: row.active !== false,
    };
}

// Once slugs are seeded, set REQUIRE_KNOWN_CLIENT=true so a guessed subdomain
// cannot serve a live funnel that collects real homeowner details.
export function requireKnownClient() {
    return /^(1|true|yes)$/i.test(String(process.env.REQUIRE_KNOWN_CLIENT || '').trim());
}

export function clearClientCache(slug) {
    if (slug) cache.delete(slug);
    else cache.clear();
}

export async function getClientConfig(slug) {
    const key = String(slug || '').trim().toLowerCase();
    if (!key || clientsTableMissing) return null;

    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('clients')
        .select('slug, company_name, contractor_email, logo_url, faqs, active')
        .eq('slug', key)
        .maybeSingle();

    if (error) {
        const combined = `${error.message || ''} ${error.details || ''} ${error.code || ''}`;
        if (/42P01|does not exist|schema cache/i.test(combined)) {
            // Migration 003 has not been run yet; stay on the single-inbox path.
            clientsTableMissing = true;
        } else {
            console.error('Supabase clients lookup error:', error.message, error.code);
        }
        return null;
    }

    const value = mapClientRow(data);
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
}

export function isBookingBlocked(config) {
    if (config) return !config.active;
    return requireKnownClient();
}
