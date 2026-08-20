'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

function ResultsDetail() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [lead, setLead] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!id) return;

        fetch(`/api/leads/${id}`)
            .then(res => {
                if (!res.ok) throw new Error('Inspection request not found');
                return res.json();
            })
            .then(leadData => {
                setLead(leadData);
                setLoading(false);
            })
            .catch(err => {
                console.warn('API fetch note:', err.message);
                
                // 1. Check Session Storage
                try {
                    const cached = sessionStorage.getItem('qm_lead_' + id) || sessionStorage.getItem('qm_latest_lead');
                    if (cached) {
                        setLead(JSON.parse(cached));
                        setLoading(false);
                        return;
                    }
                } catch (e) {}

                // 2. Check URL Search Params Fallback
                if (searchParams && (searchParams.get('name') || searchParams.get('address'))) {
                    setLead({
                        id,
                        name: searchParams.get('name') || 'Homeowner',
                        address: searchParams.get('address') || 'Property Location',
                        phone: searchParams.get('phone') || '',
                        email: searchParams.get('email') || '',
                        service: searchParams.get('service') || 'Full Roof Replacement',
                        material: searchParams.get('material') || 'Architectural Shingles',
                        appointment: {
                            date: searchParams.get('date') || '',
                            time: searchParams.get('time') || 'Morning (8:00 AM - 11:00 AM)'
                        }
                    });
                    setLoading(false);
                    return;
                }

                setError('Failed to load inspection confirmation.');
                setLoading(false);
            });
    }, [id, searchParams]);

    const handleCopyDetails = () => {
        if (!lead) return;
        const text = `Roof Inspection Confirmation:
Address: ${lead.address}
Contact: ${lead.name} (${lead.phone})
Service: ${lead.service || 'Full Roof Replacement'}
Date: ${lead.appointment?.date || 'Pending'} (${lead.appointment?.time || 'Pending'})`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Loading Your Inspection Confirmation...</span>
                </div>
            </div>
        );
    }

    if (error || !lead) {
        return (
            <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col items-center justify-center font-sans px-6 text-center">
                <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mb-4 text-rose-400 text-2xl font-bold">
                    ⚠️
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Error Loading Confirmation</h2>
                <p className="text-sm text-slate-400 mb-6">{error || 'The inspection request could not be found.'}</p>
                <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-teal-500/20">
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
        <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
            {/* Header */}
            <header className="border-b border-white/5 bg-[#070a13]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                        <svg className="w-6 h-6 text-teal-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                            QUOTRAMAX
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleCopyDetails}
                        className="px-3.5 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-slate-300 rounded-lg transition-all flex items-center gap-1.5">
                        {copied ? '✓ Copied!' : '📋 Copy Details'}
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
                
                {/* Hero Confirmation Card */}
                <div className="border border-teal-500/30 bg-gradient-to-b from-teal-500/10 via-[#0d1222]/90 to-[#0d1222] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden mb-8">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/10 rounded-full filter blur-3xl pointer-events-none"></div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left relative z-10">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-teal-500/20 border-2 border-teal-400 rounded-2xl flex items-center justify-center flex-shrink-0 text-3xl shadow-lg shadow-teal-500/30">
                            🎉
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full text-xs font-bold text-teal-300 mb-2 uppercase tracking-wider">
                                ✓ Inspection Dossier Confirmed
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                                Priority Inspection Reserved
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl leading-relaxed">
                                Great news, <span className="text-white font-bold">{lead.name}</span>! Your property coordinates have been assigned to a certified inspection crew.
                            </p>
                        </div>
                    </div>

                    {/* Appointment Box */}
                    {formattedDate ? (
                        <div className="mt-8 p-5 bg-[#070a13]/80 border border-teal-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">📅</div>
                                <div>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400">Scheduled Appointment Date</div>
                                    <div className="text-sm sm:text-base font-bold text-white">{formattedDate}</div>
                                </div>
                            </div>
                            <div className="px-4 py-2 bg-teal-500/20 border border-teal-500/30 rounded-xl text-center sm:text-right">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Time Window</div>
                                <div className="text-xs sm:text-sm font-bold text-teal-300">{lead.appointment.time}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 font-medium">
                            ⏱️ Instant Dispatch: A crew manager is matching an open slot in your area.
                        </div>
                    )}
                </div>

                {/* 2-Column Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Left Column: 3-Step Action Roadmap */}
                    <div className="md:col-span-7 space-y-6">
                        <div className="border border-white/10 rounded-2xl bg-[#0d1222]/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5 flex items-center gap-2">
                                <span>🗺️</span> What Happens Next (Roadmap)
                            </h2>

                            <div className="space-y-4">
                                {[
                                    {
                                        step: '01',
                                        title: 'Aerial & Satellite Measurement Scan',
                                        desc: 'Our high-resolution satellite imagery engine calculates roof surface area, pitch angles, and valley lengths before our arrival.',
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
                                    <div key={idx} className="flex gap-4 p-3.5 bg-white/[0.02] border border-white/5 rounded-xl">
                                        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                            {item.step}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-xs font-bold text-white">{item.title}</h3>
                                                <span className="text-[10px] px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded-full font-semibold">{item.status}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pre-Qualification Scope Dossier */}
                    <div className="md:col-span-5 space-y-6">
                        <div className="border border-white/10 rounded-2xl bg-[#0d1222]/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                                Property Scope Dossier
                            </h2>

                            <div className="space-y-2.5 text-xs">
                                <div className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5 flex justify-between items-center">
                                    <span className="text-slate-400">Property:</span>
                                    <span className="font-bold text-white truncate max-w-[180px]">{lead.address}</span>
                                </div>
                                <div className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5 flex justify-between items-center">
                                    <span className="text-slate-400">Service Goal:</span>
                                    <span className="font-bold text-white">{lead.service || 'Full Roof Replacement'}</span>
                                </div>
                                <div className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5 flex justify-between items-center">
                                    <span className="text-slate-400">Preferred Material:</span>
                                    <span className="font-bold text-teal-400">{lead.material || 'Architectural Shingles'}</span>
                                </div>
                                <div className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5 flex justify-between items-center">
                                    <span className="text-slate-400">Timeline:</span>
                                    <span className="font-bold text-amber-400">{lead.timeline || 'Under 1 month'}</span>
                                </div>
                            </div>

                            <div className="mt-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                <span className="text-emerald-400 font-bold text-xs block mb-1">
                                    🛡️ 100% Free &amp; Zero Obligation
                                </span>
                                <p className="text-[11px] text-slate-300 leading-snug">
                                    Your inspection is guaranteed free of charge with no purchase required.
                                </p>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="text-xs text-slate-400 hover:text-white transition-colors">
                                ← Submit Another Property
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-4 text-center text-[11px] text-slate-500">
                &copy; 2026 Quotramax Conversion System. High-Intent Lead Qualification &amp; Booking.
            </footer>
        </div>
    );
}

export default function Results() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Loading Inspection Dossier...</span>
                </div>
            </div>
        }>
            <ResultsDetail />
        </Suspense>
    );
}
