import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAuth } from '@/lib/auth';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';

const LEADS_FILE = path.join(process.cwd(), 'vanilla_backup/data/leads.json');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || '');

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

export async function GET(req) {
    try {
        const authenticated = await checkAuth();
        if (!authenticated) {
            return NextResponse.json({ error: 'Unauthorized session' }, { status: 401 });
        }

        let leads = [];

        if (supabase) {
            try {
                const { data, error } = await supabase.from('leads').select('*').order('date', { ascending: false });
                if (!error && data) {
                    leads = data.map(row => {
                        let extraData = {};
                        try {
                            if (row.motivation && row.motivation.startsWith('{')) {
                                extraData = JSON.parse(row.motivation);
                            }
                        } catch (e) {}

                        return {
                            id: row.id,
                            name: row.name,
                            email: row.email,
                            phone: row.phone,
                            address: row.address,
                            zip: row.zip,
                            size: row.size || row.roof_size,
                            material: row.material,
                            stories: row.stories,
                            status: row.status || 'New',
                            date: row.date,
                            service: extraData.service || row.age || 'Full Roof Replacement',
                            roofAge: extraData.roofAge || '10 - 20 years',
                            pitch: extraData.pitch || 'Standard Pitch',
                            timeline: extraData.timeline || 'Under 1 month',
                            insurance: extraData.insurance || 'Cash / Direct Payment',
                            appointment: extraData.appointment || null
                        };
                    });
                    return NextResponse.json(leads);
                }
            } catch (e) {
                console.error('Supabase fetch leads error:', e);
            }
        }

        // Local filesystem fallback
        try {
            if (fs.existsSync(LEADS_FILE)) {
                const fileData = fs.readFileSync(LEADS_FILE, 'utf8');
                leads = JSON.parse(fileData);
                return NextResponse.json(leads);
            }
        } catch (e) {
            console.error('File fallback read leads error:', e);
        }

        return NextResponse.json([]);
    } catch (e) {
        console.error('Leads GET API error:', e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { 
            name, 
            email, 
            phone, 
            address, 
            zip, 
            service, 
            roofAge, 
            stories, 
            pitch, 
            material, 
            timeline, 
            insurance, 
            appointment 
        } = body;

        // Validation
        if (!name || !email || !address) {
            return NextResponse.json({ success: false, error: 'Required fields are missing' }, { status: 400 });
        }

        const fullAddress = zip && !address.includes(zip) ? `${address}, ${zip}` : address;
        const uniqueId = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const motivationPayload = JSON.stringify({
            service: service || 'Full Roof Replacement',
            roofAge: roofAge || '10 - 20 years',
            stories: stories || '1 Story',
            pitch: pitch || 'Standard Pitch',
            timeline: timeline || 'Under 1 month',
            insurance: insurance || 'Cash / Direct Payment',
            zip: zip || '',
            appointment: appointment || null
        });

        const leadData = {
            name,
            email,
            phone: phone || '',
            address: fullAddress,
            zip: zip || '34652',
            size: 2400,
            material: material || 'Architectural Shingles',
            price: 0, // No fake prices
            motivation: motivationPayload,
            age: service || 'Full Roof Replacement',
            stories: stories || '1 Story',
            status: appointment && appointment.date ? 'Inspection Scheduled' : 'New Lead',
            date: new Date().toISOString()
        };

        let savedLead = null;

        if (supabase) {
            try {
                const { data, error } = await supabase.from('leads').insert([leadData]).select();
                if (!error && data && data.length > 0) {
                    savedLead = data[0];
                } else if (error) {
                    console.error('Supabase insert lead error:', error);
                }
            } catch (e) {
                console.error('Supabase write lead exception:', e);
            }
        }

        // Filesystem fallback caching if Supabase writes fail
        if (!savedLead) {
            leadData.id = 'RQ-' + uniqueId;
            try {
                let localLeads = [];
                if (fs.existsSync(LEADS_FILE)) {
                    const data = fs.readFileSync(LEADS_FILE, 'utf8');
                    localLeads = JSON.parse(data);
                }
                localLeads.unshift(leadData);
                fs.writeFileSync(LEADS_FILE, JSON.stringify(localLeads, null, 2), 'utf8');
                savedLead = leadData;
            } catch (e) {
                console.error('Local leads caching write error:', e);
                savedLead = leadData;
            }
        }

        const contractorEmail = await getContractorEmail();
        const leadId = savedLead.id || 'RQ-' + uniqueId;

        // Email to Homeowner
        const homeownerHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
                    <h2 style="color: #0d9488; margin: 0; font-size: 22px;">QUOTRAMAX</h2>
                </div>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;">
                <p style="font-size: 16px; color: #1e293b;">Hello <strong>${name}</strong>,</p>
                <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                    Thank you for requesting your <strong>21-Point Roof &amp; Attic Inspection</strong> for <strong>${fullAddress}</strong>. Our local inspection crew has received your property details.
                </p>
                
                ${appointment && appointment.date ? `
                <div style="background-color: #f0fdfa; padding: 18px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #0d9488;">
                    <p style="margin: 0; font-size: 13px; font-weight: bold; color: #0f766e; text-transform: uppercase; letter-spacing: 0.05em;">📅 Confirmed Inspection Slot:</p>
                    <h3 style="margin: 6px 0 2px 0; color: #115e59; font-size: 18px;">
                        ${new Date(appointment.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <p style="margin: 0; font-size: 14px; color: #0d9488; font-weight: 600;">Time Window: ${appointment.time}</p>
                </div>
                ` : ''}

                <h3 style="color: #0f172a; font-size: 16px; margin-top: 24px;">Project Scope Summary:</h3>
                <ul style="color: #475569; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                    <li><strong>Service Goal:</strong> ${service || 'Full Roof Replacement'}</li>
                    <li><strong>Building Specs:</strong> ${stories || '1 Story'} &bull; ${pitch || 'Standard Pitch'}</li>
                    <li><strong>Desired Material:</strong> ${material || 'Architectural Shingles'}</li>
                    <li><strong>Timeline / Urgency:</strong> ${timeline || 'Under 1 month'}</li>
                    <li><strong>Funding Preference:</strong> ${insurance || 'Cash / Direct Payment'}</li>
                </ul>

                <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                    <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px;">Next Steps:</h4>
                    <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                        1. Our team is pulling satellite aerial roof measurements.<br>
                        2. A licensed technician will contact you via text/phone at <strong>${phone || 'your phone'}</strong> to confirm access.<br>
                        3. You will receive a written physical property condition report on-site.
                    </p>
                </div>

                <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
                    Best regards,<br>
                    <strong>Your Certified Roofing Inspection Team</strong>
                </p>
            </div>
        `;

        // Email to Contractor
        const contractorHtml = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                <div style="background-color: #0d9488; color: white; padding: 12px 16px; border-radius: 6px; margin-bottom: 20px; font-weight: bold; font-size: 16px;">
                    🔥 NEW PRE-QUALIFIED ROOFING LEAD &amp; BOOKING
                </div>

                ${appointment && appointment.date ? `
                <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #f59e0b; border-left: 4px solid #d97706;">
                    <p style="margin: 0; font-size: 12px; font-weight: bold; color: #78350f; text-transform: uppercase;">📅 Scheduled Inspection Time:</p>
                    <h3 style="margin: 4px 0 0 0; color: #92400e; font-size: 18px;">
                        ${new Date(appointment.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} (${appointment.time})
                    </h3>
                </div>
                ` : ''}

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 35%;">Homeowner:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Phone:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0d9488; font-weight: bold;">
                            <a href="tel:${phone}" style="color: #0d9488; text-decoration: none;">${phone || 'Not provided'}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Email:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                            <a href="mailto:${email}" style="color: #6366f1; text-decoration: none;">${email}</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Property Address:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${fullAddress}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Project Scope:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${service}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Stories &amp; Pitch:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${stories} &bull; ${pitch}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Desired Material:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${material}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Timeline Urgency:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #d97706; font-weight: bold;">${timeline}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Funding Intent:</td>
                        <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #059669; font-weight: bold;">${insurance}</td>
                    </tr>
                </table>

                <div style="margin-top: 30px; text-align: center;">
                    <a href="${req.headers.get('origin') || ''}/login" style="background-color: #0d9488; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                        Open Contractor CRM Dashboard &rarr;
                    </a>
                </div>
            </div>
        `;

        // Send emails asynchronously
        (async () => {
            try {
                await resend.emails.send({
                    from: 'Quotramax Scheduling <no-reply@quotramax.com>',
                    to: email,
                    subject: `Confirmed: 21-Point Roof Inspection for ${address.split(',')[0]}`,
                    html: homeownerHtml
                });
            } catch (e) {
                console.warn('Homeowner email dispatch note:', e.message);
            }

            try {
                await resend.emails.send({
                    from: 'Quotramax Lead Alert <no-reply@quotramax.com>',
                    to: contractorEmail,
                    subject: `🔥 New Lead: ${name} (${service}) - ${fullAddress}`,
                    html: contractorHtml
                });
            } catch (e) {
                console.error('Contractor lead email dispatch error:', e.message);
            }
        })();

        return NextResponse.json({ success: true, leadId });
    } catch (e) {
        console.error('Leads POST API error:', e);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
