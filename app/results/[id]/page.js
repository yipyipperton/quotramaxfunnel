'use client';

import { useState, useEffect, useLayoutEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Check, ClipboardCopy, House, Map, PartyPopper, Shield, TriangleAlert } from 'lucide-react';
import { readPendingConfirmation } from '@/lib/confirmation-cache';
import { formatPhone } from '@/lib/format';

function Backdrop() {
    return (
        <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[url('/roof-hero.webp')] bg-cover bg-center opacity-70" />
            <div className="absolute inset-0 bg-gradient-to-b from-background-alt/40 via-background-alt/60 to-background-alt/90" />
            <div className="absolute inset-0 backdrop-vignette" />
        </div>
    );
}

function ResultsDetail() {
    const { id } = useParams();
    const router = useRouter();
    const initialConfirmation = readPendingConfirmation(id);
    const [lead, setLead] = useState(initialConfirmation);
    const [loading, setLoading] = useState(!initialConfirmation);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useLayoutEffect(() => {
        if (!id) return;
        try {
            const cached = sessionStorage.getItem('qm_lead_' + id);
            if (cached) {
                setLead(JSON.parse(cached));
                setLoading(false);
            }
        } catch (e) {}
    }, [id]);

    useEffect(() => {
        if (!id) return;

        const token = (() => {
            try {
                return sessionStorage.getItem('qm_access_' + id) || '';
            } catch (e) {
                return '';
            }
        })();

        const headers = { Accept: 'application/json' };
        if (token) headers.Authorization = 'Bearer ' + token;

        fetch(`/api/leads/${encodeURIComponent(id)}`, {
            headers,
            credentials: 'include',
            cache: 'no-store'
        })
            .then(res => {
                if (res.status === 401) throw new Error('unauthorized');
                if (!res.ok) throw new Error('Inspection request not found');
                return res.json();
            })
            .then(leadData => {
                setLead(leadData);
                setLoading(false);
            })
            .catch(err => {
                try {
                    const cached = sessionStorage.getItem('qm_lead_' + id);
                    if (cached && err.message !== 'unauthorized') {
                        setLead(JSON.parse(cached));
                        setLoading(false);
                        return;
                    }
                } catch (e) {}

                setError(
                    err.message === 'unauthorized'
                        ? 'This confirmation link is private. Please submit the form again to view your inspection details.'
                        : 'Failed to load inspection confirmation.'
                );
                setLoading(false);
            });
    }, [id]);

    const handleCopyDetails = () => {
        if (!lead) return;
        const text = `Roof Inspection Confirmation:
Address: ${lead.address}
Contact: ${lead.name} (${lead.phone ? formatPhone(lead.phone) : 'on file'})
Service: ${lead.service || 'Full Roof Replacement'}
Date: ${lead.appointment?.date || 'Pending'} (${lead.appointment?.time || 'Pending'})`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="relative min-h-screen text-foreground flex flex-col items-center justify-center font-sans">
                <Backdrop />
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-accent border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-base font-medium text-foreground-secondary">Loading Your Inspection Confirmation...</span>
                </div>
            </div>
        );
    }

    if (error || !lead) {
        return (
            <div className="relative min-h-screen text-foreground flex flex-col items-center justify-center font-sans px-6 text-center">
                <Backdrop />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-danger-tint border border-danger/20 rounded-full flex items-center justify-center mb-4">
                        <TriangleAlert className="w-7 h-7 text-danger" aria-hidden="true" />
                    </div>
                    <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Error Loading Confirmation</h2>
                    <p className="text-base text-foreground-secondary mb-6">{error || 'The inspection request could not be found.'}</p>
                    <button
                        type="button"
                        onClick={() => router.push('/')}
                        className="min-h-[44px] px-6 py-3 bg-primary hover:bg-primary-hover text-primary-fg font-semibold rounded-xl text-lg transition-all duration-200 ease-out shadow-button focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background-alt">
                        Return to Funnel Home
                    </button>
                </div>
            </div>
        );
    }

    const formattedDate = lead.appointment?.date
        ? new Date(lead.appointment.date + 'T00:00:00').toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
          })
        : null;

    return (
        <div className="relative min-h-screen text-foreground flex flex-col font-sans selection:bg-primary-tint">
            <Backdrop />

            <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap justify-between items-center gap-x-3 gap-y-2">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                        <div className="w-8 h-8 rounded-lg bg-primary-tint border border-border flex items-center justify-center">
                            <House className="w-4 h-4 text-primary-accent" aria-hidden="true" />
                        </div>
                        <span className="font-heading font-semibold text-lg sm:text-xl tracking-tight text-foreground">
                            QUOTRAMAX
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopyDetails}
                        className="min-h-[44px] px-4 py-2 bg-background border border-border hover:shadow-card text-base font-medium text-foreground rounded-xl transition-all duration-200 ease-out flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-ring">
                        {copied ? (
                            <>
                                <Check className="w-5 h-5 text-accent" aria-hidden="true" /> Copied!
                            </>
                        ) : (
                            <>
                                <ClipboardCopy className="w-5 h-5" aria-hidden="true" /> Copy Details
                            </>
                        )}
                    </button>
                </div>
            </header>

            <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-12">
                <div className="border border-border bg-background rounded-2xl p-6 sm:p-10 shadow-card relative overflow-hidden mb-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-tint border border-border rounded-2xl flex items-center justify-center flex-shrink-0">
                            <PartyPopper className="w-8 h-8 text-primary-accent" aria-hidden="true" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-tint border border-border rounded-full text-sm font-semibold text-primary-accent mb-2">
                                <Check className="w-4 h-4" aria-hidden="true" /> Inspection Dossier Confirmed
                            </div>
                            <h1 className="font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
                                Priority Inspection Reserved
                            </h1>
                            <p className="text-lg text-foreground-secondary mt-2 max-w-xl leading-relaxed">
                                Great news, <span className="text-foreground font-semibold">{lead.name}</span>! Your property coordinates have been assigned to a certified inspection crew.
                            </p>
                        </div>
                    </div>

                    {formattedDate ? (
                        <div className="mt-8 p-5 bg-muted border border-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-primary-accent" aria-hidden="true" />
                                <div>
                                    <div className="text-sm font-medium text-primary-accent">Scheduled Appointment Date</div>
                                    <div className="text-lg font-semibold text-foreground">{formattedDate}</div>
                                </div>
                            </div>
                            <div className="px-4 py-2 bg-background border border-border rounded-xl text-center sm:text-right">
                                <div className="text-sm font-medium text-foreground-tertiary">Time Window</div>
                                <div className="text-base font-semibold text-foreground">{lead.appointment.time}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 p-4 bg-muted border border-border rounded-xl text-base text-foreground-secondary font-medium">
                            Instant Dispatch: A crew manager is matching an open slot in your area.
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-7 space-y-6">
                        <div className="border border-border rounded-2xl bg-background p-5 sm:p-6 shadow-card">
                            <h2 className="text-base font-medium text-foreground-secondary mb-5 flex items-center gap-2">
                                <Map className="w-5 h-5 text-primary-accent" aria-hidden="true" /> What Happens Next (Roadmap)
                            </h2>

                            <div className="space-y-4">
                                {[
                                    {
                                        step: '01',
                                        title: '21-Point Inspection Preparation',
                                        desc: 'Our local team reviews your property address, building specs, and material requirements to prepare an itemized inspection checklist.',
                                        status: 'In Progress'
                                    },
                                    {
                                        step: '02',
                                        title: 'Technician Phone Confirmation',
                                        desc: `A licensed technician will call ${lead.phone ? formatPhone(lead.phone) : 'your phone'} 30 minutes prior to arrival to confirm property access.`,
                                        status: 'Pending Tech Dispatch'
                                    },
                                    {
                                        step: '03',
                                        title: '21-Point On-Site Inspection & Written Report',
                                        desc: 'We perform a full leak, shingle granular loss, attic ventilation, and decking assessment, providing a physical report on-site.',
                                        status: 'On Day of Inspection'
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4 p-4 bg-muted border border-border rounded-2xl">
                                        <div className="w-8 h-8 rounded-lg bg-background border border-border text-primary-accent font-semibold text-sm flex items-center justify-center flex-shrink-0">
                                            {item.step}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-base sm:text-lg font-semibold text-foreground">{item.title}</h3>
                                                <span className="text-sm px-2 py-0.5 bg-primary-tint text-primary-accent rounded-full font-medium">{item.status}</span>
                                            </div>
                                            <p className="text-base text-foreground-secondary mt-1 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-5 space-y-6">
                        <div className="border border-border rounded-2xl bg-background p-5 sm:p-6 shadow-card">
                            <h2 className="text-base font-medium text-foreground-secondary mb-4">
                                Property Scope Dossier
                            </h2>

                            <div className="space-y-3 text-base">
                                <div className="p-3 bg-muted rounded-xl border border-border flex justify-between items-center gap-2">
                                    <span className="text-foreground-secondary">Property:</span>
                                    <span className="font-semibold text-foreground truncate max-w-[180px]">{lead.address}</span>
                                </div>
                                <div className="p-3 bg-muted rounded-xl border border-border flex justify-between items-center gap-2">
                                    <span className="text-foreground-secondary">Service Goal:</span>
                                    <span className="font-semibold text-foreground">{lead.service || 'Full Roof Replacement'}</span>
                                </div>
                                <div className="p-3 bg-muted rounded-xl border border-border flex justify-between items-center gap-2">
                                    <span className="text-foreground-secondary">Preferred Material:</span>
                                    <span className="font-semibold text-primary-accent">{lead.material || 'Architectural Shingles'}</span>
                                </div>
                                <div className="p-3 bg-muted rounded-xl border border-border flex justify-between items-center gap-2">
                                    <span className="text-foreground-secondary">Timeline:</span>
                                    <span className="font-semibold text-foreground">{lead.timeline || 'Under 1 month'}</span>
                                </div>
                            </div>

                            <div className="mt-5 p-4 bg-primary-tint border border-border rounded-2xl text-center">
                                <span className="text-primary-accent font-semibold text-base mb-1 flex items-center justify-center gap-1.5">
                                    <Shield className="w-5 h-5" aria-hidden="true" /> 100% Free &amp; Zero Obligation
                                </span>
                                <p className="text-base text-foreground-secondary leading-snug mt-1">
                                    Your inspection is guaranteed free of charge with no purchase required.
                                </p>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="text-base text-foreground-secondary hover:text-foreground transition-colors min-h-[44px] px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-ring">
                                ← Submit Another Property
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="relative z-10 border-t border-border py-6 text-center text-sm text-foreground-tertiary">
                &copy; 2026 Quotramax Conversion System. High-Intent Lead Qualification &amp; Booking.
            </footer>
        </div>
    );
}

export default function Results() {
    return (
        <Suspense fallback={
            <div className="relative min-h-screen text-foreground flex flex-col items-center justify-center font-sans">
                <Backdrop />
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary-accent border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-base font-medium text-foreground-secondary">Loading Inspection Dossier...</span>
                </div>
            </div>
        }>
            <ResultsDetail />
        </Suspense>
    );
}
