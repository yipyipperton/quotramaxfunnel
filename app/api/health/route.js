import { NextResponse } from 'next/server';
import { noStoreHeaders } from '@/lib/security';
import { getSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function present(value) {
    return Boolean(value && String(value).trim());
}

async function clientsTableReady() {
    const supabase = getSupabase();
    if (!supabase) return false;
    try {
        const { error } = await supabase.from('clients').select('slug').limit(1);
        return !error;
    } catch {
        return false;
    }
}

export async function GET() {
    const serviceRole = present(process.env.SUPABASE_SERVICE_ROLE_KEY);
    const supabaseUrl = present(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
    const legacyKey = present(process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY);

    return NextResponse.json(
        {
            supabaseUrl,
            serviceRoleKey: serviceRole,
            otherSupabaseKey: legacyKey,
            resendKey: present(process.env.RESEND_API_KEY),
            readyToSave: supabaseUrl && (serviceRole || legacyKey),
            clientsTable: await clientsTableReady(),
        },
        { headers: noStoreHeaders() }
    );
}
