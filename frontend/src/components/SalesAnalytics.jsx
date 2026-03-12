import React, { useState } from 'react';
import { 
    TrendingUp, DollarSign, Wallet, Percent, AlertCircle, 
    Calendar, Filter, Download, ArrowUpRight, ArrowDownRight,
    Briefcase, Users, Target, ChevronRight, MoreHorizontal, 
    FileText, CheckCircle2, RefreshCw, Activity, Package, 
    BarChart3, Zap, Clock, BellRing, ChevronDown, Layers
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
    ComposedChart, Radar, RadarChart, PolarGrid, 
    PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar
} from 'recharts';

const SalesAnalytics = ({ theme: t }) => {
    // --- STATE MANAGEMENT ---
    const [timeRange, setTimeRange] = useState('Monthly');
    const [selectedBranch, setSelectedBranch] = useState('All Branches');

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

    // --- MOCK DATA ---

    const kpiData = [
        { 
            id: 'net_profit', label: 'Net Profit', value: '₹ 24.5 L', trend: '+12.5%', 
            isPositive: true, icon: Wallet, sub: 'Post-Tax Earnings', variant: 'primary', progress: 85
        },
        { 
            id: 'gross_rev', label: 'Gross Revenue', value: '₹ 1.25 Cr', trend: '+8.2%', 
            isPositive: true, icon: DollarSign, sub: 'Total Invoiced Value', variant: 'dark', progress: 92
        },
        { 
            id: 'dse_comm', label: 'DSE Payouts', value: '₹ 4.2 L', trend: '-2.4%', 
            isPositive: false, icon: Users, sub: 'Dealer Commissions', variant: 'white', progress: 45
        },
        { 
            id: 'tds_deduct', label: 'TDS (5%)', value: '₹ 1.22 L', trend: '+5%', 
            isPositive: false, icon: Percent, sub: 'Govt. Tax Deducted', variant: 'white', progress: 20
        },
        { 
            id: 'dues_pending', label: 'Pending Dues', value: '₹ 8.5 L', trend: '+5.0%', 
            isPositive: false, icon: AlertCircle, sub: 'Accounts Receivable', variant: 'white', progress: 65
        }
    ];

    const financialMixedData = [
        { name: 'Jan', revenue: 42, expenses: 24, profit: 18 },
        { name: 'Feb', revenue: 38, expenses: 22, profit: 16 },
        { name: 'Mar', revenue: 55, expenses: 28, profit: 27 },
        { name: 'Apr', revenue: 48, expenses: 26, profit: 22 },
        { name: 'May', revenue: 51, expenses: 27, profit: 23 },
        { name: 'Jun', revenue: 62, expenses: 31, profit: 31 },
        { name: 'Jul', revenue: 59, expenses: 29, profit: 30 },
        { name: 'Aug', revenue: 65, expenses: 32, profit: 33 },
    ];

    const modelDistribution = [
        { name: 'Star', value: 42, color: THEME_COLOR },
        { name: 'Super', value: 28, color: '#334155' }, 
        { name: 'Yodha', value: 18, color: '#94a3b8' },
        { name: 'Plus', value: 12, color: '#cbd5e1' },
    ];

    const efficiencyData = [
        { subject: 'Conv.', A: 120, fullMark: 150 },
        { subject: 'CSI', A: 98, fullMark: 150 },
        { subject: 'Turn.', A: 86, fullMark: 150 },
        { subject: 'DSE', A: 99, fullMark: 150 },
        { subject: 'Serv.', A: 85, fullMark: 150 },
        { subject: 'Mkt.', A: 65, fullMark: 150 },
    ];

    const funnelData = [
        { name: 'Leads', value: 100, fill: '#cbd5e1' },
        { name: 'Test Drives', value: 65, fill: '#94a3b8' },
        { name: 'Bookings', value: 40, fill: '#475569' },
        { name: 'Deliveries', value: 28, fill: THEME_COLOR },
    ];

    const salesLog = [
        { id: 'INV-001', customer: 'Rahul Verma', model: 'Star', date: '10:42 AM', amount: '1.24 L', status: 'Paid' },
        { id: 'INV-002', customer: 'Priya Singh', model: 'Super', date: '09:15 AM', amount: '1.35 L', status: 'Pending' },
        { id: 'INV-003', customer: 'Gurmeet S.', model: 'Yodha', date: 'Yesterday', amount: '1.50 L', status: 'Paid' },
        { id: 'INV-004', customer: 'Md. Altaf', model: 'Star', date: 'Yesterday', amount: '1.24 L', status: 'Overdue' },
    ];

    const dsePerformance = [
        { name: 'Amit Sharma', leads: 45, closed: 12, revenue: '15.4 L' },
        { name: 'Vikram R.', leads: 38, closed: 9, revenue: '11.2 L' },
        { name: 'Suresh K.', leads: 52, closed: 8, revenue: '9.8 L' },
    ];

    const heatmapData = [
        { day: 'Mon', hours: [1, 2, 4, 3, 2, 1] },
        { day: 'Tue', hours: [2, 3, 4, 4, 3, 2] },
        { day: 'Wed', hours: [1, 2, 3, 2, 2, 1] },
        { day: 'Thu', hours: [2, 3, 4, 3, 2, 2] },
        { day: 'Fri', hours: [3, 4, 4, 4, 3, 2] },
        { day: 'Sat', hours: [4, 4, 4, 4, 4, 3] },
        { day: 'Sun', hours: [1, 1, 2, 2, 1, 1] },
    ];

    const inventoryData = [
        { name: 'Age', uv: 31.47, fill: '#334155' },
        { name: 'Turn', uv: 26.69, fill: '#94a3b8' },
        { name: 'Order', uv: 15.69, fill: THEME_COLOR },
    ];

    const recentActivity = [
        { text: 'New Booking: Rajhans Star', time: '2m ago', type: 'success' },
        { text: 'Payment Received: ₹50k', time: '15m ago', type: 'info' },
        { text: 'Stock Alert: Battery Low', time: '1h ago', type: 'warning' },
        { text: 'New Lead: Walk-in', time: '2h ago', type: 'default' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans text-slate-800">
            
            {/* --- 1. NEW UNLOCKED HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 flex items-center gap-2">
                        Analytics <span className="text-slate-300 font-light">/</span> Overview
                    </h1>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-sm">
                            <span className={`w-2 h-2 rounded-full ${t.primary} animate-pulse`}></span>
                            <span className="uppercase tracking-wider text-[10px]">Live Data</span>
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
                    {/* Time Range */}
                    <div className="bg-slate-50 p-1 rounded-xl flex items-center">
                        {['Weekly', 'Monthly', 'Yearly'].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${
                                    timeRange === range 
                                    ? `bg-white text-slate-900 shadow-sm` 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-8 bg-slate-100 mx-1"></div>

                    {/* Branch Filter */}
                    <div className="relative">
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

                    {/* Export Action */}
                    <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ${t.primary}`}>
                        <Download size={14} /> <span>Report</span>
                    </button>
                </div>
            </div>

            {/* --- 2. HERO KPI CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {kpiData.map((kpi) => {
                    const isPrimary = kpi.variant === 'primary';
                    const isDark = kpi.variant === 'dark';
                    
                    let cardClass = 'bg-white border-slate-200/60';
                    let textClass = 'text-slate-800';
                    let subClass = 'text-slate-400';
                    let iconBox = `${t.light} ${t.text}`;
                    let trendBox = kpi.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600';

                    if (isPrimary) {
                        cardClass = `bg-gradient-to-br ${THEME_GRADIENT} text-white border-transparent`;
                        textClass = 'text-white';
                        subClass = 'text-white/70';
                        iconBox = 'bg-white/20 text-white backdrop-blur-md';
                        trendBox = 'bg-white/20 text-white backdrop-blur-md';
                    } else if (isDark) {
                        cardClass = 'bg-slate-900 text-white border-slate-800';
                        textClass = 'text-white';
                        subClass = 'text-slate-400';
                        iconBox = 'bg-slate-800 text-slate-200';
                        trendBox = 'bg-slate-800 text-emerald-400';
                    }

                    return (
                        <div key={kpi.id} className={`${cardClass} p-5 rounded-[1.25rem] shadow-sm border relative overflow-hidden group hover:scale-[1.02] transition-all duration-300`}>
                            {/* Decorative Backgrounds */}
                            {(isPrimary || isDark) && (
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:bg-white/20 transition-all"></div>
                            )}
                            
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`p-2.5 rounded-xl ${iconBox} shadow-sm`}>
                                    <kpi.icon size={16} />
                                </div>
                                <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg ${trendBox}`}>
                                    {kpi.isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                    {kpi.trend}
                                </div>
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className={`text-[9px] font-black uppercase tracking-widest mb-1 ${subClass}`}>{kpi.label}</h3>
                                <div className="flex items-end gap-2">
                                    <p className={`text-2xl font-black tracking-tight ${textClass}`}>{kpi.value}</p>
                                </div>
                                
                                {/* Mini Progress Bar */}
                                <div className="mt-3 h-1 w-full bg-black/5 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${isPrimary || isDark ? 'bg-white/50' : t.primary}`} 
                                        style={{ width: `${kpi.progress}%` }}
                                    ></div>
                                </div>
                                <p className={`text-[9px] font-medium mt-1.5 text-right ${subClass}`}>{kpi.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- 3. MAIN ANALYTICS ROW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* A. Composed Chart (Main Financials) - Spans 8 cols */}
                <div className="lg:col-span-8 bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Financial Overview</h3>
                            <p className="text-[10px] text-slate-500 font-medium">Revenue vs. Expenses vs. Profit (In Lakhs)</p>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                             <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${t.primary}`}></span>
                                <span className="text-[9px] font-bold uppercase text-slate-500">Rev</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                                <span className="text-[9px] font-bold uppercase text-slate-500">Exp</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-[9px] font-bold uppercase text-slate-500">Prof</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full min-h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={financialMixedData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                                <defs>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={THEME_COLOR} stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor={THEME_COLOR} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontFamily: 'sans-serif' }} 
                                    cursor={{ fill: '#f8fafc' }} 
                                />
                                <Area type="monotone" dataKey="profit" fill="url(#colorProfit)" stroke={THEME_COLOR} strokeWidth={3} />
                                <Bar dataKey="revenue" barSize={16} fill="currentColor" className={t.text} radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="expenses" stroke="#1e293b" strokeWidth={3} dot={{ r: 4, fill: '#1e293b', strokeWidth: 2, stroke: '#fff' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* B. Sales Funnel & Radar - Spans 4 cols */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                    
                    {/* Sales Funnel Card */}
                    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-xs font-bold text-slate-900">Conversion Funnel</h3>
                             <MoreHorizontal size={14} className="text-slate-400 cursor-pointer hover:text-slate-600"/>
                        </div>
                        <div className="flex-1 flex flex-col justify-center space-y-3">
                            {funnelData.map((step, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1 z-10 relative">
                                        <span>{step.name}</span>
                                        <span className="text-slate-800">{step.value}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                                            style={{ width: `${step.value}%`, backgroundColor: step.fill }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Radar Chart Efficiency */}
                    <div className="bg-slate-900 p-5 rounded-[1.5rem] shadow-lg flex-1 text-white relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-2 relative z-10">
                            <h3 className="text-xs font-bold">Efficiency Score</h3>
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold">A+</span>
                        </div>
                        <div className="flex-1 min-h-[140px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={efficiencyData}>
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                    <Radar name="Showroom" dataKey="A" stroke={THEME_COLOR} strokeWidth={2} fill={THEME_COLOR} fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 4. BENTO METRICS: ACTIVITY, PIE, DUES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* 1. Live Floor Activity */}
                <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex flex-col h-[320px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <Activity size={12} className="text-rose-500 animate-pulse" /> Floor Activity
                        </h3>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Real-time</span>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                        {recentActivity.map((act, i) => (
                            <div key={i} className="flex gap-3 items-start group">
                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                                    act.type === 'success' ? 'bg-emerald-500' : 
                                    act.type === 'warning' ? 'bg-amber-500' : 
                                    act.type === 'info' ? 'bg-blue-500' : 'bg-slate-300'
                                } ring-4 ring-white group-hover:scale-125 transition-transform`}></div>
                                <div className="pb-3 border-b border-slate-50 w-full group-last:border-0">
                                    <p className="text-[11px] font-semibold text-slate-700">{act.text}</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1"><Clock size={8}/> {act.time}</p>
                                </div>
                            </div>
                        ))}
                        {/* Fake Skeleton Loader for 'Live' feel */}
                        <div className="flex gap-3 items-center opacity-50">
                            <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                            <div className="h-2 w-2/3 bg-slate-100 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>

                {/* 2. Model Split Pie Chart */}
                <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                         <h3 className="text-xs font-bold text-slate-900">Model Distribution</h3>
                         <div className={`p-1.5 rounded-lg ${t.light} ${t.text}`}>
                             <Package size={14} />
                         </div>
                    </div>
                    <div className="h-[180px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={modelDistribution} innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                                    {modelDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{borderRadius:'8px', fontSize:'10px', border:'none'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="block text-2xl font-black text-slate-800">450</span>
                            <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Units Sold</span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4">
                        {modelDistribution.slice(0,3).map((m, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }}></span>
                                <span className="text-[9px] font-bold text-slate-600">{m.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Heatmap & Small Stats */}
                <div className="flex flex-col gap-4">
                    {/* Heatmap */}
                    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex-1">
                        <div className="flex justify-between items-center mb-3">
                             <h3 className="text-xs font-bold text-slate-900">Sales Intensity</h3>
                             <div className="flex gap-0.5">
                                 {[1,2,3].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-sm ${t.primary} opacity-${i*30}`}></div>)}
                             </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {heatmapData.map(day => (
                                <div key={day.day} className="text-center group">
                                    <div className="space-y-1">
                                        {day.hours.map((intensity, i) => (
                                            <div 
                                                key={i} 
                                                className={`h-4 rounded-[2px] w-full transition-all group-hover:scale-x-110 ${
                                                    intensity === 1 ? 'bg-slate-100' : 
                                                    intensity === 2 ? `${t.primary} opacity-30` : 
                                                    intensity === 3 ? `${t.primary} opacity-60` : t.primary
                                                }`}
                                            ></div>
                                        ))}
                                    </div>
                                    <span className="text-[8px] font-bold text-slate-300 uppercase mt-1 block group-hover:text-slate-500">{day.day.charAt(0)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Compact Inventory Stat */}
                    <div className="bg-slate-900 p-5 rounded-[1.5rem] shadow-lg text-white relative overflow-hidden flex flex-col justify-center items-center h-[120px]">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 absolute top-4 left-4">Stock Health</h3>
                        <div className="w-full h-[120px] mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="100%" barSize={6} data={inventoryData}>
                                    <RadialBar minAngle={15} background clockWise dataKey="uv" />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute bottom-4 text-center">
                             <span className="text-xl font-black">92%</span>
                             <span className="text-[8px] block text-slate-400 uppercase">Turnover</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 5. DATA TABLES ROW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Sales Transactions */}
                <div className="lg:col-span-2 bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-900">Recent Transactions</h3>
                        <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
                            View All <ChevronRight size={10}/>
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="py-2 px-3 text-[9px] font-bold uppercase text-slate-400">ID</th>
                                    <th className="py-2 px-3 text-[9px] font-bold uppercase text-slate-400">Customer</th>
                                    <th className="py-2 px-3 text-[9px] font-bold uppercase text-slate-400 text-right">Amount</th>
                                    <th className="py-2 px-3 text-[9px] font-bold uppercase text-slate-400 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {salesLog.map((row, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0 cursor-pointer">
                                        <td className="py-3 px-3 text-[10px] font-bold text-slate-500 font-mono group-hover:text-slate-700">{row.id}</td>
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm ${['bg-indigo-500','bg-rose-500','bg-amber-500'][idx%3]}`}>
                                                    {row.customer[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-slate-700">{row.customer}</span>
                                                    <span className="text-[8px] text-slate-400">{row.model} • {row.date}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-[10px] font-bold text-slate-900 text-right">₹{row.amount}</td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wide border ${
                                                row.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                row.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                                {row.status === 'Paid' ? <CheckCircle2 size={8}/> : row.status === 'Pending' ? <RefreshCw size={8}/> : <AlertCircle size={8}/>}
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Dealers */}
                <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex flex-col">
                    <h3 className="text-xs font-bold text-slate-900 mb-4">Top Performers</h3>
                    <div className="flex-1 space-y-3">
                        {dsePerformance.map((dse, idx) => (
                            <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all group cursor-pointer">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm group-hover:scale-110 transition-transform">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-bold text-slate-900">{dse.name}</h4>
                                            <p className="text-[9px] text-slate-500 font-medium">{dse.closed} Closures</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-black ${t.text}`}>₹{dse.revenue}</span>
                                </div>
                                <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                                    <div className={`h-full ${t.primary} rounded-full`} style={{ width: `${(dse.closed / 60) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-slate-300 text-[10px] font-bold text-slate-500 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700 transition-all flex items-center justify-center gap-2">
                        <Users size={12}/> View Full Leaderboard
                    </button>
                </div>
            </div>

            {/* --- 6. FOOTER GOAL --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 <div className="md:col-span-3 bg-gradient-to-r from-slate-900 to-slate-800 rounded-[1.5rem] p-5 text-white flex items-center justify-between shadow-xl shadow-slate-200/50 relative overflow-hidden">
                     <div className="absolute left-0 top-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                     <div className="flex items-center gap-4 relative z-10">
                         <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                             <Target size={20} className="text-emerald-400" />
                         </div>
                         <div>
                             <h4 className="font-bold text-sm">Monthly Goal</h4>
                             <p className="text-[10px] text-slate-400 mt-0.5">You're hitting <span className="text-white font-bold">85%</span> of target.</p>
                         </div>
                     </div>
                     <div className="text-right hidden sm:block relative z-10">
                         <p className="text-2xl font-black text-emerald-400">₹ 85.4 L</p>
                         <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Target: ₹ 1.0 Cr</p>
                     </div>
                 </div>

                 <div className="bg-white border border-slate-200/60 rounded-[1.5rem] p-5 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
                     <div className={`p-3 rounded-full ${t.light} ${t.text} mb-2 group-hover:scale-110 transition-transform`}>
                         <FileText size={18} />
                     </div>
                     <h5 className="font-bold text-slate-900 text-xs">Full Report</h5>
                     <p className="text-[9px] text-slate-400 mt-0.5">PDF / Excel</p>
                 </div>
            </div>
        </div>
    );
};

export default SalesAnalytics;