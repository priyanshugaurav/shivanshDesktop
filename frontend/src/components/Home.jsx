import React, { useState, useEffect, useMemo } from 'react';
import { 
    TrendingUp, Package, Users, Calendar, 
    ArrowUpRight, AlertCircle, MessageSquare, 
    Activity, Loader2, Phone, Filter, ChevronDown, PenTool,
    Target, Clock, Download, Briefcase, Zap, CheckCircle2,
    Layers, LayoutDashboard, Truck
} from 'lucide-react';
import { 
    AreaChart, Area, ResponsiveContainer, BarChart, Bar, 
    PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
    ComposedChart, Line, RadarChart, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, Radar, RadialBarChart, RadialBar
} from 'recharts';
import { useEnquiries } from '../hooks/useEnquiries';

const Home = ({ theme: t }) => {
    // --- STATE MANAGEMENT ---
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [timeRange, setTimeRange] = useState('This Month');
    const [customMonth, setCustomMonth] = useState(new Date().toLocaleString('default', { month: 'short' }));
    const [customYear, setCustomYear] = useState(new Date().getFullYear().toString());
    const [selectedBranch, setSelectedBranch] = useState('All Branches');

    const { data: leadsData } = useEnquiries('Enquiries');
    
    // --- THEME UTILS ---
    const getThemeHex = () => {
        if (t.primary.includes('emerald')) return '#10b981';
        if (t.primary.includes('blue')) return '#3b82f6';
        if (t.primary.includes('violet')) return '#8b5cf6';
        if (t.primary.includes('amber')) return '#f59e0b';
        if (t.primary.includes('rose')) return '#f43f5e';
        return '#64748b';
    };
    const THEME_COLOR = getThemeHex();
    
    const getGradientClass = () => {
        if (t.primary.includes('emerald')) return 'from-emerald-500 to-emerald-700';
        if (t.primary.includes('blue')) return 'from-blue-500 to-blue-700';
        if (t.primary.includes('violet')) return 'from-violet-500 to-violet-700';
        if (t.primary.includes('amber')) return 'from-amber-500 to-amber-700';
        if (t.primary.includes('rose')) return 'from-rose-500 to-rose-700';
        return 'from-slate-700 to-slate-900';
    };
    const THEME_GRADIENT = getGradientClass();

    const COLORS = [THEME_COLOR, '#334155', '#94a3b8', '#cbd5e1', '#e2e8f0'];

    // --- DATE RANGE LOGIC ---
    const getDateRange = React.useCallback(() => {
        const now = new Date();
        let start, end;

        if (timeRange === 'This Month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        } else if (timeRange === 'Last Month') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        } else if (timeRange === 'Custom Month') {
            const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(customMonth);
            start = new Date(Number(customYear), m, 1);
            end = new Date(Number(customYear), m + 1, 0, 23, 59, 59);
        } else {
            return { startDate: null, endDate: null }; // All Time
        }
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    }, [timeRange, customMonth, customYear]);

    // --- DATA FETCHING ---
    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const { startDate, endDate } = getDateRange();
                let url = '/api/dashboard/non-monetary-analytics';
                if (startDate && endDate) {
                    url += `?startDate=${startDate}&endDate=${endDate}`;
                }
                const res = await fetch(url, {
                    headers: { 'Authorization': localStorage.getItem('token') }
                });
                if (!res.ok) throw new Error('Failed to fetch analytics');
                const data = await res.json();
                setStats(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching analytics:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [getDateRange]);

    // --- LEAD PROCESSING (Filtered locally by date) ---
    const leadStats = useMemo(() => {
        if (!leadsData) return { total: 0, hot: 0, warm: 0, cold: 0, list: [] };
        
        const { startDate, endDate } = getDateRange();
        const sTime = startDate ? new Date(startDate).getTime() : 0;
        const eTime = endDate ? new Date(endDate).getTime() : Infinity;

        let hot = 0, warm = 0, cold = 0;
        let list = [];

        leadsData.forEach(row => {
            const dateStr = row['Date Recorded'] || row['Follow Up-1'] || row['Follow Up-2'] || row['Follow Up-3'];
            const rowTime = new Date(dateStr).getTime();
            
            if (!isNaN(rowTime) && rowTime >= sTime && rowTime <= eTime) {
                if (row['Follow Up-3']) hot++;
                else if (row['Follow Up-1'] || row['Follow Up-2']) warm++;
                else cold++;
                
                list.push({
                    name: row.Name || 'Unknown',
                    phone: row.Phone || 'No Phone',
                    date: dateStr,
                    type: row['Follow Up-3'] ? 'Hot' : (row['Follow Up-1'] || row['Follow Up-2'] ? 'Warm' : 'Cold')
                });
            }
        });

        return { total: list.length, hot, warm, cold, list };
    }, [leadsData, getDateRange]);

    // --- CHART DATA PROCESSING ---
    const salesVolumeTrend = useMemo(() => {
        if (!stats?.sales?.trend) return [];
        const groups = {};
        stats.sales.trend.forEach(s => {
            const date = new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            groups[date] = (groups[date] || 0) + 1;
        });
        return Object.keys(groups).map(k => ({ date: k, count: groups[k] }));
    }, [stats]);

    const leadPieData = [
        { name: 'Hot', value: leadStats.hot },
        { name: 'Warm', value: leadStats.warm },
        { name: 'Cold', value: leadStats.cold }
    ].filter(d => d.value > 0);

    const funnelData = [
        { name: 'Total Leads', value: leadStats.total, fill: '#cbd5e1' },
        { name: 'Warm & Hot', value: leadStats.warm + leadStats.hot, fill: '#94a3b8' },
        { name: 'Hot Leads', value: leadStats.hot, fill: '#334155' },
        { name: 'Delivered', value: stats?.sales?.total || 0, fill: THEME_COLOR }
    ].map(f => ({
        ...f,
        percent: leadStats.total > 0 ? (f.value / leadStats.total) * 100 : 0
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${t.primary}`}></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-800">Error loading analytics</h3>
                <p className="text-red-600">{error}</p>
            </div>
        );
    }

    // --- KPI CARDS CONFIGURATION ---
    const staffActivePct = stats?.staff?.total ? Math.round((stats.staff.active / stats.staff.total) * 100) : 0;
    const conversionRate = leadStats.total > 0 ? Math.round((stats.sales.total / leadStats.total) * 100) : 0;

    const kpiCards = [
        { 
            id: 'delivered', title: 'Vehicles Delivered', value: stats?.sales?.total || 0, sub: 'units delivered', 
            icon: Truck, variant: 'primary', trend: '+0%' 
        },
        { 
            id: 'leads', title: 'Leads Generated', value: leadStats.total, sub: 'active pipeline', 
            icon: Target, variant: 'dark', trend: '+0%' 
        },
        { 
            id: 'stock', title: 'Live Stock', value: stats?.stock?.total || 0, sub: `Alert: ${stats?.stock?.alert || 'None'}`, 
            icon: Package, variant: 'dark', trend: '' 
        },
        { 
            id: 'spares', title: 'Spares Flow', value: stats?.spares?.totalSold || 0, sub: 'total items routed', 
            icon: Layers, variant: 'white', trend: '' 
        },
        { 
            id: 'staff', title: 'Active Staff', value: `${staffActivePct}%`, sub: `${stats?.staff?.active} of ${stats?.staff?.total} on duty`, 
            icon: Users, variant: 'white', trend: '' 
        },
        { 
            id: 'conversion', title: 'Conversion Rate', value: `${conversionRate}%`, sub: 'Sales / Leads ratio', 
            icon: Activity, variant: 'white', trend: '' 
        }
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans text-slate-800">
            
            {/* --- 1. HEADER & FLOATING DOCK --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 flex items-center gap-2">
                        Analytics <span className="text-slate-300 font-light">/</span> Overview
                    </h1>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-sm">
                            <span className={`w-2 h-2 rounded-full ${t.primary} animate-pulse`}></span>
                            <span className="uppercase tracking-wider text-[10px]">Live Volume Data</span>
                        </div>
                        <span className="text-slate-400">|</span>
                        <div className="flex items-center gap-1.5">
                            <Clock size={12} className="text-slate-400"/>
                            <span>Last updated: Just now</span>
                        </div>
                    </div>
                </div>

                {/* Floating Control Dock */}
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100">
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                        <select 
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="bg-white px-3 py-1.5 border border-slate-200 shadow-sm rounded-lg text-[10px] uppercase font-black text-slate-700 outline-none cursor-pointer"
                        >
                            <option value="This Month">This Month</option>
                            <option value="Last Month">Last Month</option>
                            <option value="Custom Month">Custom Month</option>
                            <option value="All Time">All Time</option>
                        </select>
                        
                        {timeRange === 'Custom Month' && (
                            <div className="flex items-center gap-1 animate-in fade-in zoom-in slide-in-from-left-2 duration-300">
                                <select 
                                    value={customMonth}
                                    onChange={(e) => setCustomMonth(e.target.value)}
                                    className="bg-white px-2 py-1.5 border border-slate-200 shadow-sm rounded-lg text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
                                >
                                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <select 
                                    value={customYear}
                                    onChange={(e) => setCustomYear(e.target.value)}
                                    className="bg-white px-2 py-1.5 border border-slate-200 shadow-sm rounded-lg text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
                                >
                                    {[2024, 2025, 2026, 2027].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="w-px h-8 bg-slate-100 mx-1"></div>

                    {/* Branch Filter */}
                    <div className="relative hidden md:block">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Filter size={12} className="text-slate-400" />
                        </div>
                        <select 
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="pl-9 pr-8 py-2.5 bg-white hover:bg-slate-50 border border-transparent rounded-xl text-[11px] font-bold text-slate-700 appearance-none focus:outline-none cursor-pointer transition-colors min-w-[140px]"
                        >
                            <option>All Branches</option>
                            <option>Jagadhri HQ</option>
                            <option>City Center</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                    </div>

                    <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ${t.primary}`}>
                        <Download size={14} /> <span className="hidden sm:inline">Report</span>
                    </button>
                </div>
            </div>

            {/* --- 2. HERO KPI CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {kpiCards.map((kpi) => {
                    const isPrimary = kpi.variant === 'primary';
                    const isDark = kpi.variant === 'dark';
                    
                    let cardClass = 'bg-white border-slate-200/60';
                    let textClass = 'text-slate-800';
                    let subClass = 'text-slate-400';
                    let iconBox = `${t.light} ${t.text}`;

                    if (isPrimary) {
                        cardClass = `bg-gradient-to-br ${THEME_GRADIENT} text-white border-transparent`;
                        textClass = 'text-white';
                        subClass = 'text-white/70';
                        iconBox = 'bg-white/20 text-white backdrop-blur-md';
                    } else if (isDark) {
                        cardClass = 'bg-slate-900 text-white border-transparent';
                        textClass = 'text-white';
                        subClass = 'text-slate-400';
                        iconBox = 'bg-slate-800 text-slate-300';
                    }

                    return (
                        <div key={kpi.id} className={`lg:col-span-2 p-6 rounded-[2rem] border ${cardClass} shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
                            {isPrimary && (
                                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-110"></div>
                            )}
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <kpi.icon size={14} className={isPrimary ? 'text-white/80' : 'text-slate-400'} />
                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isPrimary ? 'text-white/90' : 'text-slate-400'}`}>
                                            {kpi.title}
                                        </span>
                                    </div>
                                    <h3 className={`text-4xl font-black tracking-tighter ${textClass} mt-1`}>
                                        {kpi.value}
                                    </h3>
                                    <p className={`text-[11px] font-bold mt-2 flex items-center gap-1 ${subClass}`}>
                                        {kpi.sub}
                                    </p>
                                </div>
                                <div className={`p-3 rounded-2xl ${iconBox} shadow-inner`}>
                                    <kpi.icon size={20} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- 3. CHARTS GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sales Volume Trend */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Delivery Volume Trend</h3>
                            <p className="text-xs text-slate-400 font-bold">Daily vehicle dispatches</p>
                        </div>
                    </div>
                    <div className="h-72 w-full">
                        {salesVolumeTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={salesVolumeTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={THEME_COLOR} stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor={THEME_COLOR} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#1e293b', fontWeight: 800 }}
                                        labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}
                                    />
                                    <Area type="monotone" dataKey="count" fill="url(#colorCount)" stroke="none" />
                                    <Bar dataKey="count" barSize={20} fill={THEME_COLOR} radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="count" stroke={THEME_COLOR} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Activity size={32} className="mb-2 opacity-50"/>
                                <p className="text-xs font-bold uppercase tracking-widest">No Deliveries in Period</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Leads Quality */}
                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm flex flex-col">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Leads Quality</h3>
                    <div className="flex-1 min-h-[250px] relative">
                        {leadPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={leadPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={8}
                                    >
                                        {leadPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontWeight: 800, color: '#1e293b' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">No Leads<br/>In This Period</p>
                            </div>
                        )}
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-3xl font-black text-slate-800">{leadStats.total}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Leads</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-center gap-4 mt-2">
                        {leadPieData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversion Funnel */}
                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Conversion Funnel</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} width={80} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontWeight: 800, color: '#1e293b' }}
                                />
                                <Bar dataKey="value" barSize={24} radius={[0, 12, 12, 0]}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Moving Spares */}
                <div className="lg:col-span-2 bg-slate-900 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest mb-6 relative z-10 flex items-center gap-2">
                        <Layers size={16} className="text-slate-400" />
                        Top Moving Spares
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                        {stats?.spares?.topItems?.length > 0 ? (
                            stats.spares.topItems.map((item, index) => (
                                <div key={index} className="bg-slate-800/50 p-4 rounded-2xl flex justify-between items-center border border-slate-700 hover:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-black text-xs">
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white truncate max-w-[150px]">{item.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-emerald-400">{item.qty}</p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">units</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-8 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                                No spares data available
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Home;