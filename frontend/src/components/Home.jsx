import React, { useState, useEffect, useMemo } from 'react';
import { 
    TrendingUp, Package, Users, Calendar, 
    ArrowUpRight, AlertCircle, MessageSquare, 
    Activity, Loader2, Phone, Filter, ChevronDown, PenTool,
    Target, Clock, Download, Briefcase, Zap, CheckCircle2,
    Layers, LayoutDashboard, Truck, FileText, CheckCircle
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
                    model: row.Model || '-',
                    village: row.Village || '-',
                    date: dateStr,
                    type: row['Follow Up-3'] ? 'Hot' : (row['Follow Up-1'] || row['Follow Up-2'] ? 'Warm' : 'Cold')
                });
            }
        });

        // Sort leads by latest
        list.sort((a, b) => new Date(b.date) - new Date(a.date));

        return { total: list.length, hot, warm, cold, list };
    }, [leadsData, getDateRange]);

    // --- CHART DATA PROCESSING ---
    const salesVolumeTrend = useMemo(() => {
        if (!stats?.sales?.trend) return [];
        const groups = {};
        stats.sales.trend.forEach(s => {
            const date = new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (!groups[date]) groups[date] = { date, count: 0, models: [] };
            groups[date].count++;
            if (s.model) {
                groups[date].models.push(s.model);
            }
        });
        return Object.values(groups);
    }, [stats]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            
            // Count model occurrences for a cleaner list
            const modelCounts = {};
            if (data.models) {
                data.models.forEach(m => {
                    modelCounts[m] = (modelCounts[m] || 0) + 1;
                });
            }

            return (
                <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100 z-50">
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">{label}</p>
                    <div className="mb-2 flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-emerald-500">{data.count}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Units</span>
                    </div>
                    {Object.keys(modelCounts).length > 0 && (
                        <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Models Delivered:</p>
                            {Object.keys(modelCounts).map((m, i) => (
                                <div key={i} className="flex justify-between items-center gap-4 text-[10px]">
                                    <span className="font-bold text-slate-700 truncate max-w-[120px]">{m}</span>
                                    <span className="font-black text-slate-500">x{modelCounts[m]}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

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
            <div className="p-6 text-center bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-red-800">Error loading analytics</h3>
                <p className="text-sm text-red-600">{error}</p>
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
        <div className="space-y-5 animate-in fade-in duration-500 pb-16 font-sans text-slate-800 max-w-[1400px] mx-auto">
            
            {/* --- 1. HEADER & FLOATING DOCK --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1.5 flex items-center gap-2">
                        Analytics <span className="text-slate-300 font-light">/</span> Overview
                    </h1>
                    <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-slate-200 shadow-sm">
                            <span className={`w-1.5 h-1.5 rounded-full ${t.primary} animate-pulse`}></span>
                            <span className="uppercase tracking-wider">Live Volume Data</span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center gap-1">
                            <Clock size={10} className="text-slate-400"/>
                            <span>Last updated: Just now</span>
                        </div>
                        <span className="text-slate-300 hidden sm:inline">|</span>
                        <div className="hidden sm:flex items-center gap-1">
                            <Briefcase size={10} className="text-slate-400"/>
                            <span>Executive Summary</span>
                        </div>
                    </div>
                </div>

                {/* Floating Control Dock */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-md shadow-slate-200/50 border border-slate-100">
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-100">
                        <select 
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="bg-white px-2.5 py-1.5 border border-slate-200 shadow-sm rounded-md text-[9px] uppercase font-black text-slate-700 outline-none cursor-pointer"
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
                                    className="bg-white px-2 py-1.5 border border-slate-200 shadow-sm rounded-md text-[9px] font-bold text-slate-700 outline-none cursor-pointer"
                                >
                                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <select 
                                    value={customYear}
                                    onChange={(e) => setCustomYear(e.target.value)}
                                    className="bg-white px-2 py-1.5 border border-slate-200 shadow-sm rounded-md text-[9px] font-bold text-slate-700 outline-none cursor-pointer"
                                >
                                    {[2024, 2025, 2026, 2027].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="w-px h-6 bg-slate-100 mx-1"></div>

                    {/* Branch Filter */}
                    <div className="relative hidden md:block">
                        <div className="absolute inset-y-0 left-2 flex items-center pointer-events-none">
                            <Filter size={10} className="text-slate-400" />
                        </div>
                        <select 
                            value={selectedBranch}
                            onChange={(e) => setSelectedBranch(e.target.value)}
                            className="pl-7 pr-6 py-2 bg-white hover:bg-slate-50 border border-transparent rounded-lg text-[10px] font-bold text-slate-700 appearance-none focus:outline-none cursor-pointer transition-colors min-w-[120px]"
                        >
                            <option>All Branches</option>
                            <option>Jagadhri HQ</option>
                            <option>City Center</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={10} />
                    </div>

                    <button className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[9px] font-bold text-white shadow-sm hover:shadow hover:-translate-y-px transition-all ${t.primary}`}>
                        <Download size={12} /> <span className="hidden sm:inline">Export</span>
                    </button>
                </div>
            </div>

            {/* --- 2. HERO KPI CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                        <div key={kpi.id} className={`lg:col-span-2 p-4 rounded-[1.25rem] border ${cardClass} shadow-md shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-0.5 transition-all duration-300`}>
                            {isPrimary && (
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none transition-transform group-hover:scale-110"></div>
                            )}
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <kpi.icon size={12} className={isPrimary ? 'text-white/80' : 'text-slate-400'} />
                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isPrimary ? 'text-white/90' : 'text-slate-400'}`}>
                                            {kpi.title}
                                        </span>
                                    </div>
                                    <h3 className={`text-3xl font-black tracking-tighter ${textClass} mt-0.5`}>
                                        {kpi.value}
                                    </h3>
                                    <p className={`text-[10px] font-bold mt-1.5 flex items-center gap-1 ${subClass}`}>
                                        {kpi.sub}
                                    </p>
                                </div>
                                <div className={`p-2.5 rounded-xl ${iconBox} shadow-inner`}>
                                    <kpi.icon size={16} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- 3. CHARTS GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-2">
                
                {/* Sales Volume Trend */}
                <div className="lg:col-span-2 bg-white rounded-[1.25rem] border border-slate-100 p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-5">
                        <div>
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Delivery Volume Trend</h3>
                            <p className="text-[10px] text-slate-400 font-bold">Daily vehicle dispatches and timeline</p>
                        </div>
                    </div>
                    <div className="h-60 w-full">
                        {salesVolumeTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={salesVolumeTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={THEME_COLOR} stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor={THEME_COLOR} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} dy={8} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} />
                                    <Tooltip 
                                        content={<CustomTooltip />}
                                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                    />
                                    <Area type="monotone" dataKey="count" fill="url(#colorCount)" stroke="none" />
                                    <Bar dataKey="count" barSize={14} fill={THEME_COLOR} radius={[3, 3, 0, 0]} />
                                    <Line type="monotone" dataKey="count" stroke={THEME_COLOR} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5, strokeWidth: 0 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Activity size={24} className="mb-2 opacity-50"/>
                                <p className="text-[10px] font-bold uppercase tracking-widest">No Deliveries in Period</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Leads Quality */}
                <div className="bg-white rounded-[1.25rem] border border-slate-100 p-5 shadow-sm flex flex-col">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Leads Quality</h3>
                    <div className="flex-1 min-h-[200px] relative">
                        {leadPieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={leadPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={6}
                                    >
                                        {leadPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontWeight: 800, color: '#1e293b', fontSize: '12px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">No Leads<br/>In This Period</p>
                            </div>
                        )}
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-5px]">
                            <span className="text-2xl font-black text-slate-800">{leadStats.total}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total Leads</span>
                        </div>
                    </div>
                    
                    <div className="flex justify-center gap-3 mt-1">
                        {leadPieData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{entry.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversion Funnel */}
                <div className="bg-white rounded-[1.25rem] border border-slate-100 p-5 shadow-sm">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Conversion Funnel</h3>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 15, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 700 }} width={70} />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                                    itemStyle={{ fontWeight: 800, color: '#1e293b' }}
                                />
                                <Bar dataKey="value" barSize={18} radius={[0, 8, 8, 0]}>
                                    {funnelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-4 text-center">Pipeline progression from enquiry to delivery</p>
                </div>

                {/* Top Moving Spares */}
                <div className="lg:col-span-2 bg-slate-900 rounded-[1.25rem] p-5 shadow-xl relative overflow-hidden group">
                    <div className="absolute -right-16 -top-16 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none transition-transform group-hover:scale-110 duration-700"></div>
                    <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 relative z-10 flex items-center gap-2">
                        <Layers size={14} className="text-slate-400" />
                        Top Moving Spares Categories
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                        {stats?.spares?.topItems?.length > 0 ? (
                            stats.spares.topItems.map((item, index) => (
                                <div key={index} className="bg-slate-800/50 p-3 rounded-xl flex justify-between items-center border border-slate-700 hover:bg-slate-800 transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-black text-[10px]">
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white truncate max-w-[120px]">{item.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-black text-emerald-400">{item.qty}</p>
                                        <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">units</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-6 text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                                No spares data available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- 4. DATA TABLES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-2">
                {/* Active Leads Table */}
                <div className="bg-white rounded-[1.25rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Target size={14} className={t.text} />
                            Recent Active Pipeline
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400">Showing Top 5</span>
                    </div>
                    <div className="flex-1 p-0">
                        {leadStats.list.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {leadStats.list.slice(0, 5).map((lead, idx) => (
                                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                                                {lead.name.substring(0, 2)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800">{lead.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{lead.model} • {lead.village}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                lead.type === 'Hot' ? 'bg-rose-50 text-rose-600' :
                                                lead.type === 'Warm' ? 'bg-amber-50 text-amber-600' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                                {lead.type}
                                            </span>
                                            <p className="text-[9px] font-bold text-slate-400 mt-1">{new Date(lead.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                No recent leads available
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                        <button className="text-[10px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors">
                            View All Leads →
                        </button>
                    </div>
                </div>

                {/* Sales Breakdown Table */}
                <div className="bg-white rounded-[1.25rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                            <Truck size={14} className={t.text} />
                            Model Distribution Status
                        </h3>
                        <span className="text-[10px] font-bold text-slate-400">Total: {stats?.sales?.total || 0} units</span>
                    </div>
                    <div className="flex-1 p-0">
                        {stats?.sales?.byModel?.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {stats.sales.byModel.slice(0, 5).map((model, idx) => (
                                    <div key={idx} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${t.primary}`}></div>
                                            <p className="text-xs font-black text-slate-800">{model.name}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-800">{model.count}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Delivered</p>
                                            </div>
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${t.primary}`} 
                                                    style={{ width: `${(model.count / (stats?.sales?.total || 1)) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                No model data available
                            </div>
                        )}
                    </div>
                    <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                        <button className="text-[10px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-widest transition-colors">
                            View Sales Report →
                        </button>
                    </div>
                </div>
            </div>

            {/* --- 5. SYSTEM HEALTH FOOTER --- */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-slate-500">
                    <CheckCircle size={14} className="text-emerald-500" />
                    <span className="text-[11px] font-bold">All telemetry streams are fully operational.</span>
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Analytics Engine v2.0
                </div>
            </div>

        </div>
    );
};

export default Home;