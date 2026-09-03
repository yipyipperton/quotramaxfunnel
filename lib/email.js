import { Resend } from 'resend';

const DEFAULT_FROM = 'Quotramax Inspections <inspections@quotramax.com>';

function relabelFromAddress(value) {
    return String(value ?? '')
        .replace(/leads@quotramax\.com/gi, 'inspections@quotramax.com')
        .replace(/Quotramax Inspection Team/gi, 'Quotramax Inspections');
}

export function getFromAddress(fallback = DEFAULT_FROM) {
    return relabelFromAddress(process.env.FROM_EMAIL || fallback);
}

export async function sendEmail({ to, subject, html, from, bcc }) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
        console.error('RESEND_API_KEY is not configured; skipping email send');
        return false;
    }
    if (!to) return false;

    try {
        const client = new Resend(key);
        const payload = {
            from: from || getFromAddress(),
            to,
            subject,
            html,
        };
        if (bcc) payload.bcc = bcc;

        const { data, error } = await client.emails.send(payload);
        if (error) {
            console.error('Resend send error:', error);
            return false;
        }
        return Boolean(data?.id || !error);
    } catch (error) {
        console.error('Resend send exception:', error);
        return false;
    }
}
