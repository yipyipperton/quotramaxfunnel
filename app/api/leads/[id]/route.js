import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

const LEADS_FILE = path.join(process.cwd(), 'vanilla_backup/data/leads.json');

async function getContractorEmail() {
    if (supabase) {
        try {
            const { data } = await supabase.from('settings').select('contractor_email').eq('id', 1).single();
            if (data?.contractor_email) return data.contractor_email;
        } catch (e) {
            console.error('Error fetching contractor email from settings:', e);
        }
    }
    return 'isaaqabukar1@gmail.com';
}

async function findLeadById(id) {
    if (supabase) {
        try {
            const { data, error } = await supabase.from('leads').select('*').eq('id', id).single();
            if (!error && data) {
                return data;
            }
        } catch (e) {
            console.error('Supabase fetch lead by ID error:', e);
        }
    }

    try {
        if (fs.existsSync(LEADS_FILE)) {
            const fileData = fs.readFileSync(LEADS_FILE, 'utf8');
            const leads = JSON.parse(fileData);
            const lead = leads.find(l => l.id === id);
            if (lead) return lead;
        }
    } catch (e) {
        console.error('File fallback read lead by ID error:', e);
    }

    return null;
}

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        const lead = await findLeadById(id);

        if (!lead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        let extraData = {};
        try {
            if (lead.motivation && lead.motivation.startsWith('{')) {
                extraData = JSON.parse(lead.motivation);
            }
        } catch (e) {}

        const mappedLead = {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            address: lead.address,
            zip: lead.zip || '34652',
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
            appointment: extraData.appointment || null
        };

        return NextResponse.json(mappedLead);
    } catch (e) {
        console.error('Single lead GET API error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        const { status, scheduleInspection, appointment } = await req.json();

        const lead = await findLeadById(id);
        if (!lead) {
            return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
        }

        let updatedStatus = status || lead.status;
        if (scheduleInspection || appointment) {
            updatedStatus = 'Inspection Scheduled';
        }

        let extraData = {};
        try {
            if (lead.motivation && lead.motivation.startsWith('{')) {
                extraData = JSON.parse(lead.motivation);
            }
        } catch (e) {}

        if (appointment) {
            extraData.appointment = appointment;
        }

        const updatedMotivation = JSON.stringify(extraData);
        let success = false;

        if (supabase) {
            try {
                const { error } = await supabase.from('leads').update({ 
                    status: updatedStatus,
                    motivation: updatedMotivation
                }).eq('id', id);
                
                if (!error) success = true;
                else console.error('Supabase patch update error:', error);
            } catch (e) {
                console.error('Supabase patch lead status exception:', e);
            }
        }

        try {
            if (fs.existsSync(LEADS_FILE)) {
                const fileData = fs.readFileSync(LEADS_FILE, 'utf8');
                const leads = JSON.parse(fileData);
                const leadIndex = leads.findIndex(l => l.id === id);
                if (leadIndex !== -1) {
                    leads[leadIndex].status = updatedStatus;
                    leads[leadIndex].motivation = updatedMotivation;
                    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
                    success = true;
                }
            }
        } catch (e) {
            console.error('Local JSON leads patch sync error:', e);
        }

        // Dispatch Resend email alert using onboarding@resend.dev
        if (appointment && success && process.env.RESEND_API_KEY) {
            try {
                const { Resend } = require('resend');
                const resend = new Resend(process.env.RESEND_API_KEY);
                const contractorEmail = await getContractorEmail();

                const appointmentHtml = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                        <h2 style="color: #0d9488; margin: 0 0 12px 0;">📅 Inspection Appointment Scheduled!</h2>
                        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;">
                        <p style="font-size: 15px; color: #1e293b;">Homeowner <strong>${lead.name}</strong> has confirmed their inspection date and time slot:</p>
                        
                        <div style="background-color: #f0fdfa; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d9488;">
                            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #0f766e; text-transform: uppercase;">Confirmed Date &amp; Time Slot:</p>
                            <h3 style="margin: 4px 0 0 0; color: #115e59; font-size: 18px;">
                                ${new Date(appointment.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h3>
                            <p style="margin: 4px 0 0 0; font-weight: bold; color: #0d9488; font-size: 14px;">Time Window: ${appointment.time}</p>
                        </div>

                        <h3 style="color: #0f172a; font-size: 15px;">Customer Details:</h3>
                        <ul style="color: #475569; font-size: 14px; line-height: 1.8;">
                            <li><strong>Name:</strong> ${lead.name}</li>
                            <li><strong>Address:</strong> ${lead.address}</li>
                            <li><strong>Phone:</strong> <a href="tel:${lead.phone}" style="color: #0d9488;">${lead.phone || 'Not provided'}</a></li>
                            <li><strong>Email:</strong> <a href="mailto:${lead.email}">${lead.email}</a></li>
                        </ul>
                    </div>
                `;

                await resend.emails.send({
                    from: 'Quotramax Scheduling <onboarding@resend.dev>',
                    to: contractorEmail,
                    subject: `📅 Confirmed Inspection: ${lead.name} - ${appointment.date}`,
                    html: appointmentHtml
                });
            } catch (e) {
                console.error('Resend dispatch error for scheduled appointment:', e);
            }
        }

        return NextResponse.json({ success });
    } catch (e) {
        console.error('Single lead PATCH API error:', e);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
