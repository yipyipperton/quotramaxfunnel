import { NextResponse } from 'next/server';
import { after } from 'next/server';
import {
    escapeHtml,
    isValidLeadId,
    noStoreHeaders,
    requireLeadAccess,
} from '@/lib/security';
import { formatPhone } from '@/lib/format';
import { findLeadById, getContractorEmail, mapLead, parseMotivation, updateLead } from '@/lib/leads';
import { getFromAddress, sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

function json(data, { status = 200 } = {}) {
    return NextResponse.json(data, { status, headers: noStoreHeaders() });
}

function unauthorized() {
    return json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(req, { params }) {
    try {
        const { id } = await params;
        if (!isValidLeadId(id) || !requireLeadAccess(req, id)) {
            return unauthorized();
        }

        const lead = await findLeadById(id);
        if (!lead) {
            return json({ error: 'Lead not found' }, { status: 404 });
        }

        return json(mapLead(lead));
    } catch (error) {
        console.error('Single lead GET API error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        if (!isValidLeadId(id) || !requireLeadAccess(req, id)) {
            return unauthorized();
        }

        let body;
        try {
            body = await req.json();
        } catch {
            return json({ success: false, error: 'Invalid JSON' }, { status: 400 });
        }

        const { status, scheduleInspection, appointment } = body || {};
        const allowedStatus = new Set([
            'New Lead',
            'Inspection Scheduled',
            'Contacted',
            'Closed',
        ]);

        const lead = await findLeadById(id);
        if (!lead) {
            return json({ success: false, error: 'Lead not found' }, { status: 404 });
        }

        let updatedStatus = typeof status === 'string' && allowedStatus.has(status) ? status : lead.status;
        const nextAppointment =
            appointment &&
            typeof appointment === 'object' &&
            /^\d{4}-\d{2}-\d{2}$/.test(String(appointment.date || '')) &&
            typeof appointment.time === 'string'
                ? { date: String(appointment.date), time: String(appointment.time).slice(0, 80) }
                : null;

        if (scheduleInspection || nextAppointment) {
            updatedStatus = 'Inspection Scheduled';
        }

        const extraData = parseMotivation(lead.motivation);
        if (nextAppointment) extraData.appointment = nextAppointment;

        const success = await updateLead(id, {
            status: updatedStatus,
            motivation: JSON.stringify(extraData),
        });

        if (nextAppointment && success) {
            after(async () => {
                const contractorEmail = await getContractorEmail();
                if (!contractorEmail) return;

                const mapped = mapLead({ ...lead, motivation: JSON.stringify(extraData) });
                const appointmentHtml = `
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                        <h2 style="color: #0d9488; margin: 0 0 12px 0;">Inspection Appointment Scheduled</h2>
                        <p style="font-size: 15px; color: #1e293b;">Homeowner <strong>${escapeHtml(mapped.name)}</strong> has confirmed their inspection date and time slot:</p>
                        <div style="background-color: #f0fdfa; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d9488;">
                            <p style="margin: 0; font-size: 12px; font-weight: bold; color: #0f766e; text-transform: uppercase;">Confirmed Date &amp; Time Slot:</p>
                            <h3 style="margin: 4px 0 0 0; color: #115e59; font-size: 18px;">
                                ${escapeHtml(new Date(`${nextAppointment.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))}
                            </h3>
                            <p style="margin: 4px 0 0 0; font-weight: bold; color: #0d9488; font-size: 14px;">Time Window: ${escapeHtml(nextAppointment.time)}</p>
                        </div>
                        <ul style="color: #475569; font-size: 14px; line-height: 1.8;">
                            <li><strong>Name:</strong> ${escapeHtml(mapped.name)}</li>
                            <li><strong>Address:</strong> ${escapeHtml(mapped.address)}</li>
                            <li><strong>Phone:</strong> ${escapeHtml(mapped.phone ? formatPhone(mapped.phone) : 'Not provided')}</li>
                            <li><strong>Email:</strong> ${escapeHtml(mapped.email)}</li>
                        </ul>
                    </div>
                `;

                await sendEmail({
                    from: getFromAddress('Quotramax Scheduling <inspections@quotramax.com>'),
                    to: contractorEmail,
                    subject: `Confirmed inspection: ${mapped.name} - ${nextAppointment.date}`,
                    html: appointmentHtml,
                });
            });
        }

        return json({ success });
    } catch (error) {
        console.error('Single lead PATCH API error:', error);
        return json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
