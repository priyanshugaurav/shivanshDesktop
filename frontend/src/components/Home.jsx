import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, Package, Users, CreditCard, 
    ArrowUpRight, ChevronRight, AlertCircle, 
    MessageSquare, DollarSign, Wallet, Activity, Loader2, Phone
} from 'lucide-react';
import { 
    AreaChart, Area, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';
import { useEnquiries } from '../hooks/useEnquiries';

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
};

const Home = ({ theme: t, setActiveTab }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { data: leadsData } = useEnquiries('Enquiries');
    
    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ label: '', leads: [], isHot: false });

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/dashboard/stats', {
                    headers: { 'Authorization': localStorage.getItem('token') }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // --- LEAD PROCESSING ---
    const leadStats = React.useMemo(() => {
        if (!leadsData) return { total: 0, hot: [], warm: [], cold: [] };
        
        const hot = [];
        const warm = [];
        const cold = [];

        leadsData.forEach(row => {
            const detail = {
                name: row.Name || 'Unknown',
                phone: row.Phone || 'No Phone',
                date: row['Follow Up-3'] || row['Follow Up-2'] || row['Follow Up-1'] || row['Date Recorded']
            };

            if (row['Follow Up-3']) hot.push(detail);
            else if (row['Follow Up-1'] || row['Follow Up-2']) warm.push(detail);
            else cold.push(detail);
        });

        return { total: leadsData.length, hot, warm, cold };
    }, [leadsData]);

    // --- THEME UTILS ---
    const getThemeGradient = () => {
        if (t.primary.includes('emerald')) return 'from-emerald-500 to-emerald-700';
        if (t.primary.includes('blue')) return 'from-blue-500 to-blue-700';
        if (t.primary.includes('violet')) return 'from-violet-500 to-violet-700';
        if (t.primary.includes('rose')) return 'from-rose-500 to-rose-700';
        if (t.primary.includes('amber')) return 'from-amber-500 to-amber-700';
        return 'from-slate-700 to-slate-900';
    };
    const THEME_GRADIENT = getThemeGradient();
    const THEME_HEX = t.primary.includes('emerald') ? '#10b981' : '#3b82f6';

    const formatCurrency = (val) => {
        if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} L`;
        return `₹ ${val.toLocaleString()}`;
    };

    // --- MOCK DATA FOR CHARTS ---
    const salesData = [
        { name: 'Mon', value: 4000 },
        { name: 'Tue', value: 3000 },
        { name: 'Wed', value: 5000 },
        { name: 'Thu', value: 2780 },
        { name: 'Fri', value: 1890 },
        { name: 'Sat', value: 2390 },
        { name: 'Sun', value: 3490 },
    ];

    if (loading) {
        return (
            <div className="h-96 flex flex-col items-center justify-center space-y-4">
                <Loader2 size={40} className={`animate-spin ${t.text}`} />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Synchronizing Live Data...</p>
            </div>
        );
    }

    if (!stats) return <div className="text-center p-10">Error loading dashboard. Please refresh.</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans text-slate-800">
            
            {/* --- WELCOME HEADER --- */}
            <div className="flex justify-between items-end pb-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Good Morning, Admin
                    </h1>
                    <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider opacity-70">Showroom Overview • {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${t.primary} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${t.primary}`}></span>
                    </span>
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">System Live</span>
                </div>
            </div>

            {/* --- BENTO GRID LAYOUT --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[minmax(140px,auto)]">
                
                {/* 1. REVENUE HERO CARD */}
                <div 
                    onClick={() => setActiveTab('analytics')}
                    className={`col-span-1 md:col-span-2 p-6 rounded-[2.5rem] bg-gradient-to-br ${THEME_GRADIENT} text-white shadow-xl relative overflow-hidden group cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1`}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <TrendingUp size={18} />
                                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Monthly Net Profit</span>
                            </div>
                            <p className="text-5xl font-black tracking-tighter">{formatCurrency(stats.revenue.amount)}</p>
                            <p className="text-xs font-bold opacity-80 mt-2 flex items-center gap-1">
                                {Number(stats.revenue.growth) >= 0 ? '+' : ''}{stats.revenue.growth}% <span className="font-medium opacity-60">vs last month</span>
                            </p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
                            <ArrowUpRight size={22} />
                        </div>
                    </div>

                    <div className="h-[70px] w-full mt-4 -mb-2 opacity-50">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorSalesHome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#fff" strokeWidth={3} fill="url(#colorSalesHome)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. ENQUIRY SUMMARY */}
                <div 
                    className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-slate-300 hover:shadow-xl transition-all"
                >
                    <div className="flex justify-between items-start" onClick={() => setActiveTab('enquiry')}>
                        <div className="cursor-pointer">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Leads</p>
                            <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{leadStats.total}</p>
                        </div>
                        <div className={`p-3 rounded-2xl ${t.light} ${t.text} group-hover:scale-110 transition-transform shadow-sm`}>
                            <MessageSquare size={20} />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button 
                            onClick={() => { setModalConfig({ label: 'Hot Leads', leads: leadStats.hot, isHot: true }); setModalOpen(true); }}
                            className="flex-1 bg-rose-50/50 rounded-2xl p-2 text-center border border-rose-100/50 hover:bg-rose-100 transition-colors"
                        >
                            <p className="text-[8px] font-black text-rose-400 uppercase tracking-tighter">Hot</p>
                            <p className="text-sm font-black text-rose-600">{leadStats.hot.length}</p>
                        </button>
                        <button 
                            onClick={() => { setModalConfig({ label: 'Warm Leads', leads: leadStats.warm, isHot: false }); setModalOpen(true); }}
                            className="flex-1 bg-amber-50/50 rounded-2xl p-2 text-center border border-amber-100/50 hover:bg-amber-100 transition-colors"
                        >
                            <p className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">Warm</p>
                            <p className="text-sm font-black text-amber-600">{leadStats.warm.length}</p>
                        </button>
                        <button 
                            onClick={() => { setModalConfig({ label: 'Cold Leads', leads: leadStats.cold, isHot: false }); setModalOpen(true); }}
                            className="flex-1 bg-slate-50/50 rounded-2xl p-2 text-center border border-slate-100 opacity-60 hover:opacity-100 hover:bg-slate-100 transition-colors"
                        >
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Cold</p>
                            <p className="text-sm font-black text-slate-500">{leadStats.cold.length}</p>
                        </button>
                    </div>
                </div>

                {/* 3. STOCK STATUS */}
                <div 
                    onClick={() => setActiveTab('stock')}
                    className="p-6 rounded-[2.5rem] bg-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer group transition-all hover:-translate-y-1 hover:shadow-2xl hover:bg-slate-800"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">In Stock</p>
                            <p className="text-4xl font-black mt-2 tracking-tight">{stats.inventory.total}</p>
                        </div>
                        <div className="p-3 bg-white/10 rounded-2xl text-amber-400 shadow-inner">
                            <Package size={20} />
                        </div>
                    </div>
                    <div className="relative z-10 mt-4">
                        <div className={`flex items-center gap-2 text-xs font-black mb-1 ${stats.inventory.alert === 'Stable' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            <AlertCircle size={14} /> {stats.inventory.alert === 'Stable' ? 'Inventory Healthy' : 'Low Stock Alert'}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium">{stats.inventory.alert === 'Stable' ? 'All models are sufficiently stocked.' : `Refill: ${stats.inventory.alert}`}</p>
                    </div>
                </div>

                {/* 4. DUES COLLECTION */}
                <div 
                    onClick={() => setActiveTab('dues')}
                    className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between cursor-pointer hover:border-slate-300 hover:shadow-xl transition-all group"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Market Dues</p>
                            <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{formatCurrency(stats.dues.amount)}</p>
                        </div>
                        <div className={`p-3 rounded-2xl ${t.light} ${t.text} group-hover:rotate-12 transition-transform shadow-sm`}>
                            <CreditCard size={20} />
                        </div>
                    </div>
                    <div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-4 shadow-inner">
                            <div className={`h-full bg-rose-500 shadow-lg shadow-rose-200`} style={{ width: stats.dues.amount > 0 ? '65%' : '0%' }}></div>
                        </div>
                        <div className="flex justify-between mt-3 px-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{stats.dues.customers} Defaulters</span>
                            <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">High Risk</span>
                        </div>
                    </div>
                </div>

                {/* 5. WORKFORCE */}
                <div 
                    onClick={() => setActiveTab('employees')}
                    className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between cursor-pointer hover:border-slate-300 hover:shadow-xl transition-all group lg:col-span-1"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff On-Duty</p>
                            <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{stats.staff.active}<span className="text-lg text-slate-300 mx-1">/</span><span className="text-lg text-slate-300 font-medium">{stats.staff.total}</span></p>
                        </div>
                        <div className={`p-3 rounded-2xl ${t.light} ${t.text} shadow-sm group-hover:scale-95 transition-transform`}>
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="flex -space-x-3 mt-4 items-center">
                        {[...Array(Math.min(4, stats.staff.active))].map((_, i) => (
                            <div key={i} className={`h-9 w-9 rounded-2xl ring-4 ring-white bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase`}>
                                S{i+1}
                            </div>
                        ))}
                        {stats.staff.active > 4 && (
                            <div className="h-9 w-9 rounded-2xl ring-4 ring-white bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">
                                +{stats.staff.active - 4}
                            </div>
                        )}
                        <span className="ml-4 text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Manage Workforce</span>
                    </div>
                </div>

                {/* 6. EXPENSE SNAPSHOT */}
                <div 
                    onClick={() => setActiveTab('expenses')}
                    className="col-span-1 md:col-span-2 p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-slate-300 hover:shadow-xl transition-all group"
                >
                    <div className="flex flex-col justify-center h-full">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Monthly Spend</p>
                        <p className="text-4xl font-black text-slate-900 mt-3 tracking-tighter">{formatCurrency(stats.expenses.amount)}</p>
                        <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-slate-500 bg-slate-50 py-2 px-3 rounded-2xl border border-slate-100 inline-flex w-fit">
                            <Activity size={14} className={t.text} /> 
                            <span className="uppercase tracking-widest">Payroll consumes {stats.expenses.payrollPercentage}%</span>
                        </div>
                    </div>
                    <div className="h-[100px] w-[140px] flex items-end gap-1 px-2">
                        {[40, 70, 45, 90, 65].map((h, i) => (
                            <div 
                                key={i} 
                                className={`flex-1 rounded-lg transition-all duration-500 group-hover:opacity-100 ${i === 3 ? THEME_HEX : 'bg-slate-100'} ${i === 3 ? 'shadow-lg shadow-emerald-100' : 'opacity-40'}`}
                                style={{ height: `${h}%` }}
                            />
                        ))}
                    </div>
                </div>

            </div>

            {/* --- QUICK ACTIONS ROW --- */}
            <div className="pt-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Showroom Actions</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                    <button onClick={() => setActiveTab('sales')} className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-100 rounded-3xl text-xs font-black text-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all whitespace-nowrap active:scale-95 group">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors"><DollarSign size={16}/></div> New Sale
                    </button>
                    <button onClick={() => setActiveTab('enquiry')} className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-100 rounded-3xl text-xs font-black text-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all whitespace-nowrap active:scale-95 group">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors"><MessageSquare size={16}/></div> Add Enquiry
                    </button>
                    <button onClick={() => setActiveTab('stock')} className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-100 rounded-3xl text-xs font-black text-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all whitespace-nowrap active:scale-95 group">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors"><Package size={16}/></div> Update Stock
                    </button>
                    <button onClick={() => setActiveTab('dues')} className="flex items-center gap-3 px-6 py-4 bg-white border border-slate-100 rounded-3xl text-xs font-black text-slate-700 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all whitespace-nowrap active:scale-95 group">
                        <div className="p-2 bg-rose-50 rounded-xl text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors"><Wallet size={16}/></div> Collect Payment
                    </button>
                </div>
            </div>

            {/* --- MODAL FOR LEAD DETAILS --- */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setModalOpen(false)}></div>
                    
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg z-10 overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{modalConfig.label}</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                                    {modalConfig.isHot ? 'High Priority Conversion' : 'Lead Tracking'} • {modalConfig.leads.length} Records
                                </p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-3 hover:bg-slate-200 rounded-2xl transition-colors bg-white shadow-sm border border-slate-100"><Users className="h-5 w-5 text-slate-500" /></button>
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {modalConfig.leads.length > 0 ? (
                                modalConfig.leads.map((lead, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.8rem] hover:shadow-xl hover:scale-[1.01] transition-all group border-l-4" style={{ borderColor: modalConfig.isHot ? '#f43f5e' : (modalConfig.label.includes('Warm') ? '#f59e0b' : '#cbd5e1') }}>
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-2xl ${modalConfig.isHot ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'} flex items-center justify-center shadow-inner`}>
                                                {modalConfig.isHot ? <Activity size={20} /> : <MessageSquare size={20} />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800">{lead.name}</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1 mt-1">
                                                    <Loader2 size={12} className="animate-spin" /> {formatDate(lead.date)}
                                                </p>
                                            </div>
                                        </div>
                                        <a href={`tel:${lead.phone}`} className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-95 font-mono">
                                            <Phone size={14} /> {lead.phone}
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <div className="p-20 text-center text-slate-300">
                                    <Activity className="h-16 w-16 mx-auto mb-4 opacity-10" />
                                    <p className="text-xs font-black uppercase tracking-[0.2em]">No leads available</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-slate-50/50 text-center border-t border-slate-100">
                            <button onClick={() => setModalOpen(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">Dismiss Detail View</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;