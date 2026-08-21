'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Memoized static option datasets outside component render cycle
const SERVICES = [
    { title: 'Full Roof Replacement', desc: 'Complete teardown and new architectural roof system', icon: '🏗️', val: 'Full Roof Replacement' },
    { title: 'Active Leak / Repair', desc: 'Emergency ceiling leak, flashing, or missing shingles', icon: '💧', val: 'Active Leak / Repair' },
    { title: 'Storm / Hail Inspection', desc: 'Insurance assessment for wind or hail impact damage', icon: '⛈️', val: 'Storm / Hail Damage' },
    { title: 'Preventative Inspection', desc: 'General 21-point check for home purchase or maintenance', icon: '🔍', val: 'Preventative Inspection' }
];

const MATERIALS = [
    { name: 'Architectural Shingles', desc: 'Most popular 30-year dimensional asphalt shingle', val: 'Architectural Shingles' },
    { name: 'Standing Seam Metal', desc: 'Ultra-durable 50+ year architectural steel/aluminum', val: 'Standing Seam Metal' },
    { name: 'Clay Tile / Slate', desc: 'Premium heavy-duty tile or natural slate', val: 'Clay Tile / Slate' }
];

const TIMELINES = [
    { title: 'Under 2 weeks (Urgent)', desc: 'Immediate leak or active property issue', val: 'Under 2 weeks' },
    { title: '1 - 4 weeks', desc: 'Standard project scheduling', val: '1 - 4 weeks' },
    { title: 'Planning / 1-3 months', desc: 'Gathering specifications & budget options', val: '1 - 3 months' }
];

const PAYMENTS = [
    { name: 'Insurance Claim Pending', desc: 'Wind/hail claim assistance needed', val: 'Insurance Claim Pending' },
    { name: 'Low Monthly Financing', desc: 'Explore $120-$190/mo low payment plans', val: 'Low Monthly Financing' },
    { name: 'Cash / Direct Payment', desc: 'Standard payment upon completion', val: 'Cash / Direct Payment' }
];

const TIME_BLOCKS = [
    { time: 'Morning (8:00 AM - 11:00 AM)', tag: 'Recommended' },
    { time: 'Afternoon (12:00 PM - 3:00 PM)', tag: 'Popular' },
    { time: 'Late Afternoon (3:30 PM - 6:00 PM)', tag: 'Flexible' }
];

// Helper to calculate date pills synchronously
function getInitialDatePills() {
    const pills = [];
    const today = new Date();
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    pills.push({
        label: 'Tomorrow',
        dateStr: tomorrow.toISOString().split('T')[0],
        display: tomorrow.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    });

    const day2 = new Date(today);
    day2.setDate(today.getDate() + 2);
    pills.push({
        label: day2.toLocaleDateString(undefined, { weekday: 'short' }),
        dateStr: day2.toISOString().split('T')[0],
        display: day2.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    });

    const day3 = new Date(today);
    day3.setDate(today.getDate() + 3);
    pills.push({
        label: day3.toLocaleDateString(undefined, { weekday: 'short' }),
        dateStr: day3.toISOString().split('T')[0],
        display: day3.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    });

    return pills;
}

export default function Home() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const datePills = getInitialDatePills();

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
        appointmentDate: datePills[0]?.dateStr || '',
        appointmentTime: 'Morning (8:00 AM - 11:00 AM)'
    });

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

    // Manual Step Progression (Instant)
    const goToStep = (nextStepTarget) => {
        setError('');
        setStep(nextStepTarget);
        window.scrollTo(0, 0);
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

    const handleStep4Continue = () => {
        const err = validateStep4();
        if (err) {
            setError(err);
            return;
        }
        setError('');
        goToStep(5);
    };

    // Final Submission Handler (Instant Optimistic Navigation)
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

        const tempId = 'RQ-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const leadObj = {
            id: tempId,
            ...payload
        };
        
        try {
            sessionStorage.setItem('qm_lead_' + tempId, JSON.stringify(leadObj));
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

        // Background API sync
        fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.warn('Background sync note:', err));

        // Instant UI Navigation
        router.push(`/results/${tempId}?${queryParams}`);
    };

    return (
        <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
            
            {/* Lightweight Header */}
            <header className="border-b border-teal-500/20 bg-[#060913] sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => goToStep(1)}>
                        <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                            <svg className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </div>
                        <span className="font-black text-lg tracking-tight text-white flex items-center gap-1">
                            QUOTRA<span className="text-teal-400">MAX</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal-500/20 text-teal-300 rounded">AI</span>
                        </span>
                    </div>
                    
                    <div className="text-xs font-semibold text-teal-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                        Speed-to-Lead
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col justify-center">
                
                {/* Header Text */}
                <div className="text-center mb-6">
                    <div className="inline-block px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-[11px] font-bold text-teal-300 mb-2 uppercase tracking-wider">
                        ⚡ Instant Roof Qualification
                    </div>
                    <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                        {step === 1 && 'Select Your Roofing Goal'}
                        {step === 2 && 'Building Specs & Material'}
                        {step === 3 && 'Timeline & Funding Intent'}
                        {step === 4 && 'Property Address & Verification'}
                        {step === 5 && 'Select Preferred Inspection Time'}
                    </h1>
                </div>

                {/* Card Container */}
                <div className="border border-teal-500/20 rounded-2xl bg-[#090d1a] p-4 sm:p-6 shadow-xl">
                    
                    {/* Progress Bar */}
                    <div className="mb-5">
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className="text-slate-400">Step {step} of 5</span>
                            <span className="text-teal-400 font-mono">{Math.round((step / 5) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/5">
                            <div className="h-full bg-teal-400 transition-all duration-300" style={{ width: `${(step / 5) * 100}%` }}></div>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {error && (
                        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl font-bold text-center">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* STEP 1 */}
                    {step === 1 && (
                        <div className="space-y-3">
                            {SERVICES.map((item) => (
                                <div
                                    key={item.val}
                                    onClick={() => handleChange('service', item.val)}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                        formData.service === item.val
                                            ? 'bg-teal-500/15 border-teal-400 text-white'
                                            : 'bg-white/[0.02] border-white/10 hover:border-teal-500/30 text-slate-300'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{item.icon}</span>
                                        <div>
                                            <div className="font-bold text-sm text-white">{item.title}</div>
                                            <div className="text-xs text-slate-400">{item.desc}</div>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                                        formData.service === item.val ? 'bg-teal-500 border-teal-400 text-slate-950' : 'border-white/20'
                                    }`}>
                                        {formData.service === item.val ? '✓' : ''}
                                    </div>
                                </div>
                            ))}

                            <div className="flex justify-end pt-3">
                                <button
                                    type="button"
                                    onClick={() => goToStep(2)}
                                    className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                                    <span>Next: Roof Specs &rarr;</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Building Height</label>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {['1 Story', '2 Stories', '3+ Stories'].map((story) => (
                                        <button
                                            key={story}
                                            type="button"
                                            onClick={() => handleChange('stories', story)}
                                            className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                                                formData.stories === story
                                                    ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                                                    : 'bg-white/[0.02] border-white/10 text-slate-300'
                                            }`}>
                                            {story}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Desired Material</label>
                                <div className="space-y-2.5">
                                    {MATERIALS.map((mat) => (
                                        <div
                                            key={mat.val}
                                            onClick={() => handleChange('material', mat.val)}
                                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                                formData.material === mat.val
                                                    ? 'bg-teal-500/15 border-teal-400 text-white'
                                                    : 'bg-white/[0.02] border-white/10 hover:border-teal-500/30 text-slate-300'
                                            }`}>
                                            <div>
                                                <div className="font-bold text-xs sm:text-sm text-white">{mat.name}</div>
                                                <div className="text-[11px] text-slate-400">{mat.desc}</div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                                                formData.material === mat.val ? 'bg-teal-500 border-teal-400 text-slate-950' : 'border-white/20'
                                            }`}>
                                                {formData.material === mat.val ? '✓' : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3">
                                <button type="button" onClick={() => goToStep(1)} className="text-xs font-semibold text-slate-400 hover:text-white">← Back</button>
                                <button type="button" onClick={() => goToStep(3)} className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm px-6 py-3 rounded-xl transition-all">Next: Timeline &rarr;</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3 */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Project Timeline</label>
                                <div className="space-y-2">
                                    {TIMELINES.map((item) => (
                                        <div
                                            key={item.val}
                                            onClick={() => handleChange('timeline', item.val)}
                                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                                formData.timeline === item.val ? 'bg-amber-500/15 border-amber-400 text-amber-200' : 'bg-white/[0.02] border-white/10 text-slate-300'
                                            }`}>
                                            <div>
                                                <div className="font-bold text-xs sm:text-sm text-white">{item.title}</div>
                                                <div className="text-[11px] text-slate-400">{item.desc}</div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold ${
                                                formData.timeline === item.val ? 'bg-amber-400 border-amber-300 text-slate-950' : 'border-white/20'
                                            }`}>
                                                {formData.timeline === item.val ? '✓' : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Funding Preference</label>
                                <div className="space-y-2">
                                    {PAYMENTS.map((pay) => (
                                        <div
                                            key={pay.val}
                                            onClick={() => handleChange('insurance', pay.val)}
                                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                                formData.insurance === pay.val ? 'bg-teal-500/15 border-teal-400 text-white' : 'bg-white/[0.02] border-white/10 hover:border-teal-500/30 text-slate-300'
                                            }`}>
                                            <div>
                                                <div className="font-bold text-xs sm:text-sm text-white">{pay.name}</div>
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

                            <div className="flex justify-between items-center pt-3">
                                <button type="button" onClick={() => goToStep(2)} className="text-xs font-semibold text-slate-400 hover:text-white">← Back</button>
                                <button type="button" onClick={() => goToStep(4)} className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm px-6 py-3 rounded-xl transition-all">Next: Address &rarr;</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4 */}
                    {step === 4 && (
                        <div className="space-y-3.5">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Street Address *</label>
                                <input
                                    type="text"
                                    placeholder="100 Bayshore Blvd"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">ZIP Code *</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={5}
                                        placeholder="33602"
                                        value={formData.zip}
                                        onChange={(e) => handleChange('zip', e.target.value.replace(/\D/g, ''))}
                                        className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Full Name *</label>
                                    <input
                                        type="text"
                                        placeholder="First and last name"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Phone *</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="(555) 000-0000"
                                        value={formData.phone}
                                        onChange={handlePhoneChange}
                                        className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Email *</label>
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3">
                                <button type="button" onClick={() => goToStep(3)} className="text-xs font-semibold text-slate-400 hover:text-white">← Back</button>
                                <button type="button" onClick={handleStep4Continue} className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-sm px-6 py-3 rounded-xl transition-all">Select Date &rarr;</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 5 */}
                    {step === 5 && (
                        <form onSubmit={handleFinalSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Select Inspection Date</label>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {datePills.map((pill) => (
                                        <button
                                            key={pill.dateStr}
                                            type="button"
                                            onClick={() => handleChange('appointmentDate', pill.dateStr)}
                                            className={`p-3 rounded-xl border text-center transition-all ${
                                                formData.appointmentDate === pill.dateStr ? 'bg-teal-500/20 border-teal-400 text-white' : 'bg-white/[0.02] border-white/10 text-slate-300'
                                            }`}>
                                            <div className="text-[10px] uppercase font-bold text-teal-400">{pill.label}</div>
                                            <div className="text-xs font-extrabold mt-0.5">{pill.display}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Select Time Window</label>
                                <div className="space-y-2">
                                    {TIME_BLOCKS.map((block) => (
                                        <div
                                            key={block.time}
                                            onClick={() => handleChange('appointmentTime', block.time)}
                                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                                formData.appointmentTime === block.time ? 'bg-teal-500/20 border-teal-400 text-white' : 'bg-white/[0.02] border-white/10 text-slate-300'
                                            }`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">🕒</span>
                                                <span className="text-xs font-bold text-white">{block.time}</span>
                                            </div>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                                {block.tag}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-3">
                                <button type="button" onClick={() => goToStep(4)} className="text-xs font-semibold text-slate-400 hover:text-white">← Back</button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-black text-sm px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-teal-500/20">
                                    {submitting ? 'Confirming...' : 'Lock In Free Inspection &rarr;'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </main>

            <footer className="border-t border-white/5 py-3 text-center text-[11px] text-slate-500">
                &copy; 2026 Quotramax AI System
            </footer>
        </div>
    );
}
