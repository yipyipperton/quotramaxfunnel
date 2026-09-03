import { NextResponse } from 'next/server';
import { after } from 'next/server';
import {
    createLeadAccessToken,
    escapeHtml,
    getClientIp,
    getClientSlug,
    noStoreHeaders,
    rateLimit,
    validateLeadPayload,
} from '@/lib/security';
import { formatPhone, telHref } from '@/lib/format';
import { getClientConfig, isBookingBlocked } from '@/lib/clients';
import { getContractorEmail, insertLead } from '@/lib/leads';
import { getFromAddress, sendEmail, withDisplayName } from '@/lib/email';

export const dynamic = 'force-dynamic';

function json(data, { status = 200, token } = {}) {
    const res = NextResponse.json(data, { status, headers: noStoreHeaders() });
    if (token) {
        res.cookies.set('qm_access', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
        });
    }
    return res;
}

export async function GET() {
    return json({ error: 'Endpoint restricted' }, { status: 403 });
}

function buildHomeownerHtml(lead, companyName) {
    const brand = escapeHtml(String(companyName || 'Quotramax').toUpperCase());
    const name = escapeHtml(lead.name);
    const location = escapeHtml(lead.fullAddress);
    const phone = escapeHtml(formatPhone(lead.phone));
    const service = escapeHtml(lead.service);
    const stories = escapeHtml(lead.stories);
    const pitch = escapeHtml(lead.pitch);
    const material = escapeHtml(lead.material);
    const timeline = escapeHtml(lead.timeline);
    const insurance = escapeHtml(lead.insurance);
    const apptDate = escapeHtml(
        new Date(`${lead.appointment.date}T00:00:00`).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    );
    const apptTime = escapeHtml(lead.appointment.time);

    return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
                <h2 style="color: #0d9488; margin: 0; font-size: 22px;">${brand}</h2>
            </div>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;">
            <p style="font-size: 16px; color: #1e293b;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 15px; color: #475569; line-height: 1.6;">
                Thank you for requesting your <strong>21-Point Roof &amp; Attic Inspection</strong> for <strong>${location}</strong>. Our local inspection crew has received your property details.
            </p>
            <div style="background-color: #f0fdfa; padding: 18px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #0d9488;">
                <p style="margin: 0; font-size: 13px; font-weight: bold; color: #0f766e; text-transform: uppercase; letter-spacing: 0.05em;">Confirmed Inspection Slot:</p>
                <h3 style="margin: 6px 0 2px 0; color: #115e59; font-size: 18px;">${apptDate}</h3>
                <p style="margin: 0; font-size: 14px; color: #0d9488; font-weight: 600;">Time Window: ${apptTime}</p>
            </div>
            <h3 style="color: #0f172a; font-size: 16px; margin-top: 24px;">Project Scope Summary:</h3>
            <ul style="color: #475569; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                <li><strong>Service Goal:</strong> ${service}</li>
                <li><strong>Property Location:</strong> ${location}</li>
                <li><strong>Building Specs:</strong> ${stories} &bull; ${pitch}</li>
                <li><strong>Desired Material:</strong> ${material}</li>
                <li><strong>Timeline / Urgency:</strong> ${timeline}</li>
                <li><strong>Funding Preference:</strong> ${insurance}</li>
            </ul>
            <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px;">Next Steps:</h4>
                <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                    1. Our local inspection crew is preparing your property file.<br>
                    2. A licensed technician will call you at <strong>${phone}</strong> to confirm access.<br>
                    3. You will receive a written physical property condition report on-site.
                </p>
            </div>
            <p style="margin-top: 24px; font-size: 14px; color: #64748b;">
                Best regards,<br>
                <strong>Your Certified Roofing Inspection Team</strong>
            </p>
        </div>
    `;
}

function buildContractorHtml(lead) {
    const name = escapeHtml(lead.name);
    const phone = escapeHtml(formatPhone(lead.phone));
    const phoneHref = escapeHtml(telHref(lead.phone));
    const email = escapeHtml(lead.email);
    const location = escapeHtml(lead.fullAddress);
    const city = escapeHtml(lead.city);
    const state = escapeHtml(lead.state);
    const zip = escapeHtml(lead.zip);
    const service = escapeHtml(lead.service);
    const stories = escapeHtml(lead.stories);
    const pitch = escapeHtml(lead.pitch);
    const material = escapeHtml(lead.material);
    const timeline = escapeHtml(lead.timeline);
    const insurance = escapeHtml(lead.insurance);
    const apptDate = escapeHtml(
        new Date(`${lead.appointment.date}T00:00:00`).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        })
    );
    const apptTime = escapeHtml(lead.appointment.time);

    return `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="background-color: #0d9488; color: white; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; font-weight: bold; font-size: 18px; text-align: center;">
                NEW QUALIFIED ROOFING LEAD &amp; BOOKING
            </div>
            <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #f59e0b; border-left: 4px solid #d97706;">
                <p style="margin: 0; font-size: 12px; font-weight: bold; color: #78350f; text-transform: uppercase;">Scheduled Inspection Time Slot:</p>
                <h3 style="margin: 4px 0 0 0; color: #92400e; font-size: 18px;">${apptDate} (${apptTime})</h3>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569; width: 35%;">Homeowner Name:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Mobile Phone:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0d9488; font-weight: bold;">
                        <a href="tel:${phoneHref}" style="color: #0d9488; text-decoration: none; font-size: 16px;">${phone}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Email Address:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">
                        <a href="mailto:${email}" style="color: #6366f1; text-decoration: none;">${email}</a>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Full Address:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${location}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">City &amp; State:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${city}, ${state} ${zip}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Project Scope:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: bold;">${service}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Stories &amp; Pitch:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${stories} &bull; ${pitch}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Desired Material:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0d9488; font-weight: bold;">${material}</td>
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
            <div style="margin-top: 24px; text-align: center; background-color: #f0fdfa; padding: 14px; border-radius: 8px; border: 1px solid #ccfbf1;">
                <span style="color: #0f766e; font-weight: bold; font-size: 14px;">Immediate Action: Call or text homeowner at <a href="tel:${phoneHref}" style="color: #0d9488;">${phone}</a></span>
            </div>
        </div>
    `;
}

export async function POST(req) {
    try {
        const contentLength = Number(req.headers.get('content-length') || 0);
        if (contentLength > 32_768) {
            return json({ success: false, error: 'Payload too large' }, { status: 413 });
        }

        const ip = getClientIp(req);
        const limited = rateLimit(`lead:${ip}`);
        if (!limited.ok) {
            return json({ success: false, error: 'Too many requests. Please try again later.' }, { status: 429 });
        }

        const client = getClientSlug(req);
        const clientConfig = await getClientConfig(client);
        if (isBookingBlocked(clientConfig)) {
            return json(
                { success: false, error: 'This booking page is not active. Please contact the contractor directly.' },
                { status: 403 }
            );
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return json({ success: false, error: 'Invalid JSON' }, { status: 400 });
        }

        const parsed = validateLeadPayload(body);
        if (parsed.honeypot) {
            console.warn('Spambot trapped via honeypot field');
            return json({ success: true, leadId: 'blocked' });
        }
        if (parsed.error) {
            return json({ success: false, error: parsed.error }, { status: 400 });
        }

        const lead = parsed.value;
        const emailLimited = rateLimit(`lead-email:${lead.email}`, { limit: 3, windowMs: 60 * 60 * 1000 });
        if (!emailLimited.ok) {
            return json({ success: false, error: 'Too many requests for this email.' }, { status: 429 });
        }

        const motivationPayload = JSON.stringify({
            service: lead.service,
            roofAge: lead.roofAge,
            stories: lead.stories,
            pitch: lead.pitch,
            timeline: lead.timeline,
            insurance: lead.insurance,
            city: lead.city,
            state: lead.state,
            zip: lead.zip,
            appointment: lead.appointment,
            client,
        });

        const leadData = {
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            address: lead.fullAddress,
            zip: lead.zip,
            size: 2400,
            material: lead.material,
            price: 0,
            motivation: motivationPayload,
            age: lead.service,
            stories: lead.stories,
            status: 'Inspection Scheduled',
            date: new Date().toISOString(),
            client,
        };

        const savedLead = await insertLead(leadData);
        const leadId = String(savedLead.id);
        const accessToken = createLeadAccessToken(leadId);

        const street = lead.address;
        const companyName = clientConfig?.companyName || '';
        const from = withDisplayName(getFromAddress(), companyName);
        const bcc = process.env.LEAD_ALERT_BCC || undefined;

        after(async () => {
            const contractorEmail = await getContractorEmail(client);
            const emailTasks = [
                sendEmail({
                    to: lead.email,
                    subject: `Confirmed: 21-Point Roof Inspection for ${street}`,
                    html: buildHomeownerHtml(lead, companyName),
                    from,
                }),
            ];

            if (contractorEmail) {
                emailTasks.push(
                    sendEmail({
                        to: contractorEmail,
                        subject: `New lead: ${lead.name} (${lead.service}) - ${lead.fullAddress}`,
                        html: buildContractorHtml(lead),
                        from: getFromAddress('Quotramax Dispatch <inspections@quotramax.com>'),
                        bcc,
                    })
                );
            } else {
                console.error('CONTRACTOR_EMAIL is not configured; contractor alert skipped');
            }

            await Promise.allSettled(emailTasks);
        });

        return json({ success: true, leadId, accessToken }, { token: accessToken });
    } catch (error) {
        console.error('Leads POST API error:', error);
        const message = String(error.message || '');
        if (message === 'RLS_BLOCKED') {
            return json(
                {
                    success: false,
                    error: 'The website is using the public database key. In Vercel, add SUPABASE_SERVICE_ROLE_KEY using the secret service_role key from Supabase, then Redeploy.',
                },
                { status: 503 }
            );
        }
        if (/not configured/i.test(message)) {
            return json(
                {
                    success: false,
                    error: 'Database is not connected on Vercel yet. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then Redeploy.',
                },
                { status: 503 }
            );
        }
        if (/LEAD_ACCESS_SECRET/i.test(message)) {
            return json(
                {
                    success: false,
                    error: 'Lead intake is temporarily unavailable. Please try again shortly.',
                },
                { status: 503 }
            );
        }
        if (/Failed to save lead/i.test(message)) {
            return json(
                {
                    success: false,
                    error: 'Could not save this lead to the database. Check Vercel → Deployments → Logs for “Supabase insert lead error”.',
                },
                { status: 503 }
            );
        }
        return json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
