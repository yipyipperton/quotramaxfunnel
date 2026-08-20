'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function Results() {
    const { id } = useParams();
    const router = useRouter();
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
                try {
                    const cached = sessionStorage.getItem('qm_lead_' + id) || sessionStorage.getItem('qm_latest_lead');
                    if (cached) {
                        setLead(JSON.parse(cached));
                        setLoading(false);
                        return;
                    }
                } catch (e) {}

                setError('Failed to load inspection confirmation.');
                setLoading(false);
            });
    }, [id]);

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
                <h2 className="text-2xl font-bold text-white mb-2">Error Loading Confirmation</h2>
                <p className="text-sm text-slate-400 mb-6">{error || 'The inspection request could not be found.'}</p>
                <button onClick={() => router.push('/')} className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition-colors">
                    Back to Home
                </button>
            </div>
        );
    }

    const { appointment } = lead;

    return (
        <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
            
            {/* Header */}
            <header className="border-b border-white/5 bg-[#070a13]/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
                        <svg className="w-6 h-6 text-teal-400 filter drop-shadow-[0_0_8px_rgba(20,184,166,0.5)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">QUOTRA<span className="text-teal-400">MAX</span></span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Inspection Reserved
                    </span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">

                {/* Hero Confirmation Banner */}
                <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent border border-teal-500/20 rounded-2xl mb-6 shadow-xl text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                            ✓
                        </div>
                        <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 font-mono">
                                Inspection Request #{id}
                            </span>
                            <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                                You&apos;re All Set, {lead.name.split(' ')[0]}!
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-300 mt-1">
                                A confirmation notice has been dispatched to <strong>{lead.email}</strong>.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleCopyDetails}
                        className="text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 flex-shrink-0">
                        {copied ? '✓ Copied to Clipboard' : '📋 Copy Details'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Left Column: Scheduled Slot & Next Steps */}
                    <div className="md:col-span-7 space-y-6">
                        
                        {/* Appointment Time Box */}
                        <div className="border border-white/10 rounded-2xl bg-[#0d1222]/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                                📅 Confirmed Appointment Slot
                            </span>
                            {appointment && appointment.date ? (
                                <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl space-y-2">
                                    <div className="text-lg sm:text-xl font-extrabold text-white">
                                        {new Date(appointment.date + 'T00:00:00').toLocaleDateString(undefined, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                    <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-300 bg-teal-500/20 px-3 py-1 rounded-lg">
                                        ⏰ {appointment.time}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
                                    Our dispatch team is currently assigning the nearest crew for this week.
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs text-slate-400">
                                <div className="flex items-center justify-between">
                                    <span>Inspecting Property:</span>
                                    <strong className="text-white">{lead.address}</strong>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Primary Phone:</span>
                                    <strong className="text-white">{lead.phone || 'Provided via form'}</strong>
                                </div>
                            </div>
                        </div>

                        {/* What to Expect 3-Step Roadmap */}
                        <div className="border border-white/10 rounded-2xl bg-[#0d1222]/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-4">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                                What Happens Next
                            </h2>

                            <div className="space-y-3">
                                {[
                                    {
                                        step: '1',
                                        title: 'Satellite Roofline Scan Prepared',
                                        desc: 'Our estimator pulls 3D aerial measurements of your roof facets and pitch before arriving.'
                                    },
                                    {
                                        step: '2',
                                        title: 'On-Site 21-Point Physical Check',
                                        desc: 'A certified roofing technician inspects shingles, flashing, drip edges, and attic moisture.'
                                    },
                                    {
                                        step: '3',
                                        title: 'Written Property Report & Options',
                                        desc: 'You receive an itemized condition report, material options, and financing/insurance details.'
                                    }
                                ].map((item) => (
                                    <div key={item.step} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                        <span className="w-6 h-6 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-400 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                                            {item.step}
                                        </span>
                                        <div>
                                            <div className="text-xs font-bold text-white">{item.title}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Pre-Qualification Scope Summary */}
                    <div className="md:col-span-5 space-y-6">
                        <div className="border border-white/10 rounded-2xl bg-[#0d1222]/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                                Project Scope Dossier
                            </h2>

                            <div className="space-y-3 text-xs">
                                <div className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5 flex justify-between items-center">
                                    <span className="text-slate-400">Service Goal:</span>
                                    <span className="font-bold text-white">{lead.service || 'Full Roof Replacement'}</span>
                                </div>
                                <div className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5 flex justify-between items-center">
                                    <span className="text-slate-400">Building Height:</span>
                                    <span className="font-bold text-white">{lead.stories || '1 Story'}</span>
                                </div>
                                <div className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5 flex justify-between items-center">
                                    <span className="text-slate-400">Roof Slope:</span>
                                    <span className="font-bold text-white">{lead.pitch || 'Standard Pitch'}</span>
                                </div>
                                <div className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5 flex justify-between items-center">
                                    <span className="text-slate-400">Preferred Material:</span>
                                    <span className="font-bold text-teal-400">{lead.material || 'Architectural Shingles'}</span>
                                </div>
                                <div className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5 flex justify-between items-center">
                                    <span className="text-slate-400">Timeline:</span>
                                    <span className="font-bold text-amber-400">{lead.timeline || 'Under 1 month'}</span>
                                </div>
                                <div className="p-2.5 bg-white/[0.02] rounded-lg border border-white/5 flex justify-between items-center">
                                    <span className="text-slate-400">Funding Method:</span>
                                    <span className="font-bold text-emerald-400">{lead.insurance || 'Cash / Direct Pay'}</span>
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
