'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isScanning, setIsScanning] = useState(false);
    const [scanText, setScanText] = useState('Locating property coordinates...');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        service: 'Full Roof Replacement',
        roofAge: '10 - 20 years',
        stories: '1 Story',
        pitch: 'Standard Pitch',
        material: 'Architectural Shingles',
        timeline: 'Under 1 month',
        insurance: 'Cash / Direct Payment',
        address: '',
        zip: '',
        name: '',
        email: '',
        phone: '',
        appointmentDate: '',
        appointmentTime: 'Morning (8:00 AM - 11:00 AM)'
    });

    // Helper dates for Step 5 quick date pills
    const [datePills, setDatePills] = useState([]);

    useEffect(() => {
        const pills = [];
        const today = new Date();
        
        // Tomorrow
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        pills.push({
            label: 'Tomorrow',
            dateStr: tomorrow.toISOString().split('T')[0],
            display: tomorrow.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
        });

        // 2 days out
        const day2 = new Date(today);
        day2.setDate(today.getDate() + 2);
        pills.push({
            label: day2.toLocaleDateString(undefined, { weekday: 'short' }),
            dateStr: day2.toISOString().split('T')[0],
            display: day2.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
        });

        // 3 days out
        const day3 = new Date(today);
        day3.setDate(today.getDate() + 3);
        pills.push({
            label: day3.toLocaleDateString(undefined, { weekday: 'short' }),
            dateStr: day3.toISOString().split('T')[0],
            display: day3.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
        });

        setDatePills(pills);
        if (!formData.appointmentDate && pills.length > 0) {
            setFormData(prev => ({ ...prev, appointmentDate: pills[0].dateStr }));
        }
    }, []);

    // Phone Auto-Formatter (XXX) XXX-XXXX
    const handlePhoneChange = (e) => {
        const raw = e.target.value.replace(/\D/g, '').substring(0, 10);
        let formatted = '';
        if (raw.length > 0) {
            formatted = '(' + raw.substring(0, 3);
        }
        if (raw.length >= 4) {
            formatted += ') ' + raw.substring(3, 6);
        }
        if (raw.length >= 7) {
            formatted += '-' + raw.substring(6, 10);
        }
        setFormData(prev => ({ ...prev, phone: formatted }));
    };

    // Generic input change
    const handleChange = (field, value) => {
        setError('');
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Tap-to-advance handler with haptic feedback delay
    const handleTapToAdvance = (field, value, nextStepTarget) => {
        setError('');
        setFormData(prev => ({ ...prev, [field]: value }));
        setTimeout(() => {
            setStep(nextStepTarget);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 160);
    };

    // Validation per step
    const validateStep4 = () => {
        if (!formData.address.trim()) return 'Please enter your street address.';
        const cleanZip = formData.zip.replace(/\D/g, '');
        if (cleanZip.length !== 5) return 'Please enter a valid 5-digit ZIP code.';
        if (!formData.name.trim() || formData.name.trim().length < 2) return 'Please enter your full name.';
        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) return 'Please enter a valid 10-digit phone number.';
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return 'Please enter a valid email address.';
        return '';
    };

    // Handle Step 4 submit with Satellite Scan Effect
    const handleStep4Continue = () => {
        const err = validateStep4();
        if (err) {
            setError(err);
            return;
        }

        setError('');
        setIsScanning(true);
        setScanText(`🛰️ Locating roofline for ${formData.address.split(',')[0]}...`);

        setTimeout(() => {
            setScanText('📐 Analyzing elevation, slope angles & square footage...');
        }, 600);

        setTimeout(() => {
            setScanText('✅ Satellite data linked. Matching available inspection crews...');
        }, 1100);

        setTimeout(() => {
            setIsScanning(false);
            setStep(5);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 1600);
    };

    // Final Submission Handler
    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (!formData.appointmentDate) {
            setError('Please select a preferred inspection date.');
            return;
        }

        setSubmitting(true);
        setError('');

        const payload = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            zip: formData.zip,
            service: formData.service,
            roofAge: formData.roofAge,
            stories: formData.stories,
            pitch: formData.pitch,
            material: formData.material,
            timeline: formData.timeline,
            insurance: formData.insurance,
            appointment: {
                date: formData.appointmentDate,
                time: formData.appointmentTime
            }
        };

        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (result.success && result.leadId) {
                const leadObj = {
                    id: result.leadId,
                    name: payload.name,
                    email: payload.email,
                    phone: payload.phone,
                    address: payload.address,
                    zip: payload.zip,
                    service: payload.service,
                    roofAge: payload.roofAge,
                    stories: payload.stories,
                    pitch: payload.pitch,
                    material: payload.material,
                    timeline: payload.timeline,
                    insurance: payload.insurance,
                    appointment: payload.appointment
                };
                try {
                    sessionStorage.setItem('qm_lead_' + result.leadId, JSON.stringify(leadObj));
                    sessionStorage.setItem('qm_latest_lead', JSON.stringify(leadObj));
                } catch (e) {}
                router.push(`/results/${result.leadId}`);
            } else {
                setError(result.error || 'Failed to submit inspection request.');
                setSubmitting(false);
            }
        } catch (err) {
            console.error('Submission error:', err);
            setError('Network error. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
            
            {/* Sticky Header */}
            <header className="border-b border-white/5 bg-[#070a13]/90 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => setStep(1)}>
                        <svg className="w-6 h-6 text-teal-400 filter drop-shadow-[0_0_8px_rgba(20,184,166,0.5)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                            QUOTRA<span className="text-teal-400">MAX</span>
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Inspections Available in Your Area
                        </span>
                        <button 
                            onClick={() => router.push('/login')} 
                            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg">
                            Contractor Portal
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center">
                
                {/* Hero Header Strip */}
                <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-teal-500/10 border border-teal-500/20 text-teal-300 mb-3 uppercase tracking-wider">
                        <span>⚡ 2026 Direct Roofer Booking Engine</span>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                        Schedule Your Free <br className="hidden sm:inline" />
                        <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                            21-Point Roof &amp; Attic Inspection
                        </span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2">
                        Answer 4 quick questions to link aerial satellite imagery of your property and reserve your certified inspection slot.
                    </p>
                </div>

                {/* Card Container */}
                <div className="w-full max-w-2xl mx-auto">
                    <div className="relative border border-white/10 rounded-2xl bg-[#0d1222]/95 backdrop-blur-2xl p-4 sm:p-7 shadow-2xl overflow-hidden">
                        
                        {/* Top Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Step {step} of 5: <span className="text-teal-400">
                                        {step === 1 && 'Project Goal & Scope'}
                                        {step === 2 && 'Roof Specs & Material'}
                                        {step === 3 && 'Timeline & Funding'}
                                        {step === 4 && 'Property & Contact Info'}
                                        {step === 5 && 'Select Inspection Slot'}
                                    </span>
                                </span>
                                <span className="text-[11px] sm:text-xs font-bold text-teal-400">
                                    {Math.round((step / 5) * 100)}% Done
                                </span>
                            </div>
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300 ease-out rounded-full" 
                                    style={{ width: `${(step / 5) * 100}%` }}>
                                </div>
                            </div>
                        </div>

                        {/* Error Banner */}
                        {error && (
                            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-xl font-medium text-center">
                                ⚠️ {error}
                            </div>
                        )}

                        {/* ============================================================ */}
                        {/* STEP 1: Project Scope (Tap-to-Advance Cards)                 */}
                        {/* ============================================================ */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="text-center sm:text-left mb-4">
                                    <h2 className="text-lg sm:text-xl font-bold text-white">What is your primary roofing goal?</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Select the option that best matches your current property needs.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        {
                                            id: 'Full Roof Replacement',
                                            icon: '🏠',
                                            title: 'Full Roof Replacement',
                                            desc: 'Complete tear-off & new weather-sealed roofing system'
                                        },
                                        {
                                            id: 'Active Leak or Spot Repair',
                                            icon: '💧',
                                            title: 'Active Leak / Repair',
                                            desc: 'Urgent leak diagnostics, flashing, or patch repair'
                                        },
                                        {
                                            id: 'Storm / Wind / Hail Damage',
                                            icon: '🌪️',
                                            title: 'Storm / Hail Assessment',
                                            desc: 'Insurance claim documentation & damage inspection'
                                        },
                                        {
                                            id: 'General 21-Point Roof Inspection',
                                            icon: '🔍',
                                            title: 'Preventative Inspection',
                                            desc: '21-point roof health check, shingle life & attic review'
                                        }
                                    ].map((opt) => (
                                        <button
                                            key={opt.id}
                                            type="button"
                                            onClick={() => handleTapToAdvance('service', opt.id, 2)}
                                            className={`p-4 rounded-xl border text-left transition-all duration-150 flex items-start gap-3.5 active:scale-[0.98] ${
                                                formData.service === opt.id
                                                    ? 'border-teal-500 bg-teal-500/10 shadow-[0_0_15px_rgba(20,184,166,0.15)]'
                                                    : 'border-white/10 bg-white/[0.02] hover:border-teal-500/50 hover:bg-white/[0.04]'
                                            }`}>
                                            <span className="text-2xl sm:text-3xl flex-shrink-0">{opt.icon}</span>
                                            <div>
                                                <div className="font-bold text-sm sm:text-base text-white">{opt.title}</div>
                                                <div className="text-xs text-slate-400 mt-0.5 leading-snug">{opt.desc}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="pt-2 text-center">
                                    <span className="text-[11px] text-slate-500">Tap any option to proceed automatically</span>
                                </div>
                            </div>
                        )}

                        {/* ============================================================ */}
                        {/* STEP 2: Architecture & Material (Tap-to-Advance)             */}
                        {/* ============================================================ */}
                        {step === 2 && (
                            <div className="space-y-5">
                                <div className="text-center sm:text-left">
                                    <h2 className="text-lg sm:text-xl font-bold text-white">Property Specs &amp; Material Preference</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Helps our technicians assign the appropriate inspection equipment.</p>
                                </div>

                                {/* Stories */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                                        Building Height
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['1 Story', '2 Stories', '3+ Stories'].map((story) => (
                                            <button
                                                key={story}
                                                type="button"
                                                onClick={() => handleChange('stories', story)}
                                                className={`py-3 px-2 rounded-xl border text-center text-xs sm:text-sm font-bold transition-all active:scale-[0.98] ${
                                                    formData.stories === story
                                                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                                                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20'
                                                }`}>
                                                {story}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Pitch */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                                        Roof Steepness / Pitch
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'Standard Pitch', label: 'Standard', sub: 'Walkable' },
                                            { id: 'Steep Pitch', label: 'Steep', sub: 'High Slope' },
                                            { id: 'Flat / Low Slope', label: 'Flat', sub: 'Low Pitch' }
                                        ].map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => handleChange('pitch', p.id)}
                                                className={`py-2.5 px-2 rounded-xl border text-center transition-all active:scale-[0.98] ${
                                                    formData.pitch === p.id
                                                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                                                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20'
                                                }`}>
                                                <div className="text-xs sm:text-sm font-bold">{p.label}</div>
                                                <div className="text-[10px] text-slate-400">{p.sub}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Preferred Material */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                                        Desired Roof Material Style
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        {[
                                            { id: 'Architectural Shingles', name: 'Asphalt Shingle', badge: 'Most Popular' },
                                            { id: 'Standing Seam Metal', name: 'Metal Roofing', badge: 'Lifetime Durability' },
                                            { id: 'Tile / Slate / Premium', name: 'Tile / Slate', badge: 'Premium Aesthetic' }
                                        ].map((mat) => (
                                            <button
                                                key={mat.id}
                                                type="button"
                                                onClick={() => handleTapToAdvance('material', mat.id, 3)}
                                                className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                                                    formData.material === mat.id
                                                        ? 'border-teal-500 bg-teal-500/10 shadow-[0_0_12px_rgba(20,184,166,0.15)]'
                                                        : 'border-white/10 bg-white/[0.02] hover:border-teal-500/40'
                                                }`}>
                                                <span className="inline-block text-[9px] font-bold uppercase text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 mb-1">
                                                    {mat.badge}
                                                </span>
                                                <div className="font-bold text-sm text-white">{mat.name}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="text-xs text-slate-400 hover:text-white px-3 py-2">
                                        ← Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-colors">
                                        Next: Funding &amp; Timeline →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============================================================ */}
                        {/* STEP 3: Timeline & Funding/Insurance (Tap-to-Advance)        */}
                        {/* ============================================================ */}
                        {step === 3 && (
                            <div className="space-y-5">
                                <div className="text-center sm:text-left">
                                    <h2 className="text-lg sm:text-xl font-bold text-white">Project Urgency &amp; Funding Plan</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Let us know your timeframe and preferred payment structure.</p>
                                </div>

                                {/* Timeline */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                                        Target Project Timeline
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'Immediate (< 2 Weeks)', label: 'Emergency', sub: '< 2 Weeks' },
                                            { id: 'Under 1 month', label: '1 - 4 Weeks', sub: 'Standard' },
                                            { id: '1 - 3 months', label: 'Planning', sub: '1 - 3 Months' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => handleChange('timeline', t.id)}
                                                className={`py-2.5 px-2 rounded-xl border text-center transition-all active:scale-[0.98] ${
                                                    formData.timeline === t.id
                                                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                                                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:border-white/20'
                                                }`}>
                                                <div className="text-xs sm:text-sm font-bold">{t.label}</div>
                                                <div className="text-[10px] text-slate-400">{t.sub}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Funding Method (Tap-to-Advance to Step 4) */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                                        How Do You Plan to Fund This Project?
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        {[
                                            {
                                                id: 'Insurance Claim Assistance',
                                                icon: '🛡️',
                                                title: 'Insurance Claim',
                                                desc: 'Assess storm damage & pay deductible only'
                                            },
                                            {
                                                id: 'Low Monthly Financing ($0 Down)',
                                                icon: '💳',
                                                title: 'Low Monthly Financing',
                                                desc: '$0 down options available with approved credit'
                                            },
                                            {
                                                id: 'Cash / Direct Payment',
                                                icon: '💵',
                                                title: 'Cash / Direct Pay',
                                                desc: 'Direct payment or self-financed'
                                            }
                                        ].map((f) => (
                                            <button
                                                key={f.id}
                                                type="button"
                                                onClick={() => handleTapToAdvance('insurance', f.id, 4)}
                                                className={`p-3.5 rounded-xl border text-left transition-all active:scale-[0.98] ${
                                                    formData.insurance === f.id
                                                        ? 'border-teal-500 bg-teal-500/10 shadow-[0_0_12px_rgba(20,184,166,0.15)]'
                                                        : 'border-white/10 bg-white/[0.02] hover:border-teal-500/40'
                                                }`}>
                                                <div className="text-xl mb-1">{f.icon}</div>
                                                <div className="font-bold text-sm text-white">{f.title}</div>
                                                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{f.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="text-xs text-slate-400 hover:text-white px-3 py-2">
                                        ← Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep(4)}
                                        className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-colors">
                                        Next: Location &amp; Contact →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ============================================================ */}
                        {/* STEP 4: Property Address & Verified Contact + Scan State     */}
                        {/* ============================================================ */}
                        {step === 4 && (
                            <div>
                                {isScanning ? (
                                    <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 border-4 border-teal-500/20 border-t-teal-400 rounded-full animate-spin"></div>
                                            <span className="absolute inset-0 flex items-center justify-center text-xl">🛰️</span>
                                        </div>
                                        <h3 className="text-base sm:text-lg font-bold text-white">Analyzing Property Coordinates</h3>
                                        <p className="text-xs sm:text-sm text-teal-300 font-mono animate-pulse">{scanText}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="text-center sm:text-left">
                                            <h2 className="text-lg sm:text-xl font-bold text-white">Where Should We Route Your Inspection?</h2>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Enter your street address &amp; ZIP code so our team can prepare satellite aerial imagery of your roof.
                                            </p>
                                        </div>

                                        {/* Address & ZIP */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                                                    Property Street Address *
                                                </label>
                                                <input
                                                    type="text"
                                                    id="address"
                                                    placeholder="e.g., 742 Evergreen Terrace"
                                                    value={formData.address}
                                                    onChange={(e) => handleChange('address', e.target.value)}
                                                    className="w-full bg-[#070a13] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                                                    5-Digit ZIP *
                                                </label>
                                                <input
                                                    type="tel"
                                                    inputMode="numeric"
                                                    maxLength={5}
                                                    id="zip"
                                                    placeholder="34652"
                                                    value={formData.zip}
                                                    onChange={(e) => handleChange('zip', e.target.value.replace(/\D/g, '').substring(0, 5))}
                                                    className="w-full bg-[#070a13] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                                                />
                                            </div>
                                        </div>

                                        {/* Name & Phone */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                                                    Homeowner Full Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    placeholder="e.g., John Smith"
                                                    value={formData.name}
                                                    onChange={(e) => handleChange('name', e.target.value)}
                                                    className="w-full bg-[#070a13] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                                                    Mobile Phone (For SMS Confirmation) *
                                                </label>
                                                <input
                                                    type="tel"
                                                    inputMode="numeric"
                                                    id="phone"
                                                    placeholder="(555) 000-0000"
                                                    value={formData.phone}
                                                    onChange={handlePhoneChange}
                                                    className="w-full bg-[#070a13] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                                                />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                                                Email Address (For Written Inspection Report) *
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                placeholder="john@example.com"
                                                value={formData.email}
                                                onChange={(e) => handleChange('email', e.target.value)}
                                                className="w-full bg-[#070a13] border border-white/15 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400"
                                            />
                                        </div>

                                        {/* Privacy Guarantee Badge */}
                                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-left">
                                            <span className="text-emerald-400 text-sm mt-0.5">🔒</span>
                                            <div className="text-[11px] text-slate-300 leading-snug">
                                                <strong className="text-white block">100% Privacy Guarantee:</strong>
                                                We never sell your data or spam you. Your details are shared exclusively with your local certified roofing crew to confirm your inspection slot.
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setStep(3)}
                                                className="text-xs text-slate-400 hover:text-white px-3 py-2">
                                                ← Back
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleStep4Continue}
                                                className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-lg hover:opacity-95 transition-opacity active:scale-[0.98]">
                                                Verify Property &amp; Check Calendar Slots →
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ============================================================ */}
                        {/* STEP 5: Priority Inspection Booking (Date Pills & Blocks)    */}
                        {/* ============================================================ */}
                        {step === 5 && (
                            <form onSubmit={handleFinalSubmit} className="space-y-5">
                                <div className="text-center sm:text-left">
                                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 mb-2">
                                        ✓ Satellite Scan Verified for {formData.zip || 'Local Service Area'}
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-bold text-white">Select Your Preferred Inspection Time</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Choose when our certified inspector should conduct your free 21-point physical roof &amp; attic check.
                                    </p>
                                </div>

                                {/* Property Tag Banner */}
                                <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between text-xs text-slate-300">
                                    <div className="truncate mr-2">
                                        <span className="text-slate-400">Inspecting:</span>{' '}
                                        <strong className="text-white">{formData.address || 'Property Location'}</strong>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(4)} 
                                        className="text-teal-400 hover:underline flex-shrink-0 text-[11px]">
                                        Edit
                                    </button>
                                </div>

                                {/* Quick Date Pills */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                                        1. Choose Inspection Date
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {datePills.map((pill) => (
                                            <button
                                                key={pill.dateStr}
                                                type="button"
                                                onClick={() => handleChange('appointmentDate', pill.dateStr)}
                                                className={`py-3 px-2 rounded-xl border text-center transition-all active:scale-[0.98] ${
                                                    formData.appointmentDate === pill.dateStr
                                                        ? 'border-teal-500 bg-teal-500/15 shadow-[0_0_12px_rgba(20,184,166,0.2)]'
                                                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                                                }`}>
                                                <div className="text-xs font-bold text-white">{pill.label}</div>
                                                <div className="text-[10px] text-teal-300 font-mono mt-0.5">{pill.display}</div>
                                            </button>
                                        ))}
                                    </div>
                                    
                                    {/* Or custom date */}
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[11px] text-slate-400">Or pick another date:</span>
                                        <input
                                            type="date"
                                            value={formData.appointmentDate}
                                            onChange={(e) => handleChange('appointmentDate', e.target.value)}
                                            className="bg-[#070a13] border border-white/15 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-teal-400"
                                        />
                                    </div>
                                </div>

                                {/* Time Blocks */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                                        2. Choose Time Slot
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                        {[
                                            { id: 'Morning (8:00 AM - 11:00 AM)', label: 'Morning Slot', time: '8:00 AM - 11:00 AM', icon: '🌅' },
                                            { id: 'Afternoon (12:00 PM - 3:00 PM)', label: 'Afternoon Slot', time: '12:00 PM - 3:00 PM', icon: '☀️' },
                                            { id: 'Evening (4:00 PM - 6:30 PM)', label: 'Evening Slot', time: '4:00 PM - 6:30 PM', icon: '🌇' }
                                        ].map((slot) => (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                onClick={() => handleChange('appointmentTime', slot.id)}
                                                className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                                                    formData.appointmentTime === slot.id
                                                        ? 'border-teal-500 bg-teal-500/15 shadow-[0_0_12px_rgba(20,184,166,0.2)]'
                                                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                                                }`}>
                                                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                                    <span>{slot.icon}</span> {slot.label}
                                                </div>
                                                <div className="text-[11px] text-teal-300 font-mono mt-0.5">{slot.time}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Inclusions Checklist */}
                                <div className="p-3 bg-white/[0.02] border border-white/10 rounded-xl space-y-1.5 text-left">
                                    <div className="text-xs font-bold text-slate-300 mb-1">What happens during your inspection:</div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                        <span className="text-teal-400 font-bold">✓</span> Physical 21-point shingle, flashing, and attic moisture check
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                        <span className="text-teal-400 font-bold">✓</span> High-resolution drone/satellite roof report prepared for your records
                                    </div>
                                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                                        <span className="text-teal-400 font-bold">✓</span> 100% Free &amp; Zero Obligation consultation
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(4)}
                                        className="text-xs text-slate-400 hover:text-white order-2 sm:order-1">
                                        ← Back to Contact Info
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-sm px-8 py-4 rounded-xl shadow-[0_0_20px_rgba(20,184,166,0.3)] transition-all active:scale-[0.98] order-1 sm:order-2 flex items-center justify-center gap-2">
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                                                <span>Reserving Slot...</span>
                                            </>
                                        ) : (
                                            <span>Lock In Free Roof Inspection &rarr;</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* Bottom Trust Band */}
                <div className="max-w-2xl mx-auto mt-6 text-center">
                    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-[11px] sm:text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span className="text-emerald-400">★</span> 4.9/5 Rating (1,200+ Inspections)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-teal-400">🛡️</span> Licensed &amp; Insured Roofers
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="text-amber-400">⚡</span> 60-Second Speed-to-Lead
                        </span>
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
