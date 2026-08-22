'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Direct-response homeowner-centric option datasets
const SERVICES = [
    { 
        title: 'Full Roof Replacement', 
        desc: 'My roof is old, worn out, or needs a complete teardown and new installation.', 
        icon: '🏗️', 
        val: 'Full Roof Replacement' 
    },
    { 
        title: 'Active Leak or Repair Emergency', 
        desc: 'Water dripping, ceiling stains, missing shingles, or emergency flashing repair.', 
        icon: '💧', 
        val: 'Active Leak / Repair' 
    },
    { 
        title: 'Storm & Hail Damage Claim', 
        desc: 'I suspect wind, hail, or tree damage and need an official inspection for insurance.', 
        icon: '⛈️', 
        val: 'Storm / Hail Damage' 
    },
    { 
        title: 'Preventative 21-Point Inspection', 
        desc: 'I am buying, selling, or maintaining my home and want a thorough roof check.', 
        icon: '🔍', 
        val: 'Preventative Inspection' 
    }
];

const MATERIALS = [
    { 
        name: 'Architectural Shingles', 
        desc: 'Most popular 30-year dimensional asphalt shingles (Durable & Cost-Effective)', 
        val: 'Architectural Shingles' 
    },
    { 
        name: 'Standing Seam Metal Roofing', 
        desc: 'Ultra-durable 50+ year architectural steel or aluminum (Maximum Storm Protection)', 
        val: 'Standing Seam Metal' 
    },
    { 
        name: 'Clay Tile or Natural Slate', 
        desc: 'Premium heavy-duty Spanish tile or natural slate (Luxury Long-Term System)', 
        val: 'Clay Tile / Slate' 
    }
];

const TIMELINES = [
    { 
        title: 'Emergency / Urgent (Under 2 Weeks)', 
        desc: 'Active leak or structural damage needing immediate attention.', 
        val: 'Under 2 weeks' 
    },
    { 
        title: 'Standard Scheduling (1 to 4 Weeks)', 
        desc: 'Planning replacement or repair within the next 30 days.', 
        val: '1 - 4 weeks' 
    },
    { 
        title: 'Planning & Budgeting (1 to 3 Months)', 
        desc: 'Comparing options and gathering official estimates for upcoming work.', 
        val: '1 - 3 months' 
    }
];

const PAYMENTS = [
    { 
        name: 'Explore Low Monthly Financing', 
        desc: 'Flexible payment plans starting as low as $119/month with approved credit.', 
        val: 'Low Monthly Financing' 
    },
    { 
        name: 'Insurance Claim Assistance', 
        desc: 'I have open wind or hail damage and need help navigating my insurance claim.', 
        val: 'Insurance Claim Pending' 
    },
    { 
        name: 'Cash / Standard Payment', 
        desc: 'Paying directly upon project completion via check or credit card.', 
        val: 'Cash / Direct Payment' 
    }
];

const TIME_BLOCKS = [
    { time: 'Morning Arrival (8:00 AM - 11:00 AM)', tag: 'Most Popular' },
    { time: 'Afternoon Arrival (12:00 PM - 3:00 PM)', tag: 'Recommended' },
    { time: 'Late Afternoon Arrival (3:30 PM - 6:00 PM)', tag: 'Flexible' }
];

const FAQS = [
    {
        q: "Is the 21-Point Roof Inspection really 100% free with zero obligation?",
        a: "Yes, 100% free. A licensed local roofer conducts a thorough walk-through of your shingles, attic ventilation, gutters, and flashing. You receive a written physical condition report with zero pressure or obligation to buy."
    },
    {
        q: "How does the Satellite Aerial Scan work?",
        a: "We use high-resolution orbital satellite photography to measure your roof's surface area, ridge line length, and slope pitch angles automatically before the inspector arrives on site."
    },
    {
        q: "Will I get spammed with annoying phone calls?",
        a: "No. Your information is kept strictly confidential and is only used to coordinate your scheduled inspection arrival window with your assigned local crew."
    },
    {
        q: "Can you help me navigate my insurance claim for storm or hail damage?",
        a: "Yes! Our certified inspectors document storm impact damage, hail bruises, and wind lift with photos to support your official insurance claim submission."
    },
    {
        q: "What if I need low monthly payment options?",
        a: "We partner with top lenders to offer flexible monthly financing plans starting as low as $119/month with approved credit, as well as zero-down payment options."
    }
];

// Calculate date pills synchronously for 0ms render latency
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
        label: 'In 3 Days',
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
    const [openFaq, setOpenFaq] = useState(null);
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
        city: '',
        state: '',
        zip: '',
        name: '',
        email: '',
        phone: '',
        website_hp: '', // Honeypot field for bot spam detection
        appointmentDate: datePills[0]?.dateStr || '',
        appointmentTime: 'Morning Arrival (8:00 AM - 11:00 AM)'
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

    // Validation for contact info + City & State + Anti-spam validation
    const validateStep4 = () => {
        if (!formData.address.trim()) return 'Please enter your street address.';
        if (!formData.city.trim()) return 'Please enter your city.';
        if (!formData.state.trim() || formData.state.trim().length < 2) return 'Please enter a 2-letter state code (e.g. FL).';
        const cleanZip = formData.zip.replace(/\D/g, '');
        if (cleanZip.length !== 5) return 'Please enter a valid 5-digit ZIP code.';
        if (!formData.name.trim() || formData.name.trim().length < 2) return 'Please enter your full name.';
        const cleanPhone = formData.phone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) return 'Please enter a valid 10-digit phone number.';
        if (['0000000000', '1234567890', '1111111111', '9999999999'].includes(cleanPhone)) return 'Please enter a real phone number.';
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

    // Final Submission Handler (Instant Optimistic Navigation + Anti-Spam Trap)
    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        if (!formData.appointmentDate) {
            setError('Please select a preferred inspection date.');
            return;
        }

        setSubmitting(true);
        setError('');

        const fullLocationAddress = `${formData.address}, ${formData.city}, ${formData.state.toUpperCase()} ${formData.zip}`;

        const payload = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state.toUpperCase(),
            zip: formData.zip,
            fullAddress: fullLocationAddress,
            service: formData.service,
            roofAge: formData.roofAge,
            stories: formData.stories,
            pitch: formData.pitch,
            material: formData.material,
            timeline: formData.timeline,
            insurance: formData.insurance,
            website_hp: formData.website_hp,
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
            address: fullLocationAddress,
            service: payload.service,
            date: payload.appointment?.date || '',
            time: payload.appointment?.time || '',
            phone: payload.phone,
            email: payload.email,
            material: payload.material
        }).toString();

        // Background API sync with honeypot trap
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
            
            {/* Header */}
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
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-teal-500/20 text-teal-300 rounded">ASSESSMENT</span>
                        </span>
                    </div>
                    
                    <div className="text-xs font-semibold text-teal-400 flex items-center gap-1.5 bg-teal-950/40 px-3 py-1 rounded-full border border-teal-500/30">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                        Free 21-Point Inspection
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-8 flex flex-col justify-center">
                
                {/* Hero Header */}
                <div className="text-center mb-6">
                    <div className="inline-block px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-[11px] font-bold text-teal-300 mb-2 uppercase tracking-wider">
                        🔒 Official 60-Second Property Roof Assessment
                    </div>
                    <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                        {step === 1 && 'What is the primary goal for your roof?'}
                        {step === 2 && 'What type of home and roofing material do you have?'}
                        {step === 3 && 'What is your ideal project timeline & payment preference?'}
                        {step === 4 && 'Where should we send your official satellite report?'}
                        {step === 5 && 'Select your preferred date for a free on-site roof inspection'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1.5 font-medium">
                        {step === 1 && 'Select your primary roof concern below to get started.'}
                        {step === 2 && 'Helps our satellite aerial scanner calculate surface area & pitch.'}
                        {step === 3 && 'Choose the scheduling and funding options that fit your budget.'}
                        {step === 4 && 'Enter property location to match local licensed inspection crews.'}
                        {step === 5 && 'Lock in your 21-point physical roof & attic condition check.'}
                    </p>
                </div>

                {/* Card Container */}
                <div className="border border-teal-500/20 rounded-2xl bg-[#090d1a] p-4 sm:p-6 shadow-xl">
                    
                    {/* Progress Bar */}
                    <div className="mb-5">
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                            <span className="text-slate-400">Step {step} of 5: <span className="text-teal-400">
                                {step === 1 && 'Roof Goal'}
                                {step === 2 && 'Home Specs'}
                                {step === 3 && 'Timeline & Budget'}
                                {step === 4 && 'Property Location'}
                                {step === 5 && 'Schedule Inspection'}
                            </span></span>
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

                    {/* STEP 1: ROOF GOAL */}
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
                                    <div className="flex items-center gap-3.5">
                                        <span className="text-2xl flex-shrink-0">{item.icon}</span>
                                        <div>
                                            <div className="font-bold text-sm text-white">{item.title}</div>
                                            <div className="text-xs text-slate-400 leading-relaxed mt-0.5">{item.desc}</div>
                                        </div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
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
                                    className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm px-7 py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                                    <span>Next: Home Specs →</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: HOME SPECS & MATERIAL */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">How many stories is your home?</label>
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
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">What is your preferred roofing material?</label>
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
                                                <div className="text-[11px] text-slate-400 mt-0.5">{mat.desc}</div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
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
                                <button type="button" onClick={() => goToStep(3)} className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm px-6 py-3 rounded-xl transition-all">Next: Timeline →</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: TIMELINE & BUDGET */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">When do you need this work completed?</label>
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
                                                <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                                formData.timeline === item.val ? 'bg-amber-400 border-amber-300 text-slate-950' : 'border-white/20'
                                            }`}>
                                                {formData.timeline === item.val ? '✓' : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">What is your preferred payment option?</label>
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
                                                <div className="text-[11px] text-slate-400 mt-0.5">{pay.desc}</div>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
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
                                <button type="button" onClick={() => goToStep(4)} className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm px-6 py-3 rounded-xl transition-all">Next: Property Location →</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: PROPERTY LOCATION & CONTACT */}
                    {step === 4 && (
                        <div className="space-y-3.5 animate-fadeIn">
                            <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl flex items-center gap-2.5 text-xs text-teal-300">
                                <span className="text-base">🛰️</span>
                                <span><strong>Satellite Aerial Scanner Ready:</strong> Enter property location to calculate roof surface area and pitch.</span>
                            </div>

                            {/* Invisible Honeypot Anti-Spam Field */}
                            <input
                                type="text"
                                name="website_hp"
                                value={formData.website_hp}
                                onChange={(e) => handleChange('website_hp', e.target.value)}
                                tabIndex={-1}
                                autoComplete="off"
                                className="hidden"
                                aria-hidden="true"
                            />

                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Street Address *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 100 Bayshore Blvd"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">City *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Tampa"
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">State *</label>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        placeholder="FL"
                                        value={formData.state}
                                        onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                                        className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none uppercase font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">5-Digit ZIP Code *</label>
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
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Mobile Phone (For Text Alert) *</label>
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
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Email Address (For Report) *</label>
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className="w-full bg-[#040711] border border-white/15 focus:border-teal-400 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none"
                                    />
                                </div>
                            </div>

                            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-[11px] text-slate-400">
                                <span className="flex items-center gap-1">
                                    <span className="text-teal-400">🔒</span> 100% Spam-Free Privacy Guarantee
                                </span>
                                <span>Zero Obligation</span>
                            </div>

                            <div className="flex justify-between items-center pt-3">
                                <button type="button" onClick={() => goToStep(3)} className="text-xs font-semibold text-slate-400 hover:text-white">← Back</button>
                                <button type="button" onClick={handleStep4Continue} className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm px-6 py-3 rounded-xl transition-all">Select Date →</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: INSPECTION BOOKING */}
                    {step === 5 && (
                        <form onSubmit={handleFinalSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Select Preferred Inspection Date</label>
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
                                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Select Arrival Window</label>
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
                                    {submitting ? 'Confirming...' : 'Claim My Free Roof Inspection →'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* FAQ Section */}
                <div className="mt-10 border border-teal-500/20 rounded-2xl bg-[#090d1a] p-5 sm:p-6 shadow-xl">
                    <div className="text-center mb-5">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-teal-500/10 text-teal-400 rounded-md border border-teal-500/20">
                            Got Questions?
                        </span>
                        <h2 className="text-lg sm:text-xl font-bold text-white mt-2">Frequently Asked Questions</h2>
                        <p className="text-xs text-slate-400 mt-1">Everything you need to know about your free 21-point roof inspection.</p>
                    </div>

                    <div className="space-y-3">
                        {FAQS.map((faq, idx) => (
                            <div 
                                key={idx}
                                className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.01] transition-all">
                                <button
                                    type="button"
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                    className="w-full px-4 py-3.5 text-left text-xs sm:text-sm font-bold text-white flex justify-between items-center hover:bg-white/[0.02]">
                                    <span>{faq.q}</span>
                                    <span className="text-teal-400 text-base font-mono flex-shrink-0 ml-2">
                                        {openFaq === idx ? '−' : '+'}
                                    </span>
                                </button>
                                {openFaq === idx && (
                                    <div className="px-4 pb-3.5 text-xs text-slate-300 leading-relaxed border-t border-white/5 pt-2.5 animate-fadeIn">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/5 py-3 text-center text-[11px] text-slate-500">
                &copy; 2026 Quotramax Assessment Engine
            </footer>
        </div>
    );
}
