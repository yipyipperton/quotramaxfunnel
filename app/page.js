'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertCircle,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    CloudLightning,
    Droplets,
    Home as HomeIcon,
    Lock,
    Search,
    Zap
} from 'lucide-react';

const SERVICES = [
    {
        title: 'Full Roof Replacement',
        desc: 'My roof is old, worn out, or needs a complete teardown and new installation.',
        Icon: HomeIcon,
        val: 'Full Roof Replacement'
    },
    {
        title: 'Active Leak or Repair Emergency',
        desc: 'Water dripping, ceiling stains, missing shingles, or emergency flashing repair.',
        Icon: Droplets,
        val: 'Active Leak / Repair'
    },
    {
        title: 'Storm & Hail Damage Claim',
        desc: 'I suspect wind, hail, or tree damage and need an official inspection for insurance.',
        Icon: CloudLightning,
        val: 'Storm / Hail Damage'
    },
    {
        title: 'Preventative 21-Point Inspection',
        desc: 'I am buying, selling, or maintaining my home and want a thorough roof check.',
        Icon: Search,
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
        q: "How do you calculate my roof quote and inspection report?",
        a: "Our certified local inspectors review your property address, roof pitch, material preferences, and square footage to prepare an itemized price estimate before conducting your thorough physical inspection."
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

const STEP_LABELS = ['Roof Goal', 'Home Specs', 'Timeline & Budget', 'Property Location', 'Schedule Inspection'];

const cardClass = (selected) =>
    `w-full min-h-11 p-4 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        selected
            ? 'border-accent bg-accent/10 shadow-sm'
            : 'border-border bg-card hover:-translate-y-0.5 hover:shadow-md hover:border-primary/25'
    }`;

const onCardKeyDown = (fn) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fn();
    }
};

const inputClass =
    'w-full min-h-11 rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-foreground outline-none transition duration-150 placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring';

const primaryBtn =
    'inline-flex w-full sm:w-auto items-center justify-center gap-2 min-h-11 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition duration-150 hover:brightness-105 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60';

const secondaryBtn =
    'inline-flex items-center justify-center gap-1 min-h-11 px-2 text-sm font-medium text-muted-foreground transition duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg';

function SelectionMark({ selected }) {
    return (
        <span
            className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                selected ? 'bg-accent border-accent text-accent-foreground' : 'border-border bg-card'
            }`}
            aria-hidden="true">
            {selected ? <Check className="w-[14px] h-[14px]" strokeWidth={2.5} /> : null}
        </span>
    );
}

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
        website_hp: '',
        appointmentDate: datePills[0]?.dateStr || '',
        appointmentTime: 'Morning Arrival (8:00 AM - 11:00 AM)'
    });

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

    const handleChange = (field, value) => {
        setError('');
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const goToStep = (nextStepTarget) => {
        setError('');
        setStep(nextStepTarget);
        window.scrollTo(0, 0);
    };

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

        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.success || !data.leadId) {
                setSubmitting(false);
                setError(data?.error || 'Could not confirm your inspection. Please try again.');
                return;
            }

            const confirmation = {
                id: data.leadId,
                name: payload.name,
                address: fullLocationAddress,
                service: payload.service,
                material: payload.material,
                timeline: payload.timeline,
                appointment: payload.appointment,
                phone: payload.phone
            };

            try {
                sessionStorage.setItem('qm_access_' + data.leadId, data.accessToken || '');
                sessionStorage.setItem('qm_lead_' + data.leadId, JSON.stringify(confirmation));
            } catch (e) {}

            router.push(`/results/${encodeURIComponent(data.leadId)}`);
        } catch (err) {
            setSubmitting(false);
            setError('Network error. Please check your connection and try again.');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-accent/20">
            <header className="border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center gap-3">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => goToStep(1)}>
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <HomeIcon className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
                        </div>
                        <span className="font-heading font-bold text-lg tracking-tight text-foreground flex items-center gap-1.5">
                            QUOTRA<span className="text-accent">MAX</span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-muted text-muted-foreground rounded-md">ASSESSMENT</span>
                        </span>
                    </div>

                    <div className="text-xs font-semibold text-accent flex items-center gap-1.5 bg-accent/10 px-3 py-1.5 rounded-full border border-accent/20">
                        <span className="w-2 h-2 rounded-full bg-accent" aria-hidden="true"></span>
                        Free 21-Point Inspection
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-xl w-full mx-auto px-4 py-8 sm:py-10 flex flex-col justify-center">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted border border-border rounded-full text-[11px] font-semibold text-primary mb-3 uppercase tracking-wider">
                        <Zap className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                        Official 60-Second Roof Inspection & Price Estimate
                    </div>
                    <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
                        {step === 1 && 'What is the primary goal for your roof?'}
                        {step === 2 && 'What type of home and roofing material do you have?'}
                        {step === 3 && 'What is your ideal project timeline & payment preference?'}
                        {step === 4 && 'Where should we send your official roof inspection & price quote?'}
                        {step === 5 && 'Select your preferred date for a free on-site roof inspection'}
                    </h1>
                    <p className="text-base text-muted-foreground mt-3 font-medium">
                        {step === 1 && 'Select your primary roof concern below to get started.'}
                        {step === 2 && 'Helps us calculate accurate material costs and labor scope.'}
                        {step === 3 && 'Choose the scheduling and funding options that fit your budget.'}
                        {step === 4 && 'Enter your property address so our local licensed crew can prepare your estimate.'}
                        {step === 5 && 'Lock in your 21-point physical roof & attic condition check.'}
                    </p>
                </div>

                <div className="border border-border rounded-2xl bg-card p-5 sm:p-8 shadow-card">
                    <div className="mb-6">
                        <div className="relative mb-3">
                            <div className="absolute top-3.5 left-[10%] right-[10%] h-0.5 bg-muted rounded-full" aria-hidden="true" />
                            <div
                                className="absolute top-3.5 left-[10%] h-0.5 bg-accent rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${((step - 1) / 4) * 80}%` }}
                                aria-hidden="true"
                            />
                            <div className="relative flex items-start justify-between gap-1">
                                {STEP_LABELS.map((label, idx) => {
                                    const n = idx + 1;
                                    const done = n < step;
                                    const active = n === step;
                                    return (
                                        <div
                                            key={label}
                                            className="flex-1 flex flex-col items-center gap-1.5 min-w-0"
                                            aria-current={active ? 'step' : undefined}>
                                            <div
                                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors duration-200 z-[1] ${
                                                    done
                                                        ? 'bg-accent text-accent-foreground'
                                                        : active
                                                          ? 'bg-primary text-primary-foreground ring-2 ring-ring/30'
                                                          : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {done ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : n}
                                            </div>
                                            <span className={`hidden sm:block text-[10px] font-semibold truncate max-w-full ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex justify-between text-xs font-semibold mb-2">
                            <span className="text-muted-foreground">
                                Step {step} of 5: <span className="text-foreground">{STEP_LABELS[step - 1]}</span>
                            </span>
                            <span className="text-muted-foreground tabular-nums">{Math.round((step / 5) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${(step / 5) * 100}%` }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive-foreground text-sm rounded-xl font-semibold text-center flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div key="step-1" className="space-y-3 animate-step-in">
                            {SERVICES.map((item) => {
                                const selected = formData.service === item.val;
                                const Icon = item.Icon;
                                return (
                                    <div
                                        key={item.val}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleChange('service', item.val)}
                                        onKeyDown={onCardKeyDown(() => handleChange('service', item.val))}
                                        className={cardClass(selected)}>
                                        <div className="flex items-center gap-3.5 min-w-0">
                                            <span className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                                <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                                            </span>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-sm text-foreground">{item.title}</div>
                                                <div className="text-sm text-muted-foreground leading-relaxed mt-0.5">{item.desc}</div>
                                            </div>
                                        </div>
                                        <SelectionMark selected={selected} />
                                    </div>
                                );
                            })}

                            <div className="flex justify-end pt-4">
                                <button type="button" onClick={() => goToStep(2)} className={primaryBtn}>
                                    <span>Next: Home Specs →</span>
                                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div key="step-2" className="space-y-6 animate-step-in">
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">How many stories is your home?</label>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {['1 Story', '2 Stories', '3+ Stories'].map((story) => (
                                        <button
                                            key={story}
                                            type="button"
                                            onClick={() => handleChange('stories', story)}
                                            className={`min-h-11 p-3 rounded-xl border text-sm font-semibold transition-all duration-200 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                                formData.stories === story
                                                    ? 'bg-accent/10 border-accent text-foreground shadow-sm'
                                                    : 'bg-card border-border text-muted-foreground hover:-translate-y-0.5 hover:shadow-md'
                                            }`}>
                                            {story}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What is your preferred roofing material?</label>
                                <div className="space-y-2.5">
                                    {MATERIALS.map((mat) => {
                                        const selected = formData.material === mat.val;
                                        return (
                                            <div
                                                key={mat.val}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleChange('material', mat.val)}
                                                onKeyDown={onCardKeyDown(() => handleChange('material', mat.val))}
                                                className={cardClass(selected)}>
                                                <div className="min-w-0 pr-2">
                                                    <div className="font-semibold text-sm text-foreground">{mat.name}</div>
                                                    <div className="text-sm text-muted-foreground mt-0.5">{mat.desc}</div>
                                                </div>
                                                <SelectionMark selected={selected} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 gap-3">
                                <button type="button" onClick={() => goToStep(1)} className={secondaryBtn}>
                                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                                    ← Back
                                </button>
                                <button type="button" onClick={() => goToStep(3)} className={primaryBtn}>
                                    Next: Timeline →
                                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div key="step-3" className="space-y-6 animate-step-in">
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">When do you need this work completed?</label>
                                <div className="space-y-2">
                                    {TIMELINES.map((item) => {
                                        const selected = formData.timeline === item.val;
                                        return (
                                            <div
                                                key={item.val}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleChange('timeline', item.val)}
                                                onKeyDown={onCardKeyDown(() => handleChange('timeline', item.val))}
                                                className={cardClass(selected)}>
                                                <div className="min-w-0 pr-2">
                                                    <div className="font-semibold text-sm text-foreground">{item.title}</div>
                                                    <div className="text-sm text-muted-foreground mt-0.5">{item.desc}</div>
                                                </div>
                                                <SelectionMark selected={selected} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">What is your preferred payment option?</label>
                                <div className="space-y-2">
                                    {PAYMENTS.map((pay) => {
                                        const selected = formData.insurance === pay.val;
                                        return (
                                            <div
                                                key={pay.val}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleChange('insurance', pay.val)}
                                                onKeyDown={onCardKeyDown(() => handleChange('insurance', pay.val))}
                                                className={cardClass(selected)}>
                                                <div className="min-w-0 pr-2">
                                                    <div className="font-semibold text-sm text-foreground">{pay.name}</div>
                                                    <div className="text-sm text-muted-foreground mt-0.5">{pay.desc}</div>
                                                </div>
                                                <SelectionMark selected={selected} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 gap-3">
                                <button type="button" onClick={() => goToStep(2)} className={secondaryBtn}>
                                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                                    ← Back
                                </button>
                                <button type="button" onClick={() => goToStep(4)} className={primaryBtn}>
                                    Next: Property Location →
                                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div key="step-4" className="space-y-4 animate-step-in">
                            <div className="p-3.5 bg-accent/10 border border-accent/20 rounded-xl flex items-start gap-2.5 text-sm text-foreground">
                                <HomeIcon className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <span><strong>Local Inspection Crew Available:</strong> Enter property location to check local scheduling availability and calculate your free estimate.</span>
                            </div>

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
                                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Street Address *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 100 Bayshore Blvd"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">City *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Tampa"
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">State *</label>
                                    <input
                                        type="text"
                                        maxLength={2}
                                        placeholder="FL"
                                        value={formData.state}
                                        onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                                        className={`${inputClass} uppercase font-mono`}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">5-Digit ZIP Code *</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={5}
                                        placeholder="33602"
                                        value={formData.zip}
                                        onChange={(e) => handleChange('zip', e.target.value.replace(/\D/g, ''))}
                                        className={`${inputClass} font-mono`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Full Name *</label>
                                    <input
                                        type="text"
                                        placeholder="First and last name"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Mobile Phone (For Text Alert) *</label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="(555) 000-0000"
                                        value={formData.phone}
                                        onChange={handlePhoneChange}
                                        className={`${inputClass} font-mono`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">Email Address (For Report) *</label>
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="p-3 bg-muted border border-border rounded-xl flex items-center justify-between text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Lock className="w-3.5 h-3.5 text-accent" aria-hidden="true" /> 100% Spam-Free Privacy Guarantee
                                </span>
                                <span>Zero Obligation</span>
                            </div>

                            <div className="flex justify-between items-center pt-2 gap-3">
                                <button type="button" onClick={() => goToStep(3)} className={secondaryBtn}>
                                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                                    ← Back
                                </button>
                                <button type="button" onClick={handleStep4Continue} className={primaryBtn}>
                                    Select Date →
                                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <form key="step-5" onSubmit={handleFinalSubmit} className="space-y-6 animate-step-in">
                            <div>
                                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Select Preferred Inspection Date</label>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {datePills.map((pill) => (
                                        <button
                                            key={pill.dateStr}
                                            type="button"
                                            onClick={() => handleChange('appointmentDate', pill.dateStr)}
                                            className={`min-h-11 p-3 rounded-xl border text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                                formData.appointmentDate === pill.dateStr
                                                    ? 'bg-accent/10 border-accent text-foreground shadow-sm'
                                                    : 'bg-card border-border text-muted-foreground hover:-translate-y-0.5 hover:shadow-md'
                                            }`}>
                                            <div className="text-[10px] uppercase font-bold text-accent">{pill.label}</div>
                                            <div className="text-xs font-bold mt-0.5 text-foreground">{pill.display}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-3">Select Arrival Window</label>
                                <div className="space-y-2">
                                    {TIME_BLOCKS.map((block) => {
                                        const selected = formData.appointmentTime === block.time;
                                        return (
                                            <div
                                                key={block.time}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleChange('appointmentTime', block.time)}
                                                onKeyDown={onCardKeyDown(() => handleChange('appointmentTime', block.time))}
                                                className={cardClass(selected)}>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <Clock className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
                                                    <div className="min-w-0">
                                                        <span className="text-sm font-semibold text-foreground">{block.time}</span>
                                                        <span className="ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                                                            {block.tag}
                                                        </span>
                                                    </div>
                                                </div>
                                                <SelectionMark selected={selected} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 gap-3">
                                <button type="button" onClick={() => goToStep(4)} className={secondaryBtn}>
                                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                                    ← Back
                                </button>
                                <button type="submit" disabled={submitting} className={primaryBtn}>
                                    {submitting ? 'Confirming...' : 'Claim My Free Roof Inspection →'}
                                    {!submitting && <ChevronRight className="w-4 h-4" aria-hidden="true" />}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div className="mt-10 border border-border rounded-2xl bg-card p-5 sm:p-8 shadow-card">
                    <div className="text-center mb-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-muted text-muted-foreground rounded-md">
                            Got Questions?
                        </span>
                        <h2 className="font-heading text-xl font-bold text-foreground mt-3">Frequently Asked Questions</h2>
                        <p className="text-sm text-muted-foreground mt-2">Everything you need to know about your free 21-point roof inspection.</p>
                    </div>

                    <div className="divide-y divide-border">
                        {FAQS.map((faq, idx) => {
                            const open = openFaq === idx;
                            return (
                                <div key={idx} className="py-1">
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(open ? null : idx)}
                                        aria-expanded={open}
                                        className="w-full min-h-11 px-1 py-3.5 text-left text-sm font-semibold text-foreground flex justify-between items-center gap-3 hover:text-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
                                        <span>{faq.q}</span>
                                        <ChevronDown
                                            className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                                            aria-hidden="true"
                                        />
                                    </button>
                                    <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                        <div className="overflow-hidden">
                                            <p className="px-1 pb-3.5 text-sm text-muted-foreground leading-relaxed">
                                                {faq.a}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            <footer className="border-t border-border py-4 text-center text-[11px] text-muted-foreground">
                &copy; 2026 Quotramax Assessment Engine
            </footer>
        </div>
    );
}
