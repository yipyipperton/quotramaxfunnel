'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        zip: '',
        propertyType: 'Residential',
        stories: '1',
        homeCategory: 'Medium', // Small, Medium, Large, Estate
        roofSize: 2200,
        footprintLength: '',
        footprintWidth: '',
        sizeMode: 'preset', // 'preset', 'footprint', or 'slider'
        complexity: 'Gable', // Gable, Hip, Valleys, Complex
        layers: '1', // 1, 2, 3
        condition: 'Good',
        service: 'Replacement',
        material: 'Asphalt shingles',
        timeline: 'Under 1 month',
        insurance: 'Cash / Direct Financing',
        roofAge: '10 - 20 years',
        pitch: 'Standard',
        appointmentDate: '',
        appointmentTime: 'Morning (9AM-11AM)'
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const todayStr = new Date().toISOString().split('T')[0];

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        if (id === 'phone') {
            const input = value.replace(/\D/g, '');
            const cleanInput = input.substring(0, 10);
            
            let formatted = '';
            if (cleanInput.length > 0) {
                formatted += cleanInput.substring(0, 3);
            }
            if (cleanInput.length > 3) {
                formatted += '-' + cleanInput.substring(3, 6);
            }
            if (cleanInput.length > 6) {
                formatted += '-' + cleanInput.substring(6, 10);
            }
            setFormData(prev => ({ ...prev, phone: formatted }));
        } else if (id === 'zip') {
            const cleanZip = value.replace(/\D/g, '').substring(0, 5);
            setFormData(prev => ({ ...prev, zip: cleanZip }));
        } else {
            setFormData(prev => ({ ...prev, [id]: value }));
        }
    };

    const handleHomeCategorySelect = (category, sqFt) => {
        setFormData(prev => ({
            ...prev,
            homeCategory: category,
            roofSize: sqFt
        }));
    };

    const handleSliderChange = (e) => {
        setFormData(prev => ({ ...prev, roofSize: parseInt(e.target.value) }));
    };

    const handleSelectOption = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateStep = () => {
        setError('');
        if (step === 1) {
            if (!formData.name.trim()) return 'Please enter your full name.';
            if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return 'Please enter a valid email address.';
            
            const digitsOnly = formData.phone.replace(/\D/g, '');
            if (digitsOnly.length !== 10) {
                return 'Please enter a valid 10-digit phone number.';
            }
            if (!formData.address.trim()) return 'Please enter your street address.';
            if (!formData.zip.trim() || formData.zip.length !== 5) return 'Please enter a valid 5-digit ZIP code.';
        }
        if (step === 5) {
            if (!formData.appointmentDate) return 'Please select a preferred inspection date.';
            if (!formData.appointmentTime) return 'Please select a preferred inspection time slot.';
        }
        return '';
    };

    const handleNext = () => {
        const validationError = validateStep();
        if (validationError) {
            setError(validationError);
            return;
        }
        setStep(prev => prev + 1);
    };

    const handlePrev = () => {
        setError('');
        setStep(prev => prev - 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateStep();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSubmitting(true);
        setError('');

        const payload = {
            ...formData,
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
                router.push(`/results/${result.leadId}`);
            } else {
                setError(result.error || 'Failed to submit estimate request');
                setSubmitting(false);
            }
        } catch (err) {
            console.error('Submission error:', err);
            setError('Connection failed. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
            
            {/* Nav */}
            <header className="border-b border-white/5 bg-[#070a13]/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setStep(1)}>
                        <svg className="w-7 h-7 text-indigo-500 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span className="font-heading font-extrabold text-2xl tracking-tight text-white">QUOTRA<span className="text-indigo-500">MAX</span></span>
                    </div>
                    <button onClick={() => router.push('/login')} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg">
                        Contractor Dashboard
                    </button>
                </div>
            </header>

            {/* Split Screen Container */}
            <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    
                    {/* Left Panel: Pitch Copy */}
                    <div className="lg:col-span-6 flex flex-col justify-center py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 w-fit mb-6 uppercase tracking-widest">
                            ⚡ 2026 Instant Roof Valuation Engine
                        </span>
                        
                        <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white mb-6">
                            Calculate Your <br />
                            New Roof Cost <br />
                            <span className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-emerald-400 bg-clip-text text-transparent filter drop-shadow-[0_0_12px_rgba(99,102,241,0.2)]">
                                Instantly Online.
                            </span>
                        </h1>
                        
                        <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
                            Answer 5 quick qualification questions about your property and material preferences to generate a 2026 preliminary materials and labor estimate report.
                        </p>

                        {/* Checklist Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-lg">
                            <div className="flex gap-3 items-start">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">✓</span>
                                <div>
                                    <strong className="block text-slate-200 text-sm font-bold">2026 Regional Benchmarks</strong>
                                    <span className="text-[11px] text-slate-400">Calculates precise material & regional trade labor costs.</span>
                                </div>
                            </div>
                            <div className="flex gap-3 items-start">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-bold">✓</span>
                                <div>
                                    <strong className="block text-slate-200 text-sm font-bold">Comprehensive Executive PDF</strong>
                                    <span className="text-[11px] text-slate-400">Receive a detailed itemized budget report and slope assessment.</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Premium 5-Step Wizard Card */}
                    <div className="lg:col-span-6 w-full">
                        <div className="relative border border-white/10 rounded-2xl bg-[#0d1222]/80 backdrop-blur-2xl p-8 shadow-2xl overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:height-[4px] before:bg-gradient-to-r before:from-indigo-500 before:via-purple-500 before:to-emerald-400">
                            
                            {/* Animated Step Header & Progress bar */}
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                        Step {step} of 5: <span className="text-indigo-400">
                                            {step === 1 ? 'Customer & Location' :
                                             step === 2 ? 'Home Size & Elevation' :
                                             step === 3 ? 'Roof Shape & Materials' :
                                             step === 4 ? 'Project Qualifications' :
                                             'Schedule On-Site Visit'}
                                        </span>
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">{Math.round((step / 5) * 100)}% Complete</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 ease-out" style={{ width: `${(step / 5) * 100}%` }}></div>
                                </div>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-300 text-xs rounded-xl font-medium text-center">
                                    ⚠️ {error}
                                </div>
                            )}

                            {/* STEP 1: Customer Details */}
                            {step === 1 && (
                                <div className="space-y-5">
                                    <div>
                                        <h2 className="text-xl font-extrabold text-white">Owner & Location Details</h2>
                                        <p className="text-xs text-slate-400 mt-1">Provide your contact info so we can route your regional 2026 estimate report.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="name">Full Name</label>
                                            <input id="name" type="text" value={formData.name} onChange={handleInputChange} placeholder="John Doe" className="w-full bg-[#12182c] border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder-slate-650" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="email">Email Address</label>
                                            <input id="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" className="w-full bg-[#12182c] border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder-slate-650" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="phone">Phone Number</label>
                                            <input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="727-808-4646" className="w-full bg-[#12182c] border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder-slate-650" />
                                        </div>
                                        
                                        {/* Separate Street Address and ZIP Code */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="sm:col-span-2 flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="address">Street Address</label>
                                                <input id="address" type="text" value={formData.address} onChange={handleInputChange} placeholder="100 Broadway St" className="w-full bg-[#12182c] border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder-slate-650" />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="zip">ZIP Code</label>
                                                <input id="zip" type="text" maxLength="5" value={formData.zip} onChange={handleInputChange} placeholder="75201" className="w-full bg-[#12182c] border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white placeholder-slate-650 font-mono" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                                        <div></div>
                                        <button onClick={handleNext} className="bg-indigo-500 hover:bg-indigo-650 text-white font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_4px_14px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.5)]">
                                            Next Step
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: Property Footprint & Sizing */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-extrabold text-white">Home Category & Elevation</h2>
                                        <p className="text-xs text-slate-400 mt-1">Select your home category—our engine auto-calculates roof surface area.</p>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Property Type & Elevation</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button onClick={() => handleSelectOption('propertyType', 'Residential')} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${formData.propertyType === 'Residential' ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]' : 'bg-[#12182c] border-white/5 text-slate-400 hover:border-white/15'}`}>
                                                    <span className="text-xl">🏠</span>
                                                    <span className="text-xs font-bold">Residential</span>
                                                </button>
                                                <button onClick={() => handleSelectOption('propertyType', 'Commercial')} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${formData.propertyType === 'Commercial' ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]' : 'bg-[#12182c] border-white/5 text-slate-400 hover:border-white/15'}`}>
                                                    <span className="text-xl">🏢</span>
                                                    <span className="text-xs font-bold">Commercial</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Story Height Elevation</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['1', '2', '3'].map((num) => (
                                                    <button key={num} onClick={() => handleSelectOption('stories', num)} className={`py-3 rounded-xl border text-xs font-bold transition-all ${formData.stories === num ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-[#12182c] border-white/5 text-slate-400 hover:border-white/15'}`}>
                                                        {num === '3' ? '3+ Stories' : `${num} Story`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Visual Home Size Presets */}
                                        <div className="flex flex-col gap-2.5 pt-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Home Category / Size</label>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => handleSelectOption('sizeMode', 'preset')} className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${formData.sizeMode === 'preset' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400'}`}>Presets</button>
                                                    <button type="button" onClick={() => handleSelectOption('sizeMode', 'slider')} className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${formData.sizeMode === 'slider' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400'}`}>Custom Sq Ft</button>
                                                </div>
                                            </div>

                                            {formData.sizeMode === 'preset' ? (
                                                <div className="space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {[
                                                            { key: 'Small', label: '🏡 Small / Townhome', sqFt: 1400, range: '~1,200–1,600 sq ft' },
                                                            { key: 'Medium', label: '🏠 Medium Single-Family', sqFt: 2100, range: '~1,800–2,400 sq ft' },
                                                            { key: 'Large', label: '🏰 Executive Home', sqFt: 2900, range: '~2,500–3,400 sq ft' },
                                                            { key: 'Estate', label: '🏛️ Extra Large Estate', sqFt: 4000, range: '~3,600+ sq ft' }
                                                        ].map((item) => (
                                                            <button key={item.key} type="button" onClick={() => handleHomeCategorySelect(item.key, item.sqFt)} className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${formData.homeCategory === item.key ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]' : 'bg-[#12182c] border-white/5 text-slate-400 hover:border-white/15'}`}>
                                                                <span className="text-xs font-bold text-slate-200">{item.label}</span>
                                                                <span className="text-[9px] text-slate-500 font-medium">{item.range}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 leading-normal">
                                                        * Don't worry if you aren't sure—our engine auto-adjusts your estimate using pitch, roof complexity, and local building codes.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-slate-300">Custom Roof Surface Area</span>
                                                        <span className="text-xs font-extrabold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-lg">{formData.roofSize.toLocaleString()} sq ft</span>
                                                    </div>
                                                    <input type="range" id="roofSize" min="1000" max="6000" step="100" value={formData.roofSize} onChange={handleSliderChange} className="w-full h-2 rounded-lg bg-slate-800 appearance-none cursor-pointer accent-indigo-500 mt-1" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                                        <button onClick={handlePrev} className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                            Back
                                        </button>
                                        <button onClick={handleNext} className="bg-indigo-500 hover:bg-indigo-650 text-white font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_4px_14px_rgba(99,102,241,0.3)]">
                                            Next Step
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Roof Shape Complexity & Materials */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-extrabold text-white">Roof Shape & Materials</h2>
                                        <p className="text-xs text-slate-400 mt-1">Specify roof shape complexity and material grade.</p>
                                    </div>

                                    <div className="space-y-5">
                                        {/* Roof Shape Complexity Cards */}
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Roof Shape / Complexity</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { value: 'Gable', label: '📐 Simple Gable', desc: '2 sloping sides' },
                                                    { value: 'Hip', label: '🏠 Hip Roof', desc: 'Slopes on all 4 sides' },
                                                    { value: 'Valleys', label: '🏔️ Valleys & Dormers', desc: 'L-shape / multiple gables' },
                                                    { value: 'Complex', label: '🏰 Complex / Custom', desc: 'Multi-angle & turrets' }
                                                ].map((comp) => (
                                                    <button key={comp.value} type="button" onClick={() => handleSelectOption('complexity', comp.value)} className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${formData.complexity === comp.value ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]' : 'bg-[#12182c] border-white/5 text-slate-400 hover:border-white/15'}`}>
                                                        <span className="text-xs font-bold text-slate-200">{comp.label}</span>
                                                        <span className="text-[9px] text-slate-500">{comp.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Desired Service Scope</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                <button onClick={() => handleSelectOption('service', 'Repair')} className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${formData.service === 'Repair' ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]' : 'bg-[#12182c] border-white/5 text-slate-400 hover:border-white/15'}`}>
                                                    <span className="text-xs font-bold text-slate-200">🛠️ Localized Repair</span>
                                                    <span className="text-[9px] text-slate-400 leading-normal">Fix leaks, patches, or targeted wear areas.</span>
                                                </button>
                                                <button onClick={() => handleSelectOption('service', 'Replacement')} className={`p-3.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${formData.service === 'Replacement' ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]' : 'bg-[#12182c] border-white/5 text-slate-400 hover:border-white/15'}`}>
                                                    <span className="text-xs font-bold text-slate-200">🔄 Full Replacement</span>
                                                    <span className="text-[9px] text-slate-400 leading-normal">Complete tear-off & brand new install.</span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Preferred Material Styling</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { value: 'Asphalt shingles', label: '🏠 Architectural Asphalt', desc: '$450–$750/sq installed' },
                                                    { value: 'Metal', label: '🛡️ Standing-Seam Metal', desc: '$950–$1,650/sq installed' },
                                                    { value: 'Tile', label: '🧱 Spanish Slate & Tile', desc: '$1,200–$2,400/sq installed' },
                                                    { value: 'Other', label: '❓ Designer / Undecided', desc: 'Consult with inspector' }
                                                ].map((mat) => (
                                                    <button key={mat.value} onClick={() => handleSelectOption('material', mat.value)} className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${formData.material === mat.value ? 'bg-indigo-500/10 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]' : 'bg-[#12182c] border-white/5 text-slate-400 hover:border-white/15'}`}>
                                                        <span className="text-xs font-bold text-slate-200">{mat.label}</span>
                                                        <span className="text-[9px] text-slate-500">{mat.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                                        <button onClick={handlePrev} className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                            Back
                                        </button>
                                        <button onClick={handleNext} className="bg-indigo-500 hover:bg-indigo-650 text-white font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_4px_14px_rgba(99,102,241,0.3)]">
                                            Next Step
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: Project Qualifications & Existing Shingle Layers */}
                            {step === 4 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-extrabold text-white">Project Qualifications</h2>
                                        <p className="text-xs text-slate-400 mt-1">Specify shingle layers, timeline urgency, financing, and slope pitch.</p>
                                    </div>

                                    <div className="space-y-5">
                                        {/* Shingle Layers Input */}
                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Existing Shingle Layers on Roof</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { value: '1', label: '1 Layer', desc: 'Standard tear-off' },
                                                    { value: '2', label: '2 Layers', desc: '+35% disposal fee' },
                                                    { value: '3', label: '3+ Layers', desc: '+65% heavy tear-off' }
                                                ].map((lay) => (
                                                    <button key={lay.value} type="button" onClick={() => handleSelectOption('layers', lay.value)} className={`p-3 rounded-xl border text-center flex flex-col items-center gap-0.5 transition-all ${formData.layers === lay.value ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-[#12182c] border-white/5 text-slate-400 hover:border-white/15'}`}>
                                                        <span className="text-xs font-bold">{lay.label}</span>
                                                        <span className="text-[9px] text-slate-500">{lay.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Grid Row 1: Timeline & Pitch */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project Timeline</label>
                                                <select id="timeline" value={formData.timeline} onChange={handleInputChange} className="w-full bg-[#12182c] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors">
                                                    <option value="Right away">🚨 Emergency Leak (Right away)</option>
                                                    <option value="Under 1 month">📅 Ready (Within 30 Days)</option>
                                                    <option value="1 - 3 months">🕒 Planning (Next 90 Days)</option>
                                                    <option value="Just planning">🔍 Just researching ballparks</option>
                                                </select>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Roof Slope Pitch</label>
                                                <select id="pitch" value={formData.pitch} onChange={handleInputChange} className="w-full bg-[#12182c] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors">
                                                    <option value="Flat">Flat Slope (0° - 10°)</option>
                                                    <option value="Standard">Standard walkable pitch</option>
                                                    <option value="Steep">Very Steep (Scaffolding required)</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Grid Row 2: Funding & Age */}
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Funding / Billing Mode</label>
                                            <select id="insurance" value={formData.insurance} onChange={handleInputChange} className="w-full bg-[#12182c] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors">
                                                <option value="Cash / Direct Financing">💰 Out of Pocket / Direct Financing</option>
                                                <option value="Filing Insurance Claim">🛡️ Filing Storm/Wind Insurance Claim</option>
                                                <option value="Need Insurance Assistance">🤝 Need Insurance Inspector Representation</option>
                                            </select>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Shingle Layer Age</label>
                                            <select id="roofAge" value={formData.roofAge} onChange={handleInputChange} className="w-full bg-[#12182c] border border-white/10 rounded-xl px-3.5 py-3 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors">
                                                <option value="Under 10 years">🆕 Under 10 Years</option>
                                                <option value="10 - 20 years">⏱️ 10 - 20 Years</option>
                                                <option value="20+ years">⏳ 20+ Years (End of lifecycle)</option>
                                                <option value="Unsure">❓ Unsure of Age</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                                        <button onClick={handlePrev} className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors">
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                            Back
                                        </button>
                                        <button onClick={handleNext} className="bg-indigo-500 hover:bg-indigo-650 text-white font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-[0_4px_14px_rgba(99,102,241,0.3)]">
                                            Next Step
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 5: Inspection Scheduling Picker (Wizard Embedded!) */}
                            {step === 5 && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-extrabold text-white">Schedule Inspection Site Visit</h2>
                                        <p className="text-xs text-slate-400 mt-1">Book your free on-site physical slope measurement scan.</p>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="appointmentDate">Select Preferred Date</label>
                                            <input type="date" id="appointmentDate" min={todayStr} required value={formData.appointmentDate} onChange={handleInputChange} className="w-full bg-[#12182c] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                                        </div>

                                        <div className="flex flex-col gap-2.5">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Preferred Time Slot</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {[
                                                    { label: '🌅 Morning (9:00 AM - 11:00 AM)', val: 'Morning (9AM-11AM)' },
                                                    { label: '☀️ Midday (11:00 AM - 1:00 PM)', val: 'Midday (11AM-1PM)' },
                                                    { label: '🕒 Afternoon (1:00 PM - 3:00 PM)', val: 'Afternoon (1PM-3PM)' },
                                                    { label: '🌆 Late Afternoon (3:00 PM - 5:00 PM)', val: 'Late Afternoon (3PM-5PM)' }
                                                ].map((slot) => (
                                                    <button key={slot.val} type="button" onClick={() => handleSelectOption('appointmentTime', slot.val)} className={`px-4 py-3 rounded-xl border text-left text-xs font-bold transition-all ${formData.appointmentTime === slot.val ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-[#12182c] border-white/5 text-slate-400 hover:border-white/10'}`}>
                                                        {slot.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
                                        <button onClick={handlePrev} className="text-slate-400 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors" disabled={submitting}>
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                                            Back
                                        </button>
                                        <button onClick={handleSubmit} disabled={submitting} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(16,185,129,0.3)]">
                                            {submitting ? 'Generating Estimate...' : 'Generate My Estimate'}
                                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Calculations Disclaimer */}
                            <p className="mt-6 text-[10px] text-slate-550 leading-normal border-t border-white/5 pt-4 text-left">
                                * Disclaimer: The calculations shown are preliminary budget estimates. Final pricing requires a physical inspection to verify slope pitch, access configuration, and material adjustments.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500 bg-[#070a13] mt-12 flex flex-col gap-2 items-center">
                <p>&copy; {new Date().getFullYear()} Quotramax. All rights reserved.</p>
                <p className="text-[11px] text-slate-400">
                    Are you a contractor?{' '}
                    <span onClick={() => router.push('/login')} className="text-indigo-400 hover:underline hover:text-indigo-300 cursor-pointer font-bold">
                        Contractor Sign In Portal
                    </span>
                </p>
            </footer>
        </div>
    );
}
