'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    Check,
    ChevronDown,
    Clock,
    CloudLightning,
    Droplets,
    Hammer,
    House,
    Lock,
    Search,
    TriangleAlert,
    Zap
} from 'lucide-react';

const SERVICES = [
    {
        title: 'Full Roof Replacement',
        desc: 'My roof is old, worn out, or needs a complete teardown and new installation.',
        icon: Hammer,
        val: 'Full Roof Replacement'
    },
    {
        title: 'Active Leak or Repair Emergency',
        desc: 'Water dripping, ceiling stains, missing shingles, or emergency flashing repair.',
        icon: Droplets,
        val: 'Active Leak / Repair'
    },
    {
        title: 'Storm & Hail Damage Claim',
        desc: 'I suspect wind, hail, or tree damage and need an official inspection for insurance.',
        icon: CloudLightning,
        val: 'Storm / Hail Damage'
    },
    {
        title: 'Preventative 21-Point Inspection',
        desc: 'I am buying, selling, or maintaining my home and want a thorough roof check.',
        icon: Search,
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

const optionCardClass = (selected) =>
    `w-full min-h-[44px] px-3 py-2.5 sm:p-5 rounded-xl sm:rounded-2xl border text-left flex items-center justify-between gap-3 sm:gap-4 cursor-pointer transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
        selected
            ? 'border-primary-accent bg-primary-tint shadow-card'
            : 'border-border bg-background hover:border-border-strong hover:shadow-card-hover hover:-translate-y-0.5'
    }`;

const inputClass =
    'w-full min-h-[44px] px-4 py-3 rounded-xl border border-border bg-background-alt text-base sm:text-lg text-foreground placeholder:text-foreground-tertiary transition-all duration-200 ease-out focus:outline-none focus:border-primary-accent focus:ring-2 focus:ring-ring';

const primaryBtn =
    'inline-flex w-full sm:w-auto items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-xl bg-primary text-primary-fg font-semibold text-base sm:text-lg shadow-button transition-all duration-200 ease-out hover:bg-primary-hover hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:pointer-events-none';

const backBtn =
    'w-full sm:w-auto min-h-[44px] px-4 rounded-xl text-base font-medium text-foreground-secondary transition-colors duration-200 ease-out hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

const navRow = 'flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-2';

const fieldLabel = 'block text-base font-medium text-foreground mb-2';

const sectionLabel = 'block text-base font-medium text-foreground mb-3';

function SelectionMark({ selected }) {
    return (
        <span
            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                selected ? 'bg-primary' : 'border border-border-strong'
            }`}
            aria-hidden="true">
            {selected ? <Check className="w-3.5 h-3.5 text-primary-fg" strokeWidth={2.5} /> : null}
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
        <div className="relative min-h-screen text-foreground flex flex-col font-sans selection:bg-primary-tint">
            <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
                <div className="absolute inset-0 bg-[url('/roof-hero.webp')] bg-cover bg-center opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-b from-background-alt/40 via-background-alt/80 to-background-alt" />
            </div>

            <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40">
                <div className="max-w-4xl mx-auto px-4 py-2 sm:py-3 flex justify-between items-center gap-3">
                    <div className="flex items-center gap-2 cursor-pointer min-w-0" onClick={() => goToStep(1)}>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary-tint border border-border flex items-center justify-center flex-shrink-0">
                            <House className="w-4 h-4 text-primary-accent" aria-hidden="true" />
                        </div>
                        <span className="font-heading font-semibold text-base sm:text-lg tracking-tight text-foreground flex items-center gap-1.5 min-w-0">
                            QUOTRA<span className="text-primary-accent">MAX</span>
                            <span className="hidden sm:inline-flex text-xs font-semibold px-1.5 py-0.5 bg-muted text-foreground-secondary rounded-md">ASSESSMENT</span>
                        </span>
                    </div>

                    <div className="text-xs sm:text-sm font-medium text-foreground-secondary flex items-center gap-1.5 bg-muted px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-border">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse flex-shrink-0" aria-hidden="true"></span>
                        <span className="sm:hidden">Free Inspection</span>
                        <span className="hidden sm:inline">Free 21-Point Inspection</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto px-4 py-4 sm:py-12 flex flex-col justify-center gap-4 sm:gap-12">
                <div className="text-center">
                    <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-primary-tint border border-border rounded-full text-sm font-medium text-primary-accent mb-4">
                        <Zap className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                        Official 60-Second Roof Inspection & Price Estimate
                    </div>
                    <h1 className="text-xl sm:text-4xl font-heading font-bold tracking-tight leading-tight text-balance">
                        {step === 1 && 'What is the primary goal for your roof?'}
                        {step === 2 && 'What type of home and roofing material do you have?'}
                        {step === 3 && 'What is your ideal project timeline & payment preference?'}
                        {step === 4 && 'Where should we send your official roof inspection & price quote?'}
                        {step === 5 && 'Select your preferred date for a free on-site roof inspection'}
                    </h1>
                    <p className="hidden sm:block text-lg text-foreground-secondary leading-relaxed mt-3">
                        {step === 1 && 'Select your primary roof concern below to get started.'}
                        {step === 2 && 'Helps us calculate accurate material costs and labor scope.'}
                        {step === 3 && 'Choose the scheduling and funding options that fit your budget.'}
                        {step === 4 && 'Enter your property address so our local licensed crew can prepare your estimate.'}
                        {step === 5 && 'Lock in your 21-point physical roof & attic condition check.'}
                    </p>
                </div>

                <div className="rounded-2xl border border-border bg-background shadow-card px-3 sm:px-6 py-4 sm:py-8">
                    <div className="mb-3 sm:mb-6">
                        <div className="flex justify-between items-baseline gap-3 mb-2">
                            <span className="text-base text-foreground-secondary">
                                Step {step} of 5:{' '}
                                <span className="text-primary-accent font-semibold">
                                    {step === 1 && 'Roof Goal'}
                                    {step === 2 && 'Home Specs'}
                                    {step === 3 && 'Timeline & Budget'}
                                    {step === 4 && 'Property Location'}
                                    {step === 5 && 'Schedule Inspection'}
                                </span>
                            </span>
                            <span className="text-foreground-tertiary tabular-nums">{Math.round((step / 5) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-accent rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${(step / 5) * 100}%` }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-danger-tint border border-danger/30 text-danger text-base rounded-xl font-medium text-center flex items-center justify-center gap-2">
                            <TriangleAlert className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                            {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-2 sm:space-y-4 animate-stepIn">
                            {SERVICES.map((item) => {
                                const selected = formData.service === item.val;
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.val}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleChange('service', item.val)}
                                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChange('service', item.val); } }}
                                        className={optionCardClass(selected)}>
                                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                            <Icon className="w-6 h-6 text-primary-accent flex-shrink-0" aria-hidden="true" />
                                            <div className="min-w-0">
                                                <div className="text-sm sm:text-lg font-semibold text-foreground">{item.title}</div>
                                                <div className="hidden sm:block text-base text-foreground-secondary leading-relaxed mt-1">{item.desc}</div>
                                            </div>
                                        </div>
                                        <SelectionMark selected={selected} />
                                    </div>
                                );
                            })}

                            <div className="flex pt-2">
                                <button type="button" onClick={() => goToStep(2)} className={primaryBtn}>
                                    Next: Home Specs
                                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 sm:space-y-8 animate-stepIn">
                            <div>
                                <label className={sectionLabel}>How many stories is your home?</label>
                                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                    {['1 Story', '2 Stories', '3+ Stories'].map((story) => (
                                        <button
                                            key={story}
                                            type="button"
                                            onClick={() => handleChange('stories', story)}
                                            className={`min-h-[44px] px-2 py-3 sm:p-4 rounded-2xl border text-base font-semibold transition-all duration-200 ease-out text-center focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
                                                formData.stories === story
                                                    ? 'border-primary-accent bg-primary-tint shadow-card text-foreground'
                                                    : 'border-border bg-background text-foreground-secondary hover:border-border-strong hover:shadow-card-hover hover:-translate-y-0.5'
                                            }`}>
                                            {story}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={sectionLabel}>What is your preferred roofing material?</label>
                                <div className="space-y-2 sm:space-y-3">
                                    {MATERIALS.map((mat) => {
                                        const selected = formData.material === mat.val;
                                        return (
                                            <div
                                                key={mat.val}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleChange('material', mat.val)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChange('material', mat.val); } }}
                                                className={optionCardClass(selected)}>
                                                <div className="min-w-0 pr-1 sm:pr-2">
                                                    <div className="text-sm sm:text-lg font-semibold text-foreground">{mat.name}</div>
                                                    <div className="hidden sm:block text-base text-foreground-secondary leading-relaxed mt-1">{mat.desc}</div>
                                                </div>
                                                <SelectionMark selected={selected} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={navRow}>
                                <button type="button" onClick={() => goToStep(1)} className={backBtn}>
                                    ← Back
                                </button>
                                <button type="button" onClick={() => goToStep(3)} className={primaryBtn}>
                                    Next: Timeline
                                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 sm:space-y-8 animate-stepIn">
                            <div>
                                <label className={sectionLabel}>When do you need this work completed?</label>
                                <div className="space-y-2 sm:space-y-3">
                                    {TIMELINES.map((item) => {
                                        const selected = formData.timeline === item.val;
                                        return (
                                            <div
                                                key={item.val}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleChange('timeline', item.val)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChange('timeline', item.val); } }}
                                                className={optionCardClass(selected)}>
                                                <div className="min-w-0 pr-1 sm:pr-2">
                                                    <div className="text-sm sm:text-lg font-semibold text-foreground">{item.title}</div>
                                                    <div className="hidden sm:block text-base text-foreground-secondary leading-relaxed mt-1">{item.desc}</div>
                                                </div>
                                                <SelectionMark selected={selected} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className={sectionLabel}>What is your preferred payment option?</label>
                                <div className="space-y-2 sm:space-y-3">
                                    {PAYMENTS.map((pay) => {
                                        const selected = formData.insurance === pay.val;
                                        return (
                                            <div
                                                key={pay.val}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleChange('insurance', pay.val)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChange('insurance', pay.val); } }}
                                                className={optionCardClass(selected)}>
                                                <div className="min-w-0 pr-1 sm:pr-2">
                                                    <div className="text-sm sm:text-lg font-semibold text-foreground">{pay.name}</div>
                                                    <div className="hidden sm:block text-base text-foreground-secondary leading-relaxed mt-1">{pay.desc}</div>
                                                </div>
                                                <SelectionMark selected={selected} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className={navRow}>
                                <button type="button" onClick={() => goToStep(2)} className={backBtn}>
                                    ← Back
                                </button>
                                <button type="button" onClick={() => goToStep(4)} className={primaryBtn}>
                                    Next: Property Location
                                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-3 sm:space-y-4 animate-stepIn animate-fadeIn">
                            <div className="p-4 bg-primary-tint border border-border rounded-2xl flex items-start gap-3 text-base text-foreground">
                                <House className="w-6 h-6 text-primary-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
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
                                <label className={fieldLabel}>Street Address *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 100 Bayshore Blvd"
                                    value={formData.address}
                                    onChange={(e) => handleChange('address', e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={fieldLabel}>City *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Tampa"
                                        value={formData.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={fieldLabel}>State *</label>
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={fieldLabel}>5-Digit ZIP Code *</label>
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
                                    <label className={fieldLabel}>Full Name *</label>
                                    <input
                                        type="text"
                                        placeholder="First and last name"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={fieldLabel}>Mobile Phone (For Inspection Call) *</label>
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
                                    <label className={fieldLabel}>Email Address (For Report) *</label>
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-muted border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-base text-foreground-secondary">
                                <span className="flex items-center gap-2">
                                    <Lock className="w-5 h-5 text-primary-accent flex-shrink-0" aria-hidden="true" /> 100% Spam-Free Privacy Guarantee
                                </span>
                                <span>Zero Obligation</span>
                            </div>

                            <div className={navRow}>
                                <button type="button" onClick={() => goToStep(3)} className={backBtn}>
                                    ← Back
                                </button>
                                <button type="button" onClick={handleStep4Continue} className={primaryBtn}>
                                    Select Date
                                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <form onSubmit={handleFinalSubmit} className="space-y-4 sm:space-y-8 animate-stepIn">
                            <div>
                                <label className={sectionLabel}>Select Preferred Inspection Date</label>
                                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                    {datePills.map((pill) => (
                                        <button
                                            key={pill.dateStr}
                                            type="button"
                                            onClick={() => handleChange('appointmentDate', pill.dateStr)}
                                            className={`min-h-[44px] px-2 py-3 sm:p-4 rounded-2xl border text-center transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background ${
                                                formData.appointmentDate === pill.dateStr
                                                    ? 'border-primary-accent bg-primary-tint shadow-card text-foreground'
                                                    : 'border-border bg-background text-foreground-secondary hover:border-border-strong hover:shadow-card-hover hover:-translate-y-0.5'
                                            }`}>
                                            <div className="text-sm font-semibold text-primary-accent">{pill.label}</div>
                                            <div className="text-sm sm:text-base font-semibold mt-1 text-foreground">{pill.display}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={sectionLabel}>Select Arrival Window</label>
                                <div className="space-y-2 sm:space-y-3">
                                    {TIME_BLOCKS.map((block) => {
                                        const selected = formData.appointmentTime === block.time;
                                        return (
                                            <div
                                                key={block.time}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => handleChange('appointmentTime', block.time)}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChange('appointmentTime', block.time); } }}
                                                className={optionCardClass(selected)}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Clock className="w-6 h-6 text-primary-accent flex-shrink-0" aria-hidden="true" />
                                                    <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                                                        <span className="text-base sm:text-lg font-semibold text-foreground">{block.time}</span>
                                                        <span className="text-sm font-medium px-2 py-0.5 rounded-md bg-muted text-foreground-secondary">
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

                            <div className={navRow}>
                                <button type="button" onClick={() => goToStep(4)} className={backBtn}>
                                    ← Back
                                </button>
                                <button type="submit" disabled={submitting} className={primaryBtn}>
                                    {submitting ? 'Confirming...' : 'Claim My Free Roof Inspection'}
                                    {!submitting && <ArrowRight className="w-5 h-5" aria-hidden="true" />}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                <div>
                    <div className="text-center mb-6">
                        <span className="text-sm font-medium px-2.5 py-1 bg-muted text-foreground-secondary rounded-md">
                            Got Questions?
                        </span>
                        <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground mt-4">Frequently Asked Questions</h2>
                        <p className="text-base text-foreground-secondary leading-relaxed mt-2">Everything you need to know about your free 21-point roof inspection.</p>
                    </div>

                    <div>
                        {FAQS.map((faq, idx) => {
                            const open = openFaq === idx;
                            return (
                                <div
                                    key={idx}
                                    className={`border-b border-border ${idx === FAQS.length - 1 ? 'border-b-0' : ''}`}>
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                        aria-expanded={open}
                                        className="w-full min-h-[44px] py-5 flex items-center justify-between gap-4 text-left text-base sm:text-lg font-heading font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-lg">
                                        <span>{faq.q}</span>
                                        <ChevronDown
                                            className={`w-5 h-5 text-foreground-secondary flex-shrink-0 transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`}
                                            aria-hidden="true"
                                        />
                                    </button>
                                    <div className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                                        <div className="overflow-hidden">
                                            <p className={`text-base text-foreground-secondary leading-relaxed pb-5 ${open ? 'animate-fadeIn' : ''}`}>
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

            <footer className="relative z-10 border-t border-border text-sm text-foreground-tertiary py-6 text-center">
                &copy; 2026 Quotramax Assessment Engine
            </footer>
        </div>
    );
}
