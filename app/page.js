'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();
    const [step, setStep] = useState(1);
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

    // Manual Step Progression
    const goToStep = (nextStepTarget) => {
        setError('');
        setStep(nextStepTarget);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    // Handle Step 4 submit
    const handleStep4Continue = () => {
        const err = validateStep4();
        if (err) {
            setError(err);
            return;
        }

        setError('');
        goToStep(5);
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
                const queryParams = new URLSearchParams({
                    name: payload.name,
                    address: payload.address,
                    service: payload.service,
                    date: payload.appointment?.date || '',
                    time: payload.appointment?.time || '',
                    phone: payload.phone,
                    email: payload.email,
                    material: payload.material
                }).toString();
                router.push(`/results/${result.leadId}?${queryParams}`);
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
        <div className="min-h-screen bg-[#040711] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white relative overflow-x-hidden">
            
            {/* Background Grid & Glow */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

            {/* Header */}
            <header className="border-b border-teal-500/20 bg-[#040711] sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => goToStep(1)}>
                        <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(20,184,166,0.3)]">
                            <svg className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </div>
                        <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
                            QUOTRA<span className="text-teal-400">MAX</span>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-md tracking-wider">AI 2.0</span>
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-teal-950/40 px-3.5 py-1.5 rounded-full border border-teal-500/30 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
                            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                            <span className="hidden xs:inline font-medium">Satellite Telemetry</span> Live
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Container */}
            <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col justify-center relative z-10">
                
                {/* Hero Title */}
                <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/30 rounded-full text-xs font-semibold text-teal-300 mb-3 uppercase tracking-widest shadow-[0_0_20px_rgba(20,184,166,0.2)]">
                        ⚡ 60-Second High-Intent Qualification Engine
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                        {step === 1 && 'Select Your Roofing Goal'}
                        {step === 2 && 'Building Architecture & Slope'}
                        {step === 3 && 'Project Timeline & Funding Intent'}
                        {step === 4 && 'Property Address & Verification'}
                        {step === 5 && 'Reserve Priority Inspection Slot'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium">
                        {step <= 3 && 'Select your option below and click Next to continue.'}
                        {step === 4 && 'Enter property coordinates for automated aerial satellite measurement.'}
                        {step === 5 && 'Select your preferred date & time window for a 21-point on-site check.'}
                    </p>
                </div>

                {/* Main Card Container */}
                <div className="w-full max-w-2xl mx-auto">
                    <div className="relative border border-teal-500/20 rounded-3xl bg-[#090d1a] p-5 sm:p-8 shadow-[0_0_60px_rgba(20,184,166,0.12)] overflow-hidden">
                        
                        {/* High-Tech Progress HUD */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                                    Step {step} of 5: <span className="text-teal-400">
                                        {step === 1 && 'Project Goal'}
                                        {step === 2 && 'Roof Architecture'}
                                        {step === 3 && 'Urgency & Funding'}
                                        {step === 4 && 'Property & Contact'}
                                        {step === 5 && 'Select Time Slot'}
                                    </span>
                                </span>
                                <span className="text-[11px] sm:text-xs font-black text-teal-400 font-mono">
                                    {Math.round((step / 5) * 100)}%
                                </span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-900 rounded-full p-0.5 border border-white/5 overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-cyan-400 transition-all duration-400 ease-out rounded-full shadow-[0_0_12px_rgba(20,184,166,0.6)]" 
                                    style={{ width: `${(step / 5) * 100}%` }}>
                                </div>
                            </div>
                        </div>

                        {/* Error Banner */}
                        {error && (
                            <div className="mb-5 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-2xl font-semibold text-center flex items-center justify-center gap-2 animate-bounce">
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        {/* STEP 1: PROJECT GOAL */}
                        {step === 1 && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="space-y-3.5">
                                    {[
                                        { title: 'Full Roof Replacement', desc: 'Complete teardown and new architectural roof system', icon: '🏗️', val: 'Full Roof Replacement' },
                                        { title: 'Active Leak / Repair', desc: 'Emergency ceiling leak, flashing, or missing shingles', icon: '💧', val: 'Active Leak / Repair' },
                                        { title: 'Storm / Hail Inspection', desc: 'Insurance assessment for wind or hail impact damage', icon: '⛈️', val: 'Storm / Hail Damage' },
                                        { title: 'Preventative Inspection', desc: 'General 21-point check for home purchase or maintenance', icon: '🔍', val: 'Preventative Inspection' }
                                    ].map((item) => (
                                        <div
                                            key={item.val}
                                            onClick={() => handleChange('service', item.val)}
                                            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                                                formData.service === item.val
                                                    ? 'bg-teal-500/15 border-teal-400/80 shadow-[0_0_25px_rgba(20,184,166,0.25)] text-white'
                                                    : 'bg-white/[0.02] border-white/10 hover:border-teal-500/40 hover:bg-white/[0.04] text-slate-300'
                                            }`}>
                                            <div className="flex items-center gap-3.5">
                                                <div className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform">
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm sm:text-base text-white group-hover:text-teal-300 transition-colors">{item.title}</div>
                                                    <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${
                                                formData.service === item.val
                                                    ? 'bg-teal-500 border-teal-400 text-slate-950 font-bold text-xs'
                                                    : 'border-white/20 group-hover:border-teal-400/50'
                                            }`}>
                                                {formData.service === item.val ? '✓' : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="button"
                                        onClick={() => goToStep(2)}
                                        className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-sm px-8 py-3.5 rounded-xl shadow-[0_0_25px_rgba(20,184,166,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                                        <span>Next: Roof Specs &rarr;</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 2: ROOF ARCHITECTURE & MATERIAL */}
                        {step === 2 && (
                            <div className="space-y-5 animate-fadeIn">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Building Height</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['1 Story', '2 Stories', '3+ Stories'].map((story) => (
                                            <button
                                                key={story}
                                                type="button"
                                                onClick={() => handleChange('stories', story)}
                                                className={`p-3.5 rounded-xl border text-xs font-bold transition-all text-center ${
                                                    formData.stories === story
                                                        ? 'bg-teal-500/20 border-teal-400 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.2)]'
                                                        : 'bg-white/[0.02] border-white/10 text-slate-300 hover:border-white/20'
                                                }`}>
                                                {story}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Desired Material</label>
                                    <div className="space-y-2.5">
                                        {[
                                            { name: 'Architectural Shingles', desc: 'Most popular 30-year dimensional asphalt shingle', val: 'Architectural Shingles' },
                                            { name: 'Standing Seam Metal', desc: 'Ultra-durable 50+ year architectural steel/aluminum', val: 'Standing Seam Metal' },
                                            { name: 'Clay Tile / Slate', desc: 'Premium heavy-duty tile or natural slate', val: 'Clay Tile / Slate' }
                                        ].map((mat) => (
                                            <div
                                                key={mat.val}
                                                onClick={() => handleChange('material', mat.val)}
                                                className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                                                    formData.material === mat.val
                                                        ? 'bg-teal-500/15 border-teal-400/80 shadow-[0_0_20px_rgba(20,184,166,0.2)] text-white'
                                                        : 'bg-white/[0.02] border-white/10 hover:border-teal-500/30 text-slate-300'
                                                }`}>
                                                <div>
                                                    <div className="font-bold text-xs sm:text-sm text-white group-hover:text-teal-300">{mat.name}</div>
                                                    <div className="text-[11px] text-slate-400 mt-0.5">{mat.desc}</div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                                                    formData.material === mat.val ? 'bg-teal-500 border-teal-400 text-slate-950' : 'border-white/20'
                                                }`}>
                                                    {formData.material === mat.val ? '✓' : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => goToStep(1)}
                                        className="text-xs font-medium text-slate-400 hover:text-white transition-colors order-2 sm:order-1">
                                        ← Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => goToStep(3)}
                                        className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-sm px-8 py-3.5 rounded-xl shadow-[0_0_25px_rgba(20,184,166,0.3)] transition-all active:scale-[0.98] order-1 sm:order-2 flex items-center justify-center gap-2">
                                        <span>Next: Timeline &amp; Funding &rarr;</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 3: URGENCY & FUNDING INTENT */}
                        {step === 3 && (
                            <div className="space-y-5 animate-fadeIn">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Project Timeline</label>
                                    <div className="space-y-2.5">
                                        {[
                                            { title: 'Under 2 weeks (Urgent)', desc: 'Immediate leak or active property issue', val: 'Under 2 weeks' },
                                            { title: '1 - 4 weeks', desc: 'Standard project scheduling', val: '1 - 4 weeks' },
                                            { title: 'Planning / 1-3 months', desc: 'Gathering specifications & budget options', val: '1 - 3 months' }
                                        ].map((item) => (
                                            <div
                                                key={item.val}
                                                onClick={() => handleChange('timeline', item.val)}
                                                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                                    formData.timeline === item.val
                                                        ? 'bg-amber-500/15 border-amber-400/80 text-amber-200'
                                                        : 'bg-white/[0.02] border-white/10 text-slate-300'
                                                }`}>
                                                <div>
                                                    <div className="font-bold text-xs sm:text-sm text-white">{item.title}</div>
                                                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                                    formData.timeline === item.val ? 'bg-amber-400 border-amber-300 text-slate-950 font-bold text-xs' : 'border-white/20'
                                                }`}>
                                                    {formData.timeline === item.val ? '✓' : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Funding / Payment Preference</label>
                                    <div className="space-y-2.5">
                                        {[
                                            { name: 'Insurance Claim Pending', desc: 'Wind/hail claim assistance needed', val: 'Insurance Claim Pending' },
                                            { name: 'Low Monthly Financing', desc: 'Explore $120-$190/mo low payment plans', val: 'Low Monthly Financing' },
                                            { name: 'Cash / Direct Payment', desc: 'Standard payment upon completion', val: 'Cash / Direct Payment' }
                                        ].map((pay) => (
                                            <div
                                                key={pay.val}
                                                onClick={() => handleChange('insurance', pay.val)}
                                                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                                                    formData.insurance === pay.val
                                                        ? 'bg-teal-500/15 border-teal-400/80 text-white'
                                                        : 'bg-white/[0.02] border-white/10 hover:border-teal-500/30 text-slate-300'
                                                }`}>
                                                <div>
                                                    <div className="font-bold text-xs sm:text-sm text-white group-hover:text-teal-300">{pay.name}</div>
                                                    <div className="text-[11px] text-slate-400">{pay.desc}</div>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                                                    formData.insurance === pay.val ? 'bg-teal-500 border-teal-400 text-slate-950' : 'border-white/20'
                                                }`}>
                                                    {formData.insurance === pay.val ? '✓' : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => goToStep(2)}
                                        className="text-xs font-medium text-slate-400 hover:text-white transition-colors order-2 sm:order-1">
                                        ← Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => goToStep(4)}
                                        className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-sm px-8 py-3.5 rounded-xl shadow-[0_0_25px_rgba(20,184,166,0.3)] transition-all active:scale-[0.98] order-1 sm:order-2 flex items-center justify-center gap-2">
                                        <span>Next: Address &amp; Contact &rarr;</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 4: LOCATION & VERIFIED CONTACT */}
                        {step === 4 && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="p-3.5 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center gap-3">
                                    <span className="text-xl">🛰️</span>
                                    <div className="text-xs text-teal-300 leading-tight">
                                        <span className="font-bold block text-white">Satellite Aerial Takeoff Ready</span>
                                        Enter address to link coordinates with local crew schedules.
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Property Street Address *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 100 Bayshore Blvd, Suite 400"
                                        value={formData.address}
                                        onChange={(e) => handleChange('address', e.target.value)}
                                        className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">5-Digit ZIP Code *</label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            maxLength={5}
                                            placeholder="e.g. 33602"
                                            value={formData.zip}
                                            onChange={(e) => handleChange('zip', e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none font-mono transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Full Name *</label>
                                        <input
                                            type="text"
                                            placeholder="First and last name"
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Mobile Phone (For Text Alert) *</label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            placeholder="(555) 000-0000"
                                            value={formData.phone}
                                            onChange={handlePhoneChange}
                                            className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none font-mono transition-all"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Email Address (For Report) *</label>
                                        <input
                                            type="email"
                                            placeholder="name@example.com"
                                            value={formData.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-[11px] text-slate-400">
                                    <span className="flex items-center gap-1.5">
                                        <span className="text-teal-400">🔒</span> 100% Spam-Free Privacy Guarantee
                                    </span>
                                    <span>Zero Obligation</span>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => goToStep(3)}
                                        className="text-xs text-slate-400 hover:text-white order-2 sm:order-1">
                                        ← Back
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleStep4Continue}
                                        className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold text-sm px-8 py-4 rounded-xl shadow-[0_0_25px_rgba(20,184,166,0.35)] transition-all active:scale-[0.98] order-1 sm:order-2 flex items-center justify-center gap-2">
                                        <span>Scan Satellite Roofline &amp; Select Date &rarr;</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* STEP 5: PRIORITY INSPECTION BOOKING */}
                        {step === 5 && (
                            <form onSubmit={handleFinalSubmit} className="space-y-6 animate-fadeIn">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                                        Select Preferred Inspection Date
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {datePills.map((pill) => (
                                            <button
                                                key={pill.dateStr}
                                                type="button"
                                                onClick={() => handleChange('appointmentDate', pill.dateStr)}
                                                className={`p-3.5 rounded-xl border text-center transition-all ${
                                                    formData.appointmentDate === pill.dateStr
                                                        ? 'bg-teal-500/20 border-teal-400 text-white shadow-[0_0_15px_rgba(20,184,166,0.25)]'
                                                        : 'bg-white/[0.02] border-white/10 text-slate-300 hover:border-white/20'
                                                }`}>
                                                <div className="text-[10px] uppercase tracking-wider font-bold text-teal-400">{pill.label}</div>
                                                <div className="text-xs sm:text-sm font-extrabold mt-0.5">{pill.display}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                                        Select Arrival Time Window
                                    </label>
                                    <div className="space-y-2.5">
                                        {[
                                            { time: 'Morning (8:00 AM - 11:00 AM)', tag: 'Recommended' },
                                            { time: 'Afternoon (12:00 PM - 3:00 PM)', tag: 'Popular' },
                                            { time: 'Late Afternoon (3:30 PM - 6:00 PM)', tag: 'Flexible' }
                                        ].map((block) => (
                                            <div
                                                key={block.time}
                                                onClick={() => handleChange('appointmentTime', block.time)}
                                                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                                    formData.appointmentTime === block.time
                                                        ? 'bg-teal-500/20 border-teal-400 text-white shadow-[0_0_15px_rgba(20,184,166,0.2)]'
                                                        : 'bg-white/[0.02] border-white/10 text-slate-300 hover:border-white/20'
                                                }`}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-base">🕒</span>
                                                    <span className="text-xs sm:text-sm font-bold text-white">{block.time}</span>
                                                </div>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                                    {block.tag}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => goToStep(4)}
                                        className="text-xs text-slate-400 hover:text-white order-2 sm:order-1">
                                        ← Back to Contact Info
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-sm px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(20,184,166,0.4)] transition-all active:scale-[0.98] order-1 sm:order-2 flex items-center justify-center gap-2">
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
                <div className="max-w-2xl mx-auto mt-8 text-center">
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
            <footer className="border-t border-teal-500/10 py-4 text-center text-[11px] text-slate-500 relative z-10">
                &copy; 2026 Quotramax AI Conversion System. High-Intent Lead Qualification &amp; Booking.
            </footer>
        </div>
    );
}
