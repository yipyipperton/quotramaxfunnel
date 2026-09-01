import { createClient } from '@supabase/supabase-js';

function getConfig() {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    // Prefer the service role key. NEXT_PUBLIC_* is only a compatibility fallback
    // for existing Vercel env and must never be imported from client components.
    const key =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_KEY ||
        '';

    if (process.env.NEXT_PUBLIC_SUPABASE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_KEY) {
        console.warn(
            'Using NEXT_PUBLIC_SUPABASE_KEY on the server. Move this to SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY) so the key is not exposed to the browser.'
        );
    }

    return { url, key };
}

export function isSupabaseConfigured() {
    const { url, key } = getConfig();
    return Boolean(url && key);
}

export function getSupabase() {
    const { url, key } = getConfig();
    if (!url || !key) return null;
    return createClient(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
