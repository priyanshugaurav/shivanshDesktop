import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { 
    LayoutDashboard, Calendar, Filter, Download, 
    MoreHorizontal, Search, Share2, Users, Zap, Target, Activity, 
    TrendingUp, DollarSign, Briefcase, MapPin, Phone, MessageCircle, 
    AlertCircle, Clock, CheckCircle2, XCircle, PieChart, BarChart3, 
    Layers, Truck, Wallet, Flame, MousePointerClick, CalendarDays, 
    Hourglass, GanttChartSquare, LocateFixed, ArrowRight, BellRing,
    RefreshCw, X 
} from 'lucide-react';
import { useEnquiries } from '../hooks/useEnquiries';

// ==========================================
// 1. HELPERS & UTILS
// ==========================================

const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
};

const getThemeColors = (themeName) => {
    const themes = {
        emerald: { primary: '#10b981', gradient: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-500' },
        blue: { primary: '#3b82f6', gradient: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-500' },
        violet: { primary: '#8b5cf6', gradient: 'from-violet-500 to-fuchsia-600', light: 'bg-violet-50', text: 'text-violet-600', ring: 'ring-violet-500' },
        amber: { primary: '#f59e0b', gradient: 'from-amber-400 to-orange-500', light: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-500' },
        rose: { primary: '#f43f5e', gradient: 'from-rose-500 to-pink-600', light: 'bg-rose-50', text: 'text-rose-600', ring: 'ring-rose-500' },
        slate: { primary: '#64748b', gradient: 'from-slate-700 to-slate-900', light: 'bg-slate-50', text: 'text-slate-600', ring: 'ring-slate-500' },
    };
    const key = Object.keys(themes).find(k => themeName.includes(k)) || 'slate';
    return themes[key];
};

const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

// ==========================================
// 2. VISUAL ENGINE: Custom Charts
// ==========================================

// A. Sparkline (Area)
const Sparkline = ({ data, color = "#fff", height = 50 }) => {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1; 
    
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d - min) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox="0 0 100 100" className="w-full overflow-visible" height={height} preserveAspectRatio="none">
            <defs>
                <linearGradient id={`grad-${color.replace('#','')}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={`M0,100 ${points} L100,100 Z`} fill={`url(#grad-${color.replace('#','')})`} stroke="none" />
            <polyline fill="none" stroke={color} strokeWidth="2.5" points={points} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
};

// B. Donut Chart
const DonutChart = ({ segments, size = 160, thickness = 15, label, subLabel }) => {
    let acc = 0;
    const total = segments.reduce((a, b) => a + b.value, 0) || 1;
    const radius = size / 2;
    const circumference = 2 * Math.PI * (radius - thickness);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                {segments.map((seg, i) => {
                    if (seg.value === 0) return null;
                    const percent = (seg.value / total);
                    const strokeDasharray = `${percent * circumference} ${circumference}`;
                    const strokeDashoffset = -acc * circumference;
                    acc += percent;
                    return (
                        <circle
                            key={i} cx={size / 2} cy={size / 2} r={(size - thickness) / 2}
                            fill="transparent" stroke={seg.color} strokeWidth={thickness}
                            strokeDasharray={strokeDasharray} strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round" className="transition-all duration-1000 ease-out hover:opacity-80"
                        />
                    );
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-extrabold text-slate-800">{label || total}</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{subLabel || 'Total'}</span>
            </div>
        </div>
    );
};

// C. Simple Bar Chart (Vertical)
const SimpleBarChart = ({ data, color, height = 140 }) => {
    const max = Math.max(...data.map(d => d.value), 1); 
    return (
        <div className="flex items-end justify-between gap-2 w-full select-none" style={{ height }}>
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                    <div className="relative w-full bg-slate-50 rounded-t-sm overflow-visible flex items-end h-[85%] hover:bg-slate-100 transition-colors cursor-pointer">
                        <div 
                            className="w-full rounded-t-sm transition-all duration-700 ease-out relative group-hover:opacity-90"
                            style={{ height: `${(d.value / max) * 100}%`, backgroundColor: d.color || color, minHeight: d.value > 0 ? '4px' : '0' }}
                        >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-lg pointer-events-none transform translate-y-1 group-hover:translate-y-0">
                                {d.value}
                            </div>
                        </div>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-2 font-bold uppercase truncate w-full text-center tracking-wide">{d.label}</span>
                </div>
            ))}
        </div>
    );
};

// D. Horizontal Funnel Bar
const FunnelBar = ({ data, color }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="w-full space-y-4">
            {data.map((d, i) => (
                <div key={i} className="group cursor-pointer">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{d.label}</span>
                        <span className="text-xs font-mono font-medium text-slate-500">{d.value}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${(d.value / max) * 100}%`, backgroundColor: d.color || color, minWidth: d.value > 0 ? '4px' : '0' }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// E. Heatmap Grid
const HeatmapGrid = ({ data, colorHex }) => {
    const days = useMemo(() => {
        const result = [];
        for (let i = 83; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toLocaleDateString('en-US');
            const count = data[key] || 0;
            result.push({ date: key, count, level: Math.min(count, 4) });
        }
        return result;
    }, [data]);

    const getOpacity = (level) => level === 0 ? 0.06 : 0.2 + (level * 0.2);

    return (
        <div className="grid grid-rows-7 grid-flow-col gap-1 w-full h-28">
            {days.map((d, i) => (
                <div 
                    key={i} 
                    className="w-full h-full rounded-[2px] transition-all hover:scale-125 hover:z-10 relative group"
                    style={{ backgroundColor: colorHex, opacity: getOpacity(d.level) }}
                >
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-900 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-30 shadow-sm font-medium">
                        {d.date}: {d.count} Leads
                    </div>
                </div>
            ))}
        </div>
    );
};

// ==========================================
// 3. LOGIC CORE: Data Processor
// ==========================================

const processData = (data, announcements, days) => {
    const now = new Date();
    const cutoff = new Date();
    if (days !== 'All') cutoff.setDate(now.getDate() - days);

    // --- ENQUIRY PROCESSING ---
    const filtered = days === 'All' ? data : data.filter(d => {
        const date = parseDate(d['Date Recorded']);
        return date && date >= cutoff;
    });

    const total = filtered.length;
    
    // Aggregators
    const counts = {
        nature: {}, model: {}, modelType: {}, source: {}, salesman: {}, 
        pincode: {}, daily: {}, 
        weekDay: { 'Sun':0, 'Mon':0, 'Tue':0, 'Wed':0, 'Thu':0, 'Fri':0, 'Sat':0 },
        aging: { 'New (<7d)': 0, 'Active (7-30d)': 0, 'Stale (>30d)': 0 },
        forecast: { 'This Week': 0, 'Next 15d': 0, 'Next 30d': 0, 'Later': 0 }
    };

    let funnel = { recorded: 0, fu1: 0, fu2: 0, fu3: 0 };
    let hotLeadsData = [];
    let warmLeadsCount = 0;

    // Calculate Pipeline Metrics from FULL data (ignores time filter)
    data.forEach(row => {
        if (row['Follow Up-3']) {
            hotLeadsData.push({
                name: row['Name'] || 'Unknown',
                phone: row['Phone'] || 'N/A',
                date: row['Follow Up-3']
            });
        }
        const nature = row['Model Nature'];
        if (nature === 'Warm') warmLeadsCount++;
    });
    const hotLeadsCount = hotLeadsData.length;

    filtered.forEach(row => {
        const recDate = parseDate(row['Date Recorded']);
        if (!recDate) return;

        // Nature
        const nature = row['Model Nature'] || 'Unspecified';
        counts.nature[nature] = (counts.nature[nature] || 0) + 1;

        // Models
        const model = row['Model'] || 'Unknown';
        counts.model[model] = (counts.model[model] || 0) + 1;
        const mType = row['Model Type'] || 'General';
        counts.modelType[mType] = (counts.modelType[mType] || 0) + 1;

        // Source
        const source = row['Income Source'] || 'Not Stated';
        counts.source[source] = (counts.source[source] || 0) + 1;
        
        // Salesman
        const sm = row['Salesman'] || 'Unassigned';
        if (!counts.salesman[sm]) counts.salesman[sm] = { label: sm, total: 0, hot: 0, warm: 0, cold: 0 };
        counts.salesman[sm].total++;
        if(nature === 'Hot') counts.salesman[sm].hot++;
        else if(nature === 'Warm') counts.salesman[sm].warm++;
        else counts.salesman[sm].cold++;

        // Pincode
        const pin = row['Pincode'] || 'Unknown';
        counts.pincode[pin] = (counts.pincode[pin] || 0) + 1;

        // Time Stats
        const dateKey = recDate.toLocaleDateString('en-US');
        counts.daily[dateKey] = (counts.daily[dateKey] || 0) + 1;
        
        const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        counts.weekDay[daysShort[recDate.getDay()]]++;

        // Aging
        const diffDays = Math.ceil(Math.abs(now - recDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7) counts.aging['New (<7d)']++;
        else if (diffDays <= 30) counts.aging['Active (7-30d)']++;
        else counts.aging['Stale (>30d)']++;

        // Forecast
        const expDate = parseDate(row['Expected Date']);
        if (expDate) {
            const daysUntil = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
            if (daysUntil >= 0 && daysUntil <= 7) counts.forecast['This Week']++;
            else if (daysUntil <= 15) counts.forecast['Next 15d']++;
            else if (daysUntil <= 30) counts.forecast['Next 30d']++;
            else counts.forecast['Later']++;
        }

        // Funnel
        funnel.recorded++;
        if (row['Follow Up-1']) funnel.fu1++;
        if (row['Follow Up-2']) funnel.fu2++;
        if (row['Follow Up-3']) funnel.fu3++;
    });

    // --- ANNOUNCEMENT PROCESSING ---
    const announceBySalesman = {};
    let totalAnnouncements = 0;
    
    (announcements || []).forEach(a => {
        const sm = a['Salesman'] || 'Unassigned';
        if(!announceBySalesman[sm]) announceBySalesman[sm] = { 
            count: 0, 
            leads: [] 
        };
        
        announceBySalesman[sm].count++;
        // Store details for the modal
        announceBySalesman[sm].leads.push({
            name: a['Name'] || a['Customer Name'] || 'Unknown Client',
            phone: a['Phone'] || a['Mobile'] || 'No Number',
            date: a['Date'] || 'Today'
        });
        
        totalAnnouncements++;
    });

    const announceData = Object.entries(announceBySalesman)
        .map(([label, data]) => ({ 
            label, 
            value: data.count, 
            leads: data.leads 
        }))
        .sort((a,b) => b.value - a.value);


    const sortObj = (obj) => Object.entries(obj).map(([label, value]) => ({ label, value })).sort((a,b) => b.value - a.value);
    const salesmanStack = Object.values(counts.salesman).sort((a,b) => b.total - a.total).slice(0, 5);
    const trendValues = Object.values(counts.daily);
    if (trendValues.length < 2) trendValues.push(0);

    return {
        total,
        nature: sortObj(counts.nature),
        models: sortObj(counts.model),
        types: sortObj(counts.modelType),
        sources: sortObj(counts.source),
        locations: sortObj(counts.pincode),
        weekDays: Object.entries(counts.weekDay).map(([label, value]) => ({ label, value })),
        aging: Object.entries(counts.aging).map(([label, value]) => ({ label, value })),
        forecast: Object.entries(counts.forecast).map(([label, value]) => ({ label, value })),
        funnelData: [
            { label: 'Total Enquiries', value: funnel.recorded, color: '#94a3b8' },
            { label: 'First Follow-up', value: funnel.fu1, color: '#64748b' },
            { label: 'Second Follow-up', value: funnel.fu2, color: '#475569' },
            { label: 'Third Follow-up', value: funnel.fu3, color: '#1e293b' },
        ],
        salesmanStack,
        trendValues,
        dailyMap: counts.daily,
        hotLeads: hotLeadsCount,
        hotLeadsData: hotLeadsData,
        warmLeads: warmLeadsCount,
        topSalesman: salesmanStack[0] || { label: 'None', total: 0 },
        announceData,
        totalAnnouncements
    };
};

// ==========================================
// 4. COMPONENT: MAIN DASHBOARD
// ==========================================

const EnquiryStats = ({ theme }) => {
    const [timeRange, setTimeRange] = useState('All');
    const [refreshKey, setRefreshKey] = useState(0); 
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
    
    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalData, setModalData] = useState(null);

    const { data, loading } = useEnquiries('Enquiries', [refreshKey]);
    const { data: announceData, loading: announceLoading } = useEnquiries('Announcements', [refreshKey]);
    
    // --- AUTO REFRESH LOGIC (30 Seconds) ---
    useEffect(() => {
        const intervalId = setInterval(() => {
            handleRefresh();
        }, 30000); 

        return () => clearInterval(intervalId);
    }, []);

    const handleRefresh = useCallback(() => {
        setIsAutoRefreshing(true);
        setRefreshKey(prev => prev + 1);
        setTimeout(() => {
            setLastUpdated(new Date());
            setIsAutoRefreshing(false);
        }, 1000); 
    }, []);

    const handleOpenModal = (data) => {
        setModalData(data);
        setModalOpen(true);
    };

    const stats = useMemo(() => processData(data, announceData, timeRange), [data, announceData, timeRange]);
    const tc = getThemeColors(theme.primary);

    // --- UPDATED LOADING STATE ---
    // This checks if we are loading OR if data hasn't arrived yet, ensuring the 
    // "No data" message doesn't flash before the fetch completes.
    if (loading || announceLoading || !data) return (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
             {/* Dynamic Theme Spinner */}
            <div className={`w-12 h-12 border-4 border-slate-100 border-t-slate-800 rounded-full animate-spin`} style={{ borderTopColor: tc.primary }}></div>
            <div className="flex flex-col items-center animate-pulse">
                <span className="text-slate-800 font-bold text-lg">Syncing Dashboard</span>
                <span className="text-slate-400 text-sm">Fetching latest enquiries...</span>
            </div>
        </div>
    );

    if (!stats || !stats.total) return (
        <div className="h-96 flex flex-col items-center justify-center text-slate-400">
            <AlertCircle className="h-12 w-12 mb-4 opacity-50" />
            <span className="text-sm font-medium">No data found.</span>
            <button onClick={handleRefresh} className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold">Try Refreshing</button>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 relative">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        Analytics Center
                        {isAutoRefreshing && <span className="text-[10px] bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Live Updating</span>}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <Activity className={`h-4 w-4 ${tc.text}`} />
                        Live insights from {stats.total} records.
                        <span className="text-slate-300">|</span>
                        <span className="flex items-center gap-1 text-slate-400 font-medium text-xs">
                            <Clock className="h-3 w-3" /> Updated: {formatTime(lastUpdated)}
                        </span>
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                        {[7, 30, 'All'].map(range => (
                            <button key={range} onClick={() => setTimeRange(range)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeRange === range ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                                {range === 'All' ? 'All Time' : `${range}D`}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={handleRefresh} 
                        className={`p-2.5 rounded-xl bg-white border border-slate-200 text-slate-500 shadow-sm hover:text-slate-900 hover:border-slate-300 transition-all ${isAutoRefreshing ? 'animate-spin text-emerald-500 border-emerald-200' : ''}`}
                        title="Refresh Data"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>

                    <button className={`p-2.5 rounded-xl text-white shadow-lg hover:-translate-y-0.5 transition-all ${theme.primary}`}>
                        <Download className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* --- ANNOUNCEMENT RADAR --- */}
            {stats.totalAnnouncements > 0 && (
                <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-[0_2px_10px_-3px_rgba(244,63,94,0.1)] mb-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <BellRing className="h-4 w-4 text-rose-500 animate-pulse" /> 
                            Pending Follow-ups ({stats.totalAnnouncements})
                        </h4>
                        <span className="text-xs text-rose-500 font-medium bg-rose-50 px-2 py-1 rounded-full border border-rose-100">Click card for details</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {stats.announceData.map((d, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleOpenModal(d)}
                                className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 min-w-[140px] hover:bg-rose-50 hover:border-rose-200 transition-all group text-left"
                            >
                                <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600 shadow-sm group-hover:border-rose-200 group-hover:text-rose-600">
                                    {d.label.charAt(0)}
                                </div>
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase group-hover:text-rose-400">Salesman</span>
                                    <div className="text-sm font-bold text-slate-800 flex items-center gap-1">
                                        {d.label} <span className="text-white bg-rose-500 px-1.5 rounded text-[10px] shadow-sm">{d.value}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* --- KPI CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* 1. Total Volume */}
                <div className={`relative p-6 rounded-2xl overflow-hidden shadow-xl text-white bg-gradient-to-br ${tc.gradient}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10"><Users className="w-24 h-24" /></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                        <div>
                            <p className="text-white/90 font-bold text-xs uppercase tracking-wider">Total Leads</p>
                            <h3 className="text-4xl font-extrabold mt-2 tracking-tight">{stats.total}</h3>
                        </div>
                        <div className="h-12 w-32 mt-4 opacity-90"><Sparkline data={stats.trendValues} color="#fff" /></div>
                    </div>
                </div>

                {/* 2. Hot Leads */}
                <button 
                    onClick={() => handleOpenModal({ label: 'Hot Pipeline', leads: stats.hotLeadsData, isHot: true })}
                    className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all group text-left w-full"
                >
                    <div className="flex justify-between items-start mb-2">
                        <div><p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Hot Pipeline</p><h3 className="text-3xl font-extrabold text-slate-800 mt-1">{stats.hotLeads}</h3></div>
                        <div className="p-3 rounded-xl bg-rose-50 text-rose-600 group-hover:scale-110 transition-transform"><Flame className="w-5 h-5" /></div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden"><div className="bg-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(stats.hotLeads / stats.total) * 100}%` }}></div></div>
                    <p className="text-[10px] text-slate-400 mt-2 font-bold text-right">{Math.round((stats.hotLeads / stats.total) * 100)}% Lead Quality</p>
                </button>

                {/* 3. Top Performer */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div><p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Star Salesman</p><h3 className="text-lg font-bold text-slate-900 mt-1 truncate max-w-[140px]">{stats.topSalesman.label}</h3></div>
                        <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform"><Target className="w-5 h-5" /></div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded w-fit"><Zap className="h-3 w-3 text-amber-500" /> {stats.topSalesman.total} Deals</div>
                </div>

                {/* 4. Active Retention */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <div><p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Retention</p><h3 className="text-3xl font-extrabold text-slate-800 mt-1">{Math.round((stats.funnelData[2].value / stats.total) * 100)}%</h3></div>
                        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform"><MousePointerClick className="w-5 h-5" /></div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Leads reaching 2nd Follow-up</p>
                </div>
            </div>

            {/* --- ROW 2: ACTIVITY & FUNNEL --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* A. Heatmap */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-slate-400"/> Daily Activity Heatmap</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Last 3 Months</span>
                    </div>
                    <HeatmapGrid data={stats.dailyMap} colorHex={tc.primary} />
                </div>

                {/* B. Weekly Traffic */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-slate-400"/> Weekly Traffic</h4>
                    <SimpleBarChart data={stats.weekDays} color={tc.primary} height={140} />
                </div>
            </div>

            {/* --- ROW 3: BREAKDOWNS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* C. Funnel */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6"><h4 className="font-bold text-slate-800 flex items-center gap-2"><Filter className="h-4 w-4 text-slate-400"/> Engagement Funnel</h4></div>
                    <FunnelBar data={stats.funnelData} color={tc.primary} />
                </div>

                {/* D. Lead Temperature */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                    <h4 className="font-bold text-slate-800 w-full mb-4 flex items-center gap-2"><PieChart className="h-4 w-4 text-slate-400"/> Lead Nature</h4>
                    <DonutChart 
                        label="Status" totalValue={stats.total}
                        segments={[
                            { value: stats.hotLeads, color: '#f43f5e' },
                            { value: stats.warmLeads, color: '#f59e0b' },
                            { value: stats.total - stats.hotLeads - stats.warmLeads, color: '#e2e8f0' },
                        ]} 
                    />
                    <div className="grid grid-cols-3 gap-2 w-full mt-6">
                        <div className="text-center p-2 rounded bg-rose-50 border border-rose-100"><span className="block text-lg font-bold text-rose-600">{stats.hotLeads}</span><span className="text-[10px] font-bold text-rose-400 uppercase">Hot</span></div>
                        <div className="text-center p-2 rounded bg-amber-50 border border-amber-100"><span className="block text-lg font-bold text-amber-600">{stats.warmLeads}</span><span className="text-[10px] font-bold text-amber-400 uppercase">Warm</span></div>
                        <div className="text-center p-2 rounded bg-slate-50 border border-slate-100"><span className="block text-lg font-bold text-slate-500">{stats.total - stats.hotLeads - stats.warmLeads}</span><span className="text-[10px] font-bold text-slate-400 uppercase">Cold</span></div>
                    </div>
                </div>
            </div>

            {/* --- ROW 4: DEEP DIVES --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* E. Salesman Quality */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><GanttChartSquare className="h-4 w-4 text-slate-400"/> Salesman Quality</h4>
                    <div className="flex flex-col gap-3 w-full">
                        {stats.salesmanStack.map((row, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-slate-500 w-24 truncate text-right">{row.label}</span>
                                <div className="flex-1 h-2.5 rounded-full overflow-hidden flex bg-slate-100">
                                    <div className="h-full bg-rose-500" style={{ width: `${(row.hot/row.total)*100}%` }}></div>
                                    <div className="h-full bg-amber-500" style={{ width: `${(row.warm/row.total)*100}%` }}></div>
                                    <div className="h-full bg-slate-300" style={{ width: `${(row.cold/row.total)*100}%` }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 w-6 text-right">{row.total}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* F. Forecast (FIXED: Uses Theme Color) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Hourglass className="h-4 w-4 text-slate-400"/> Closure Forecast</h4>
                    <SimpleBarChart data={stats.forecast} color={tc.primary} height={160} />
                </div>

                {/* G. Location Bubbles */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><LocateFixed className="h-4 w-4 text-slate-400"/> Top Locations</h4>
                    <div className="flex flex-wrap gap-2 content-start h-full">
                        {stats.locations.slice(0, 8).map((loc, i) => (
                            <div key={i} className={`rounded-full flex flex-col items-center justify-center text-center shadow-sm border border-white transition-all hover:scale-110 ${i<3 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`} style={{ width: Math.max(40, Math.min(90, (loc.value / stats.total) * 300)), height: Math.max(40, Math.min(90, (loc.value / stats.total) * 300)) }}>
                                <span className="text-[10px] font-bold truncate px-1">{loc.label}</span>
                                <span className="text-[8px] opacity-80">{loc.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- ROW 5: MIX & DEMOGRAPHICS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Truck className="h-4 w-4 text-slate-400"/> Inventory Mix</h4>
                        <div className="space-y-3">
                            {stats.types.slice(0,3).map((t, i) => (
                                <div key={i} className="flex items-center justify-between"><span className="text-xs font-bold text-slate-600 flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${['bg-violet-500','bg-cyan-500','bg-amber-500'][i]}`}></span>{t.label}</span><span className="text-xs font-bold text-slate-800">{t.value}</span></div>
                            ))}
                        </div>
                    </div>
                    <DonutChart size={120} thickness={8} label="Mix" subLabel="Type" segments={stats.types.slice(0,3).map((t,i) => ({ value: t.value, color: ['#8b5cf6','#06b6d4','#f59e0b'][i] }))} />
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Wallet className="h-4 w-4 text-slate-400"/> Income Profile</h4>
                    {(() => {
                        const maxVal = Math.max(...stats.sources.map(s => s.value), 1);
                        return (
                            <div className="flex gap-2 h-32 items-end">
                                {stats.sources.slice(0, 5).map((s, i) => (
                                    <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer h-full">
                                        <div className="text-[9px] text-center text-slate-500 mb-1 font-bold truncate">{s.label}</div>
                                        <div className="w-full bg-slate-50 rounded-t-sm h-full flex items-end">
                                            {/* FIXED: Uses Theme Color with dynamic opacity instead of hardcoded blue/teal */}
                                            <div 
                                                className="w-full rounded-t-sm transition-all hover:opacity-100" 
                                                style={{ 
                                                    height: `${(s.value/maxVal)*100}%`,
                                                    backgroundColor: tc.primary,
                                                    opacity: 0.3 + ((5-i) * 0.14) 
                                                }}
                                            >
                                                 <div className="w-full text-center text-white text-[9px] font-bold py-1 opacity-0 group-hover:opacity-100">{s.value}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* --- MODAL FOR PENDING FOLLOWUPS --- */}
            {modalOpen && modalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setModalOpen(false)}></div>
                    
                    {/* Modal Content */}
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{modalData.label === 'Hot Pipeline' ? 'Hot Customers' : 'Pending Follow-ups'}</h3>
                                <p className="text-xs text-slate-500">
                                    {modalData.isHot ? 'High Priority' : `Salesman: ${modalData.label}`} • {modalData.leads.length} Records
                                </p>
                            </div>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X className="h-5 w-5 text-slate-500" /></button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-2">
                            {modalData.leads.length > 0 ? (
                                <div className="space-y-2">
                                    {modalData.leads.map((lead, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:shadow-md transition-shadow group">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-10 w-10 rounded-full ${modalData.isHot ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} flex items-center justify-center`}>
                                                    {modalData.isHot ? <Flame className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">{lead.name}</p>
                                                    <p className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {lead.date || 'Today'}
                                                    </p>
                                                </div>
                                            </div>
                                            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors">
                                                <Phone className="h-3 w-3" />
                                                {lead.phone}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <p>No details available.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                            <button onClick={() => setModalOpen(false)} className="text-xs font-bold text-slate-500 hover:text-slate-800">Close List</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EnquiryStats;