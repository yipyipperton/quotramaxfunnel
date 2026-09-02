'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, Calendar, Check, ClipboardCopy, Home, Map, PartyPopper, Shield } from 'lucide-react';

function ResultsDetail() {
    const { id } = useParams();
    const router = useRouter();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

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
Contact: ${lead.name} (${lead.phone || 'on file'})
Service: ${lead.service || 'Full Roof Replacement'}
Date: ${lead.appointment?.date || 'Pending'} (${lead.appointment?.time || 'Pending'})`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-muted-foreground">Loading Your Inspection Confirmation...</span>
                </div>
            </div>
        );
    }

    if (error || !lead) {
        return (
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center font-sans px-6 text-center">
                <div className="w-16 h-16 bg-destructive/10 border border-destructive/20 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-7 h-7 text-destructive" aria-hidden="true" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Error Loading Confirmation</h2>
                <p className="text-sm text-muted-foreground mb-6">{error || 'The inspection request could not be found.'}</p>
                <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="min-h-11 px-6 py-3 bg-accent hover:brightness-105 text-accent-foreground font-semibold rounded-xl text-sm transition duration-150 shadow-sm">
                    Return to Funnel Home
                </button>
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
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-accent/20">
            <header className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <Home className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
                        </div>
                        <span className="font-heading font-bold text-lg sm:text-xl tracking-tight text-foreground">
                            QUOTRAMAX
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopyDetails}
                        className="min-h-11 px-3.5 py-1.5 bg-card border border-border hover:shadow-sm text-xs font-semibold text-foreground rounded-lg transition duration-150 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-ring">
                        {copied ? (
                            <>
                                <Check className="w-3.5 h-3.5 text-accent" aria-hidden="true" /> Copied!
                            </>
                        ) : (
                            <>
                                <ClipboardCopy className="w-3.5 h-3.5" aria-hidden="true" /> Copy Details
                            </>
                        )}
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="border border-border bg-card rounded-2xl p-6 sm:p-10 shadow-card relative overflow-hidden mb-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-accent/10 border border-accent/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                            <PartyPopper className="w-8 h-8 text-accent" aria-hidden="true" />
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full text-xs font-bold text-accent mb-2 uppercase tracking-wider">
                                <Check className="w-3.5 h-3.5" aria-hidden="true" /> Inspection Dossier Confirmed
                            </div>
                            <h1 className="font-heading text-2xl sm:text-4xl font-bold text-foreground tracking-tight">
                                Priority Inspection Reserved
                            </h1>
                            <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
                                Great news, <span className="text-foreground font-bold">{lead.name}</span>! Your property coordinates have been assigned to a certified inspection crew.
                            </p>
                        </div>
                    </div>

                    {formattedDate ? (
                        <div className="mt-8 p-5 bg-muted border border-border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-6 h-6 text-accent" aria-hidden="true" />
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-accent">Scheduled Appointment Date</div>
                                    <div className="text-sm sm:text-base font-bold text-foreground">{formattedDate}</div>
                                </div>
                            </div>
                            <div className="px-4 py-2 bg-card border border-border rounded-xl text-center sm:text-right">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Time Window</div>
                                <div className="text-xs sm:text-sm font-bold text-foreground">{lead.appointment.time}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 p-4 bg-muted border border-border rounded-xl text-sm text-muted-foreground font-medium">
                            Instant Dispatch: A crew manager is matching an open slot in your area.
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-7 space-y-6">
                        <div className="border border-border rounded-2xl bg-card p-5 sm:p-6 shadow-card">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5 flex items-center gap-2">
                                <Map className="w-4 h-4 text-accent" aria-hidden="true" /> What Happens Next (Roadmap)
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
                                        title: 'Technician Text & Phone Confirmation',
                                        desc: `A licensed technician will call or text ${lead.phone || 'your phone'} 30 minutes prior to arrival to confirm property access.`,
                                        status: 'Pending Tech Dispatch'
                                    },
                                    {
                                        step: '03',
                                        title: '21-Point On-Site Inspection & Written Report',
                                        desc: 'We perform a full leak, shingle granular loss, attic ventilation, and decking assessment, providing a physical report on-site.',
                                        status: 'On Day of Inspection'
                                    }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4 p-3.5 bg-muted border border-border rounded-xl">
                                        <div className="w-8 h-8 rounded-lg bg-card border border-border text-primary font-bold text-xs flex items-center justify-center flex-shrink-0">
                                            {item.step}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-xs font-bold text-foreground">{item.title}</h3>
                                                <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded-full font-semibold">{item.status}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-5 space-y-6">
                        <div className="border border-border rounded-2xl bg-card p-5 sm:p-6 shadow-card">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                                Property Scope Dossier
                            </h2>

                            <div className="space-y-2.5 text-sm">
                                <div className="p-2.5 bg-muted rounded-lg border border-border flex justify-between items-center gap-2">
                                    <span className="text-muted-foreground">Property:</span>
                                    <span className="font-bold text-foreground truncate max-w-[180px]">{lead.address}</span>
                                </div>
                                <div className="p-2.5 bg-muted rounded-lg border border-border flex justify-between items-center gap-2">
                                    <span className="text-muted-foreground">Service Goal:</span>
                                    <span className="font-bold text-foreground">{lead.service || 'Full Roof Replacement'}</span>
                                </div>
                                <div className="p-2.5 bg-muted rounded-lg border border-border flex justify-between items-center gap-2">
                                    <span className="text-muted-foreground">Preferred Material:</span>
                                    <span className="font-bold text-accent">{lead.material || 'Architectural Shingles'}</span>
                                </div>
                                <div className="p-2.5 bg-muted rounded-lg border border-border flex justify-between items-center gap-2">
                                    <span className="text-muted-foreground">Timeline:</span>
                                    <span className="font-bold text-foreground">{lead.timeline || 'Under 1 month'}</span>
                                </div>
                            </div>

                            <div className="mt-5 p-3.5 bg-accent/10 border border-accent/20 rounded-xl text-center">
                                <span className="text-accent font-bold text-xs mb-1 flex items-center justify-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5" aria-hidden="true" /> 100% Free &amp; Zero Obligation
                                </span>
                                <p className="text-sm text-muted-foreground leading-snug mt-1">
                                    Your inspection is guaranteed free of charge with no purchase required.
                                </p>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="text-sm text-muted-foreground hover:text-foreground transition-colors min-h-11">
                                ← Submit Another Property
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-border py-4 text-center text-[11px] text-muted-foreground">
                &copy; 2026 Quotramax Conversion System. High-Intent Lead Qualification &amp; Booking.
            </footer>
        </div>
    );
}

export default function Results() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-muted-foreground">Loading Inspection Dossier...</span>
                </div>
            </div>
        }>
            <ResultsDetail />
        </Suspense>
    );
}
