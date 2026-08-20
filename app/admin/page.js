'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Admin() {
    const router = useRouter();
    const [leads, setLeads] = useState([]);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('leads'); // 'leads' or 'settings'
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedLead, setSelectedLead] = useState(null);

    // Settings form states
    const [settingsForm, setSettingsForm] = useState({
        contractorEmail: '',
        territoryZips: '',
        companyName: '',
        companyPhone: '',
        adminUsername: '',
        adminPassword: ''
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsSuccess, setSettingsSuccess] = useState(false);
    const [settingsError, setSettingsError] = useState('');

    useEffect(() => {
        // Fetch leads (which acts as auth check)
        fetch('/api/leads')
            .then(res => {
                if (res.status === 401) {
                    router.push('/login');
                    throw new Error('Unauthorized');
                }
                return res.json();
            })
            .then(data => {
                setLeads(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
            });

        // Fetch settings
        fetch('/api/settings')
            .then(res => {
                if (res.status === 401) return null;
                return res.json();
            })
            .then(data => {
                if (data) {
                    setSettings(data);
                    setSettingsForm({
                        contractorEmail: data.contractorEmail || 'isaaqabukar1@gmail.com',
                        territoryZips: data.territoryZips || '34652, 34653, 34654, 34655',
                        companyName: data.companyName || 'Quotramax Certified Roofing',
                        companyPhone: data.companyPhone || '(555) 234-5678',
                        adminUsername: data.adminUsername || 'admin',
                        adminPassword: '' // Blank for security
                    });
                }
            })
            .catch(err => console.error(err));
    }, [router]);

    const handleLogout = async () => {
        await fetch('/api/logout', { method: 'POST' });
        router.push('/login');
    };

    const handleStatusChange = async (leadId, newStatus) => {
        try {
            const res = await fetch(`/api/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            const result = await res.json();
            if (result.success) {
                setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
                if (selectedLead && selectedLead.id === leadId) {
                    setSelectedLead(prev => ({ ...prev, status: newStatus }));
                }
            }
        } catch (e) {
            console.error('Error patching lead status:', e);
        }
    };

    const handleSettingsSave = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        setSettingsSuccess(false);
        setSettingsError('');

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settingsForm)
            });
            const result = await res.json();
            if (result.success) {
                setSettingsSuccess(true);
                setSettingsForm(prev => ({ ...prev, adminPassword: '' }));
            } else {
                setSettingsError(result.error || 'Failed to save settings');
            }
        } catch (err) {
            console.error(err);
            setSettingsError('Connection failed.');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSettingsInputChange = (e) => {
        const { id, value } = e.target;
        setSettingsForm(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleClearLeads = async () => {
        if (!confirm('Are you absolutely sure you want to clear ALL leads? This cannot be undone.')) return;

        try {
            const res = await fetch('/api/leads/clear', { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                setLeads([]);
                setSelectedLead(null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleExportCSV = () => {
        if (filteredLeads.length === 0) {
            alert('No leads matching current search/filter criteria to export.');
            return;
        }

        const headers = [
            'Lead ID',
            'Date Created',
            'Status',
            'Name',
            'Email',
            'Phone',
            'Address',
            'Zip',
            'Service Scope',
            'Stories',
            'Slope Pitch',
            'Material',
            'Timeline',
            'Financing / Payment',
            'Scheduled Inspection Date',
            'Scheduled Inspection Time'
        ];

        const rows = filteredLeads.map(lead => [
            lead.id || '',
            lead.date ? new Date(lead.date).toISOString().split('T')[0] : '',
            lead.status || 'New',
            lead.name || '',
            lead.email || '',
            lead.phone || '',
            lead.address || '',
            lead.zip || '',
            lead.service || '',
            lead.stories || '',
            lead.pitch || '',
            lead.material || '',
            lead.timeline || '',
            lead.insurance || '',
            lead.appointment?.date || '',
            lead.appointment?.time || ''
        ]);

        const escapeCSVField = (field) => {
            const str = String(field ?? '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        const csvContent = [
            headers.map(escapeCSVField).join(','),
            ...rows.map(row => row.map(escapeCSVField).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const timestamp = new Date().toISOString().split('T')[0];
        link.setAttribute('download', `quotramax_qualified_leads_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col items-center justify-center font-sans">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-semibold text-slate-400">Opening Contractor CRM Console...</span>
                </div>
            </div>
        );
    }

    // Filter leads
    const filteredLeads = leads.filter(lead => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
            lead.name.toLowerCase().includes(query) ||
            lead.email.toLowerCase().includes(query) ||
            lead.address.toLowerCase().includes(query) ||
            lead.id.toLowerCase().includes(query);

        const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // KPI Metrics
    const totalLeadsCount = leads.length;
    const newLeadsCount = leads.filter(l => l.status === 'New' || l.status === 'New Lead').length;
    const scheduledCount = leads.filter(l => l.status === 'Inspection Scheduled').length;
    const wonCount = leads.filter(l => l.status === 'Won').length;
    const bookingRate = totalLeadsCount > 0 ? Math.round((scheduledCount / totalLeadsCount) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
            
            {/* Nav */}
            <header className="border-b border-white/5 bg-[#070a13]/80 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap gap-3 justify-between items-center">
                    <div className="flex items-center gap-2">
                        <svg className="w-6 h-6 sm:w-7 sm:h-7 text-teal-400 filter drop-shadow-[0_0_8px_rgba(20,184,166,0.5)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">QUOTRA<span className="text-teal-400">MAX</span></span>
                        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest text-teal-300 border border-teal-500/20 bg-teal-500/10 rounded px-2 py-0.5 ml-2">Contractor CRM</span>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-6 ml-auto order-3 sm:order-none w-full sm:w-auto justify-between sm:justify-start">
                        <nav className="flex gap-1 bg-slate-900/80 p-1 rounded-lg border border-white/5 flex-grow sm:flex-grow-0">
                            <button onClick={() => setActiveTab('leads')} className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'leads' ? 'bg-teal-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(20,184,166,0.3)]' : 'text-slate-400 hover:text-white'}`}>
                                Qualified Leads
                            </button>
                            <button onClick={() => setActiveTab('settings')} className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeTab === 'settings' ? 'bg-teal-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(20,184,166,0.3)]' : 'text-slate-400 hover:text-white'}`}>
                                Notifications &amp; Territory
                            </button>
                        </nav>

                        <button onClick={handleLogout} className="text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1.5 flex-shrink-0">
                            🚪 <span className="hidden xs:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Dashboard Workspace */}
            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">

                {activeTab === 'leads' && (
                    <div className="space-y-6 sm:space-y-8">

                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                            <div className="border border-white/5 rounded-xl bg-slate-900/40 p-3.5 sm:p-5 shadow-lg">
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5 sm:mb-2">Total Inquiries</span>
                                <div className="text-2xl sm:text-3xl font-extrabold text-white">{totalLeadsCount}</div>
                            </div>
                            <div className="border border-white/5 rounded-xl bg-slate-900/40 p-3.5 sm:p-5 shadow-lg">
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5 sm:mb-2">New Unassigned</span>
                                <div className="text-2xl sm:text-3xl font-extrabold text-teal-400">{newLeadsCount}</div>
                            </div>
                            <div className="border border-white/5 rounded-xl bg-slate-900/40 p-3.5 sm:p-5 shadow-lg">
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5 sm:mb-2">Inspections Booked</span>
                                <div className="text-2xl sm:text-3xl font-extrabold text-amber-400">{scheduledCount}</div>
                            </div>
                            <div className="border border-white/5 rounded-xl bg-slate-900/40 p-3.5 sm:p-5 shadow-lg">
                                <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 block uppercase tracking-wider mb-1.5 sm:mb-2">Calendar Booking Rate</span>
                                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{bookingRate}%</div>
                            </div>
                        </div>

                        {/* Search & Filter Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-slate-900/35 border border-white/5 p-3.5 sm:p-4 rounded-xl">
                            <div className="relative flex-grow md:max-w-md">
                                <input 
                                    type="text" 
                                    placeholder="Search by name, address, email, or lead ID..." 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                    className="w-full bg-[#070a13] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-teal-500 text-white transition-colors" 
                                />
                                <span className="absolute left-3 top-3.5 text-slate-500 text-xs">🔍</span>
                            </div>

                            <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Status:</span>
                                    <select 
                                        value={statusFilter} 
                                        onChange={(e) => setStatusFilter(e.target.value)} 
                                        className="bg-[#070a13] border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-teal-500 text-white">
                                        <option value="All">All Statuses</option>
                                        <option value="New">New Lead</option>
                                        <option value="Contacted">Contacted</option>
                                        <option value="Inspection Scheduled">Inspection Scheduled</option>
                                        <option value="Won">Won</option>
                                        <option value="Lost">Lost</option>
                                    </select>
                                </div>
                                <button 
                                    onClick={handleExportCSV} 
                                    className="text-xs font-semibold text-teal-300 hover:text-teal-200 transition-colors border border-teal-500/30 hover:border-teal-500/60 bg-teal-500/10 px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm">
                                    📊 Export CSV
                                </button>
                                <button 
                                    onClick={handleClearLeads} 
                                    className="text-xs font-semibold text-slate-500 hover:text-rose-400 transition-colors border border-white/5 hover:border-rose-500/20 bg-[#070a13] px-3 py-2 rounded-lg">
                                    🗑️ Clear Leads
                                </button>
                            </div>
                        </div>

                        {/* Lead Management: card list on mobile, table on desktop */}
                        {filteredLeads.length === 0 ? (
                            <div className="border border-white/5 rounded-xl bg-slate-900/20 py-12 text-center text-slate-500 font-semibold text-xs shadow-2xl">
                                No lead inspection requests found matching criteria.
                            </div>
                        ) : (
                            <>
                                {/* Mobile card list */}
                                <div className="grid grid-cols-1 gap-3 md:hidden">
                                    {filteredLeads.map((lead) => (
                                        <div key={lead.id} onClick={() => setSelectedLead(lead)} className="border border-white/5 rounded-xl bg-slate-900/40 p-4 shadow-lg active:bg-white/[0.03] transition-colors">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="min-w-0">
                                                    <span className="font-mono text-[10px] font-semibold text-teal-400">{lead.id}</span>
                                                    <div className="font-bold text-white text-sm truncate">{lead.name}</div>
                                                    <div className="text-[11px] text-teal-300 truncate">{lead.phone || lead.email}</div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                        lead.status === 'Inspection Scheduled' 
                                                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' 
                                                            : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                                                    }`}>
                                                        {lead.status || 'New'}
                                                    </span>
                                                    <div className="text-[10px] text-slate-500 mt-1">{new Date(lead.date).toLocaleDateString()}</div>
                                                </div>
                                            </div>

                                            <div className="mt-2.5 text-[11px] text-slate-300 truncate">📍 {lead.address}</div>

                                            <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                                                <span className="font-semibold text-slate-200">{lead.service}</span>
                                                <span className="text-slate-500">&bull;</span>
                                                <span className="text-slate-400">{lead.material}</span>
                                            </div>

                                            {lead.appointment && lead.appointment.date && (
                                                <div className="mt-2.5 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                                                    <span>📅</span> Booked: {lead.appointment.date} ({lead.appointment.time})
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop table */}
                                <div className="hidden md:block border border-white/5 rounded-xl bg-slate-900/20 overflow-hidden shadow-2xl">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                    <th className="py-4 px-6">Lead ID</th>
                                                    <th className="py-4 px-6">Homeowner</th>
                                                    <th className="py-4 px-6">Property Address</th>
                                                    <th className="py-4 px-6">Scope &amp; Material</th>
                                                    <th className="py-4 px-6">Timeline &amp; Funding</th>
                                                    <th className="py-4 px-6">Inspection Status</th>
                                                    <th className="py-4 px-6">Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                                                {filteredLeads.map((lead) => (
                                                    <tr key={lead.id} onClick={() => setSelectedLead(lead)} className="hover:bg-white/[0.02] cursor-pointer transition-colors">
                                                        <td className="py-4 px-6 font-mono font-semibold text-teal-400">{lead.id}</td>
                                                        <td className="py-4 px-6 font-bold text-white">
                                                            {lead.name}
                                                            <span className="block text-[11px] font-normal text-teal-300 mt-0.5">{lead.phone || lead.email}</span>
                                                        </td>
                                                        <td className="py-4 px-6 text-slate-300 max-w-[200px] truncate">{lead.address}</td>
                                                        <td className="py-4 px-6">
                                                            <span className="font-semibold block text-white">{lead.service}</span>
                                                            <span className="text-[10px] text-slate-400 block mt-0.5">{lead.stories} &bull; {lead.material}</span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="text-amber-400 font-semibold block">{lead.timeline}</span>
                                                            <span className="text-[10px] text-emerald-400 block mt-0.5">{lead.insurance}</span>
                                                        </td>
                                                        <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                                                            <select 
                                                                value={lead.status} 
                                                                onChange={(e) => handleStatusChange(lead.id, e.target.value)} 
                                                                className={`px-2.5 py-1.5 rounded-lg font-bold border text-[10px] outline-none focus:border-teal-500 cursor-pointer ${
                                                                    lead.status === 'New' || lead.status === 'New Lead' ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' :
                                                                    lead.status === 'Contacted' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' :
                                                                    lead.status === 'Inspection Scheduled' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                                                                    lead.status === 'Won' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                                                                    'bg-slate-800 border-white/5 text-slate-400'
                                                                }`}>
                                                                <option value="New Lead">New Lead</option>
                                                                <option value="Contacted">Contacted</option>
                                                                <option value="Inspection Scheduled">Inspection Scheduled</option>
                                                                <option value="Won">Won</option>
                                                                <option value="Lost">Lost</option>
                                                            </select>
                                                            {lead.appointment && lead.appointment.date && (
                                                                <span className="block text-[9px] font-bold text-amber-400 mt-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-center truncate max-w-[140px]">
                                                                    📅 {lead.appointment.date}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-6 text-slate-500">
                                                            {new Date(lead.date).toLocaleDateString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}

                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="max-w-2xl mx-auto">
                        <div className="border border-white/5 rounded-2xl bg-slate-900/50 backdrop-blur-xl p-5 sm:p-8 shadow-2xl overflow-hidden relative before:absolute before:top-0 before:left-0 before:w-full before:height-[3px] before:bg-gradient-to-r before:from-teal-500 before:to-emerald-400">
                            <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Notification &amp; Dispatch Settings</h2>
                            <p className="text-sm text-slate-400 mb-6 sm:mb-8">Configure your business notifications and territory dispatch rules.</p>

                            {settingsSuccess && (
                                <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-lg text-center font-semibold">
                                    ✓ Settings saved successfully.
                                </div>
                            )}

                            {settingsError && (
                                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm rounded-lg text-center">
                                    {settingsError}
                                </div>
                            )}

                            <form onSubmit={handleSettingsSave} className="space-y-5">
                                <div>
                                    <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1" htmlFor="contractorEmail">
                                        Primary Lead Alert Email *
                                    </label>
                                    <input 
                                        id="contractorEmail" 
                                        type="email" 
                                        value={settingsForm.contractorEmail} 
                                        onChange={handleSettingsInputChange} 
                                        className="w-full bg-[#070a13] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500" 
                                    />
                                    <span className="text-[11px] text-slate-500 mt-1 block">New inspection bookings and homeowner dossiers will dispatch immediately to this email.</span>
                                </div>

                                <div>
                                    <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1" htmlFor="territoryZips">
                                        Licensed Service ZIP Codes (Comma Separated)
                                    </label>
                                    <input 
                                        id="territoryZips" 
                                        type="text" 
                                        value={settingsForm.territoryZips} 
                                        onChange={handleSettingsInputChange} 
                                        placeholder="e.g., 34652, 34653, 34654" 
                                        className="w-full bg-[#070a13] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500" 
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1" htmlFor="companyName">
                                            Contractor Business Name
                                        </label>
                                        <input 
                                            id="companyName" 
                                            type="text" 
                                            value={settingsForm.companyName} 
                                            onChange={handleSettingsInputChange} 
                                            className="w-full bg-[#070a13] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1" htmlFor="companyPhone">
                                            Dispatch Phone Number
                                        </label>
                                        <input 
                                            id="companyPhone" 
                                            type="text" 
                                            value={settingsForm.companyPhone} 
                                            onChange={handleSettingsInputChange} 
                                            className="w-full bg-[#070a13] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500" 
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-white/5 pt-4">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Admin Portal Security</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1" htmlFor="adminUsername">Username</label>
                                            <input 
                                                id="adminUsername" 
                                                type="text" 
                                                value={settingsForm.adminUsername} 
                                                onChange={handleSettingsInputChange} 
                                                className="w-full bg-[#070a13] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1" htmlFor="adminPassword">New Password (Optional)</label>
                                            <input 
                                                id="adminPassword" 
                                                type="password" 
                                                value={settingsForm.adminPassword} 
                                                onChange={handleSettingsInputChange} 
                                                placeholder="Leave blank to keep current" 
                                                className="w-full bg-[#070a13] border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={savingSettings} 
                                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(20,184,166,0.3)] mt-6">
                                    {savingSettings ? 'Saving Settings...' : 'Save Dispatch Settings'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

            </main>

            {/* Lead Details Modal Overlay Drawer */}
            {selectedLead && (
                <div className="fixed inset-0 bg-[#070a13]/85 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-6" onClick={() => setSelectedLead(null)}>
                    <div className="border border-white/15 bg-slate-900 w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl relative max-h-[92vh] sm:max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedLead(null)} className="sticky top-4 z-10 float-right mr-4 sm:mr-8 -mb-8 text-slate-500 hover:text-white font-bold text-2xl leading-none transition-colors bg-slate-900/80 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center">
                            ×
                        </button>

                        <div className="p-5 sm:p-8 space-y-6">
                            
                            {/* Lead Header */}
                            <div>
                                <span className="text-[10px] font-bold text-teal-400 border border-teal-500/20 bg-teal-500/10 px-2.5 py-0.5 rounded uppercase tracking-wider font-mono">{selectedLead.id}</span>
                                <h3 className="text-2xl font-bold text-white mt-2">{selectedLead.name}</h3>
                                <p className="text-xs text-slate-400 mt-1">Submitted on {new Date(selectedLead.date).toLocaleString()}</p>
                            </div>

                            {/* Scheduled Appointment Alert inside modal */}
                            {selectedLead.appointment && selectedLead.appointment.date && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center gap-3 text-amber-400">
                                    <span className="text-2xl">📅</span>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider block text-slate-400">Confirmed Inspection Booking</span>
                                        <strong className="text-sm text-white">
                                            {new Date(selectedLead.appointment.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        </strong>
                                        <span className="block text-xs font-semibold mt-0.5 text-amber-300">Time Slot: {selectedLead.appointment.time}</span>
                                    </div>
                                </div>
                            )}

                            <hr className="border-white/5" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                
                                {/* Info block */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">Homeowner Contact</h4>
                                    <div>
                                        <span className="text-slate-500 block">Phone Number:</span>
                                        <a href={`tel:${selectedLead.phone}`} className="text-teal-400 font-bold hover:underline block text-sm">{selectedLead.phone || 'Not provided'}</a>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Email Address:</span>
                                        <a href={`mailto:${selectedLead.email}`} className="text-indigo-400 font-semibold hover:underline block">{selectedLead.email}</a>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Property Street Address:</span>
                                        <span className="text-white block font-semibold leading-relaxed text-sm">{selectedLead.address}</span>
                                    </div>
                                </div>

                                {/* Qualifications block */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">Pre-Qualification Dossier</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-slate-500 block">Service Scope:</span>
                                            <span className="text-white font-bold">{selectedLead.service}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Desired Material:</span>
                                            <span className="text-teal-400 font-bold">{selectedLead.material}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Building Height:</span>
                                            <span className="text-white font-semibold">{selectedLead.stories}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Roof Pitch:</span>
                                            <span className="text-white font-semibold">{selectedLead.pitch}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Project Urgency:</span>
                                            <span className="text-amber-400 font-bold">{selectedLead.timeline}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500 block">Funding Plan:</span>
                                            <span className="text-emerald-400 font-bold">{selectedLead.insurance}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status Control */}
                            <div className="bg-[#070a13] border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-400">Update Lead Status:</span>
                                <select 
                                    value={selectedLead.status} 
                                    onChange={(e) => handleStatusChange(selectedLead.id, e.target.value)} 
                                    className="bg-slate-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-teal-500 cursor-pointer">
                                    <option value="New Lead">New Lead</option>
                                    <option value="Contacted">Contacted</option>
                                    <option value="Inspection Scheduled">Inspection Scheduled</option>
                                    <option value="Won">Won</option>
                                    <option value="Lost">Lost</option>
                                </select>
                            </div>

                            {/* Footer Actions */}
                            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
                                <button 
                                    onClick={() => setSelectedLead(null)} 
                                    className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs py-2.5 px-6 rounded-lg transition-colors">
                                    Close Review
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500 bg-[#070a13]">
                <p>&copy; {new Date().getFullYear()} Quotramax. All rights reserved.</p>
            </footer>
        </div>
    );
}
