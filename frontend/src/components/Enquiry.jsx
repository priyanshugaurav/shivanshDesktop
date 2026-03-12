import React, { useState, useMemo } from 'react';
import { 
    Search, RefreshCw, Filter, Phone, MapPin, 
    Calendar, CheckCircle, X, Loader2, ChevronRight,
    User, SlidersHorizontal, Clock, ArrowUpRight, 
    Briefcase, Car, Hash, IndianRupee, Map
} from 'lucide-react';
import { useEnquiries } from '../hooks/useEnquiries';

// --- UTILS ---
const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?';

const getStatus = (row) => {
    if (row['Follow Up-3']) return { label: 'Hot Lead', color: 'text-rose-700 bg-rose-50 border-rose-200 ring-rose-100' };
    if (row['Follow Up-1']) return { label: 'In Progress', color: 'text-blue-700 bg-blue-50 border-blue-200 ring-blue-100' };
    return { label: 'New Lead', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 ring-emerald-100' };
};

const DetailRow = ({ icon: Icon, label, value }) => (
    <div className="flex flex-col gap-1 p-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            {Icon && <Icon className="h-3 w-3" />} {label}
        </span>
        <span className="text-sm font-medium text-slate-700 break-words">
            {value || <span className="text-slate-300 italic">N/A</span>}
        </span>
    </div>
);

const Enquiry = ({ theme }) => {
    const { data, loading, lastUpdated, refresh, closeEnquiry } = useEnquiries('Enquiries');
    
    // --- STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEnquiry, setSelectedEnquiry] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [isClosing, setIsClosing] = useState(null);
    const [filters, setFilters] = useState({ salesman: 'All', village: 'All', period: 'All' });

    // --- FILTER LOGIC ---
    const uniqueSalesmen = useMemo(() => ['All', ...new Set(data.map(d => d.Salesman).filter(Boolean))], [data]);
    const uniqueVillages = useMemo(() => ['All', ...new Set(data.map(d => d.Village).filter(Boolean))], [data]);

    const filteredData = useMemo(() => {
        return data.filter(row => {
            const searchMatch = !searchTerm || 
                row.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                row.Phone?.toString().includes(searchTerm) ||
                row.Village?.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (!searchMatch) return false;
            if (filters.salesman !== 'All' && row.Salesman !== filters.salesman) return false;
            if (filters.village !== 'All' && row.Village !== filters.village) return false;
            
            if (filters.period !== 'All') {
                const diffDays = Math.ceil(Math.abs(new Date() - new Date(row['Date Recorded'])) / (1000 * 60 * 60 * 24));
                if (filters.period === '7days' && diffDays > 7) return false;
                if (filters.period === '30days' && diffDays > 30) return false;
            }
            return true;
        });
    }, [data, searchTerm, filters]);

    const handleClose = async (phone) => {
        if(!window.confirm("Are you sure you want to close and archive this enquiry?")) return;
        setIsClosing(phone);
        const res = await closeEnquiry(phone);
        setIsClosing(null);
        if (res.success) setSelectedEnquiry(null);
        else alert(res.message);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] relative">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col space-y-4 mb-6 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enquiries</h1>
                        <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${theme.light} ${theme.text}`}>
                                {filteredData.length} Leads
                            </span>
                            {lastUpdated && <span>Synced {new Date(lastUpdated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${showFilters ? `${theme.light} ${theme.text} ${theme.border}` : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Filters
                        </button>
                        <button 
                            onClick={() => refresh()} 
                            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-95"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* --- COLLAPSIBLE FILTERS --- */}
                <div className={`grid transition-all duration-300 ease-out ${showFilters ? 'grid-rows-[1fr] opacity-100 mb-2' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className={`${showFilters ? 'flex' : 'hidden'} flex-wrap gap-3 items-center overflow-hidden`}>
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" placeholder="Search leads..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 transition-all shadow-sm"
                            />
                        </div>
                        {['salesman', 'village', 'period'].map(key => (
                            <select 
                                key={key}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-slate-400 cursor-pointer capitalize shadow-sm"
                                value={filters[key]}
                                onChange={e => setFilters({...filters, [key]: e.target.value})}
                            >
                                <option value="All">All {key}s</option>
                                {key === 'salesman' && uniqueSalesmen.filter(s => s!=='All').map(s => <option key={s} value={s}>{s}</option>)}
                                {key === 'village' && uniqueVillages.filter(v => v!=='All').map(v => <option key={v} value={v}>{v}</option>)}
                                {key === 'period' && <><option value="7days">Last 7 Days</option><option value="30days">Last 30 Days</option></>}
                            </select>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- IMPROVED TABLE --- */}
            <div className="flex-1 overflow-hidden bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-200 relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className={`h-8 w-8 ${theme.text} animate-spin`} />
                    </div>
                )}

                <div className="h-full overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer Profile</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Requirement</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Timeline</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredData.map((row, idx) => {
                                const status = getStatus(row);
                                const isSelected = selectedEnquiry?.Phone === row.Phone;
                                
                                return (
                                    <tr 
                                        key={idx} 
                                        onClick={() => setSelectedEnquiry(row)}
                                        className={`
                                            group cursor-pointer transition-all duration-200
                                            ${isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/80'}
                                        `}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3.5">
                                                <div className={`
                                                    w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm
                                                    ${isSelected ? `${theme.primary} text-white shadow-md scale-105` : `bg-white border border-slate-200 text-slate-600 group-hover:border-${theme.primary.split('-')[1]}-300`}
                                                `}>
                                                    {getInitials(row.Name)}
                                                </div>
                                                <div>
                                                    <div className={`text-sm font-bold ${isSelected ? theme.text : 'text-slate-800'}`}>{row.Name}</div>
                                                    <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                                                        <Phone className="h-3 w-3" /> {row.Phone}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-sm font-semibold text-slate-700">{row.Model}</span>
                                                <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit max-w-[150px] truncate">
                                                    {row['Model Type']}
                                                </span>
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                                    Recorded: <span className="text-slate-700 font-medium">{new Date(row['Date Recorded']).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                                </span>
                                                {row['Expected Date'] && (
                                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded w-fit flex items-center gap-1">
                                                        <Clock className="h-2.5 w-2.5" /> {new Date(row['Expected Date']).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ring-1 ring-inset uppercase tracking-wide ${status.color}`}>
                                                <span className="relative flex h-2 w-2">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current"></span>
                                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                                                </span>
                                                {status.label}
                                            </span>
                                        </td>
                                        
                                        <td className="px-6 py-4 text-right">
                                            <div className={`p-2 rounded-full inline-block transition-all ${isSelected ? 'bg-white shadow-sm text-slate-900' : 'text-slate-300 group-hover:text-slate-600 group-hover:translate-x-1'}`}>
                                                <ChevronRight className="h-4 w-4" />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    
                    {filteredData.length === 0 && !loading && (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <div className="p-4 bg-slate-50 rounded-full mb-3">
                                <Search className="h-8 w-8 opacity-40" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">No leads found</p>
                            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- COMPREHENSIVE MODAL --- */}
            {selectedEnquiry && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[4px] z-40 animate-fade-in"
                        onClick={() => setSelectedEnquiry(null)}
                    />
                    
                    {/* Drawer */}
                    <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200 animate-slide-in">
                        
                        {/* 1. Header */}
                        <div className={`px-6 py-5 shrink-0 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`h-14 w-14 rounded-full ${theme.primary} flex items-center justify-center text-xl font-bold text-white shadow-lg`}>
                                        {getInitials(selectedEnquiry.Name)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{selectedEnquiry.Name}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                                                <Phone className="h-3 w-3" /> {selectedEnquiry.Phone}
                                            </span>
                                            <a href={`tel:${selectedEnquiry.Phone}`} className={`p-1 rounded-full ${theme.light} ${theme.text} hover:scale-110 transition-transform`}>
                                                <Phone className="h-3 w-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedEnquiry(null)}
                                    className="p-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* 2. Scrollable Content - The "Source of Truth" */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                            
                            {/* SECTION: Customer Context */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" /> Customer Context
                                </h3>
                                <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-white"><DetailRow icon={MapPin} label="Village" value={selectedEnquiry.Village} /></div>
                                    <div className="bg-white"><DetailRow icon={Map} label="Location" value={selectedEnquiry.Location} /></div>
                                    <div className="bg-white"><DetailRow icon={Hash} label="Pincode" value={selectedEnquiry.Pincode} /></div>
                                    <div className="bg-white"><DetailRow icon={IndianRupee} label="Income Source" value={selectedEnquiry['Income Source']} /></div>
                                </div>
                            </section>

                            {/* SECTION: Product Interest */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Car className="h-4 w-4 text-slate-400" /> Product Interest
                                </h3>
                                <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-white"><DetailRow label="Model" value={selectedEnquiry.Model} /></div>
                                    <div className="bg-white"><DetailRow label="Model Type" value={selectedEnquiry['Model Type']} /></div>
                                    <div className="bg-white col-span-2"><DetailRow label="Model Detail" value={selectedEnquiry['Model Detail']} /></div>
                                    <div className="bg-white col-span-2"><DetailRow label="Model Nature" value={selectedEnquiry['Model Nature']} /></div>
                                </div>
                            </section>

                            {/* SECTION: Sales Context */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-slate-400" /> Sales Context
                                </h3>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                                <Briefcase className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Assigned Salesman</div>
                                                <div className="text-sm font-semibold text-slate-800">{selectedEnquiry.Salesman || 'Unassigned'}</div>
                                            </div>
                                        </div>
                                        {selectedEnquiry['Expected Date'] && (
                                            <div className="text-right">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Expected Closure</div>
                                                <div className="text-sm font-bold text-amber-600">{new Date(selectedEnquiry['Expected Date']).toLocaleDateString()}</div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-3 border-t border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Initial Request</div>
                                        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                                            "{selectedEnquiry.Message || 'No initial notes.'}"
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* SECTION: Activity Feed */}
                            <section>
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-slate-400" /> Interaction History
                                </h3>
                                <div className="relative border-l-2 border-slate-200 ml-2 space-y-6 pb-2">
                                    {[1, 2, 3, 4, 5, 6].map(num => {
                                        const date = selectedEnquiry[`Follow Up-${num}`];
                                        const msg = selectedEnquiry[`Message-${num}`];
                                        if (!date && !msg) return null;

                                        return (
                                            <div key={num} className="pl-6 relative">
                                                <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${date ? theme.primary : 'bg-slate-300'}`}></div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-slate-700">Follow Up {num}</span>
                                                    {date && <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{new Date(date).toLocaleDateString()}</span>}
                                                </div>
                                                <p className="text-sm text-slate-600 leading-relaxed">{msg || "No notes."}</p>
                                            </div>
                                        )
                                    })}
                                    {/* Empty state for history */}
                                    {!selectedEnquiry['Follow Up-1'] && (
                                        <div className="pl-6 text-sm text-slate-400 italic">No follow-ups recorded yet.</div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* 3. Footer Actions */}
                        <div className="p-5 bg-white border-t border-slate-200 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                            <button 
                                onClick={() => handleClose(selectedEnquiry.Phone)}
                                disabled={isClosing === selectedEnquiry.Phone}
                                className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {isClosing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                Archive Lead
                            </button>
                            <a 
                                href={`tel:${selectedEnquiry.Phone}`}
                                className={`flex-[1.5] py-3 text-sm font-semibold text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 ${theme.primary}`}
                            >
                                <Phone className="h-4 w-4" />
                                Call Now
                            </a>
                        </div>
                    </div>
                </>
            )}

            {/* --- CSS ANIMATIONS --- */}
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-slide-in {
                    animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default Enquiry;