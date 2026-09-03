import { headers } from 'next/headers';
import { getClientConfig, isBookingBlocked } from '@/lib/clients';
import { slugFromHost } from '@/lib/security';
import QuoteFunnel from './quote-funnel';

export const dynamic = 'force-dynamic';

async function resolveClient() {
    const headerList = await headers();
    const slug = slugFromHost(headerList.get('x-forwarded-host') || headerList.get('host') || '');
    return getClientConfig(slug);
}

export async function generateMetadata() {
    const config = await resolveClient();
    if (!config?.companyName) return {};
    return {
        title: `${config.companyName} - Free 21-Point Roof Inspection Booking`,
        description: `Book a free 21-point roof inspection with ${config.companyName}. Pick your arrival window in under a minute.`,
    };
}

function BookingUnavailable() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6 text-center font-sans">
            <div className="max-w-md">
                <h1 className="text-2xl font-heading font-bold text-foreground">This booking page is not active</h1>
                <p className="mt-3 text-base text-foreground-secondary leading-relaxed">
                    Inspections are not being scheduled at this address. Please contact your roofing contractor directly.
                </p>
            </div>
        </div>
    );
}

export default async function Page() {
    const config = await resolveClient();
    if (isBookingBlocked(config)) return <BookingUnavailable />;

    return (
        <QuoteFunnel
            branding={{
                companyName: config?.companyName || '',
                logoUrl: config?.logoUrl || '',
                faqs: config?.faqs || [],
            }}
        />
    );
}
