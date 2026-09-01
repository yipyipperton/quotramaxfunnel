import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

const LEADS_FILE = path.join(process.cwd(), 'data/leads.json');
const allowFileFallback = process.env.NODE_ENV !== 'production';

export function parseMotivation(motivation) {
    try {
        if (typeof motivation === 'string' && motivation.startsWith('{')) {
            return JSON.parse(motivation);
        }
        if (motivation && typeof motivation === 'object') {
            return motivation;
        }
    } catch {
        // ignore malformed payloads from older rows
    }
    return {};
}

export function mapLead(lead) {
    const extraData = parseMotivation(lead.motivation);
    return {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        address: lead.address,
        zip: lead.zip || '',
        size: lead.size || 2400,
        material: lead.material || 'Architectural Shingles',
        stories: lead.stories || '1 Story',
        status: lead.status || 'New Lead',
        date: lead.date,
        service: extraData.service || lead.age || 'Full Roof Replacement',
        timeline: extraData.timeline || 'Under 1 month',
        insurance: extraData.insurance || 'Cash / Direct Payment',
        roofAge: extraData.roofAge || '10 - 20 years',
        pitch: extraData.pitch || 'Standard Pitch',
        appointment: extraData.appointment || null,
    };
}

function readLocalLeads() {
    if (!fs.existsSync(LEADS_FILE)) return [];
    const fileData = fs.readFileSync(LEADS_FILE, 'utf8');
    const parsed = JSON.parse(fileData);
    return Array.isArray(parsed) ? parsed : [];
}

function writeLocalLeads(leads) {
    fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true });
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

export async function insertLead(leadData) {
    const supabase = getSupabase();
    if (supabase) {
        const attempts = [
            { ...leadData, id: randomUUID() },
            leadData,
        ];

        for (const row of attempts) {
            const { data, error } = await supabase.from('leads').insert([row]).select('id').maybeSingle();
            if (!error) {
                return { ...row, ...(data || {}) };
            }
            console.error('Supabase insert lead error:', error.message, error.code, error.details);

            const combined = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`;
            if (/row-level security|permission denied|42501/i.test(combined)) {
                throw new Error('RLS_BLOCKED');
            }
        }

        throw new Error('Failed to save lead');
    }

    if (!allowFileFallback) {
        throw new Error('Lead storage is not configured');
    }

    const localLead = { ...leadData, id: randomUUID() };
    try {
        const localLeads = readLocalLeads();
        localLeads.unshift(localLead);
        writeLocalLeads(localLeads);
    } catch (error) {
        console.error('Local lead write error:', error);
    }
    return localLead;
}

export async function findLeadById(id) {
    const supabase = getSupabase();
    if (supabase) {
        const { data, error } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
        if (error) {
            console.error('Supabase fetch lead error:', error.message);
        } else if (data) {
            return data;
        }
        // If Supabase is configured, do not leak local-dev files in production-like setups.
        if (isSupabaseConfigured()) return null;
    }

    if (!allowFileFallback) return null;

    try {
        const lead = readLocalLeads().find((row) => String(row.id) === String(id));
        return lead || null;
    } catch (error) {
        console.error('Local lead read error:', error);
        return null;
    }
}

export async function updateLead(id, fields) {
    let success = false;
    const supabase = getSupabase();

    if (supabase) {
        const { error } = await supabase.from('leads').update(fields).eq('id', id);
        if (error) {
            console.error('Supabase update lead error:', error.message);
        } else {
            success = true;
        }
        if (isSupabaseConfigured()) return success;
    }

    if (!allowFileFallback) return success;

    try {
        const leads = readLocalLeads();
        const leadIndex = leads.findIndex((row) => String(row.id) === String(id));
        if (leadIndex === -1) return success;
        leads[leadIndex] = { ...leads[leadIndex], ...fields };
        writeLocalLeads(leads);
        return true;
    } catch (error) {
        console.error('Local lead update error:', error);
        return success;
    }
}

export async function getContractorEmail() {
    if (process.env.CONTRACTOR_EMAIL) return process.env.CONTRACTOR_EMAIL;

    const supabase = getSupabase();
    if (supabase) {
        try {
            const { data } = await supabase
                .from('settings')
                .select('contractor_email')
                .eq('id', 1)
                .maybeSingle();
            if (data?.contractor_email) return data.contractor_email;
        } catch (error) {
            console.error('Error fetching contractor email from settings:', error);
        }
    }

    return null;
}
