import { createHmac, timingSafeEqual } from 'crypto';

const ACCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const rateBuckets = new Map();

const ALLOWED_SERVICES = new Set([
    'Full Roof Replacement',
    'Active Leak / Repair',
    'Storm / Hail Damage',
    'Preventative Inspection',
]);

const ALLOWED_MATERIALS = new Set([
    'Architectural Shingles',
    'Standing Seam Metal',
    'Clay Tile / Slate',
]);

const ALLOWED_TIMELINES = new Set([
    'Under 2 weeks',
    '1 - 4 weeks',
    '1 - 3 months',
    'Under 1 month',
]);

const ALLOWED_PAYMENTS = new Set([
    'Low Monthly Financing',
    'Insurance Claim Pending',
    'Cash / Direct Payment',
]);

const ALLOWED_STORIES = new Set(['1 Story', '2 Stories', '3+ Stories']);

const ALLOWED_PITCHES = new Set(['Standard Pitch', 'Flat', 'Steep', 'Standard']);

const ALLOWED_TIMES = new Set([
    'Morning Arrival (8:00 AM - 11:00 AM)',
    'Afternoon Arrival (12:00 PM - 3:00 PM)',
    'Late Afternoon Arrival (3:30 PM - 6:00 PM)',
]);

export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

export function noStoreHeaders() {
    return {
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        Pragma: 'no-cache',
    };
}

export function getClientIp(req) {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim().slice(0, 64);
    }
    return (req.headers.get('x-real-ip') || 'unknown').slice(0, 64);
}

export function rateLimit(key, { limit = 8, windowMs = 15 * 60 * 1000 } = {}) {
    const now = Date.now();
    // Opportunistic cleanup so the map cannot grow without bound in long-lived processes.
    if (rateBuckets.size > 5000) {
        for (const [k, entry] of rateBuckets) {
            if (now > entry.resetAt) rateBuckets.delete(k);
        }
    }

    const entry = rateBuckets.get(key);
    if (!entry || now > entry.resetAt) {
        rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
        return { ok: true, remaining: limit - 1 };
    }

    entry.count += 1;
    if (entry.count > limit) {
        return { ok: false, remaining: 0, retryAfterMs: entry.resetAt - now };
    }
    return { ok: true, remaining: limit - entry.count };
}

export function isValidLeadId(id) {
    if (typeof id !== 'string') return false;
    if (id.length < 4 || id.length > 80) return false;
    return /^[A-Za-z0-9_-]+$/.test(id);
}

function getSigningSecret() {
    const secret =
        process.env.LEAD_ACCESS_SECRET ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_KEY ||
        '';

    if (secret) return secret;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('LEAD_ACCESS_SECRET is required in production');
    }
    return 'dev-insecure-lead-access-secret';
}

export function createLeadAccessToken(leadId, ttlMs = ACCESS_TTL_MS) {
    const payload = Buffer.from(
        JSON.stringify({ id: String(leadId), exp: Date.now() + ttlMs })
    ).toString('base64url');
    const sig = createHmac('sha256', getSigningSecret()).update(payload).digest('base64url');
    return `${payload}.${sig}`;
}

export function verifyLeadAccessToken(token, expectedLeadId) {
    if (!token || typeof token !== 'string') return false;
    const sep = token.lastIndexOf('.');
    if (sep <= 0) return false;

    const payload = token.slice(0, sep);
    const sig = token.slice(sep + 1);
    if (!payload || !sig) return false;

    const expected = createHmac('sha256', getSigningSecret()).update(payload).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
        return false;
    }

    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!data || data.exp < Date.now()) return false;
        return String(data.id) === String(expectedLeadId);
    } catch {
        return false;
    }
}

export function extractAccessToken(req) {
    const auth = req.headers.get('authorization');
    if (auth && auth.startsWith('Bearer ')) {
        return auth.slice(7).trim();
    }

    try {
        const queryToken = new URL(req.url).searchParams.get('t');
        if (queryToken) return queryToken;
    } catch {
        // ignore malformed URL
    }

    const cookieHeader = req.headers.get('cookie') || '';
    const parts = cookieHeader.split(';');
    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.startsWith('qm_access=')) {
            return decodeURIComponent(trimmed.slice('qm_access='.length));
        }
    }
    return null;
}

export function requireLeadAccess(req, leadId) {
    const token = extractAccessToken(req);
    return verifyLeadAccessToken(token, leadId);
}

function oneOf(value, allowed, fallback) {
    const v = typeof value === 'string' ? value.trim() : '';
    if (allowed.has(v)) return v;
    return fallback;
}

function isValidAppointmentDate(dateStr) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
    const parsed = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const min = new Date(today);
    min.setDate(min.getDate() - 1);
    const max = new Date(today);
    max.setDate(max.getDate() + 90);
    return parsed >= min && parsed <= max;
}

export function validateLeadPayload(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return { error: 'Invalid request' };
    }

    if (body.website_hp && String(body.website_hp).length > 0) {
        return { honeypot: true };
    }

    const name = String(body.name || '').trim();
    if (name.length < 2 || name.length > 100) {
        return { error: 'Please enter your full name.' };
    }

    const email = String(body.email || '').trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: 'Please enter a valid email address.' };
    }

    const phoneDigits = String(body.phone || '').replace(/\D/g, '').slice(0, 15);
    if (phoneDigits.length !== 10 || /^(\d)\1{9}$/.test(phoneDigits) || phoneDigits === '1234567890') {
        return { error: 'Please enter a valid 10-digit phone number.' };
    }

    const address = String(body.address || '').trim();
    if (address.length < 5 || address.length > 200) {
        return { error: 'Please enter a valid street address.' };
    }

    const city = String(body.city || '').trim();
    if (city.length < 2 || city.length > 80) {
        return { error: 'Please enter your city.' };
    }

    const state = String(body.state || '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(state)) {
        return { error: 'Please enter a 2-letter state code.' };
    }

    const zip = String(body.zip || '').replace(/\D/g, '').slice(0, 5);
    if (zip.length !== 5) {
        return { error: 'Please enter a valid 5-digit ZIP code.' };
    }

    const appointment = body.appointment && typeof body.appointment === 'object'
        ? body.appointment
        : null;
    const appointmentDate = appointment ? String(appointment.date || '').trim() : '';
    const appointmentTime = appointment ? String(appointment.time || '').trim() : '';

    if (!appointmentDate || !isValidAppointmentDate(appointmentDate)) {
        return { error: 'Please select a valid inspection date.' };
    }
    if (!ALLOWED_TIMES.has(appointmentTime)) {
        return { error: 'Please select a valid arrival window.' };
    }

    const fullAddress = `${address}, ${city}, ${state} ${zip}`;

    return {
        value: {
            name,
            email,
            phone: phoneDigits,
            address,
            city,
            state,
            zip,
            fullAddress,
            service: oneOf(body.service, ALLOWED_SERVICES, 'Full Roof Replacement'),
            roofAge: String(body.roofAge || '10 - 20 years').slice(0, 40),
            stories: oneOf(body.stories, ALLOWED_STORIES, '1 Story'),
            pitch: oneOf(body.pitch, ALLOWED_PITCHES, 'Standard Pitch'),
            material: oneOf(body.material, ALLOWED_MATERIALS, 'Architectural Shingles'),
            timeline: oneOf(body.timeline, ALLOWED_TIMELINES, '1 - 4 weeks'),
            insurance: oneOf(body.insurance, ALLOWED_PAYMENTS, 'Cash / Direct Payment'),
            appointment: {
                date: appointmentDate,
                time: appointmentTime,
            },
        },
    };
}
