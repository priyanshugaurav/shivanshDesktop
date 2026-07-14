import React, { useState, useEffect, useMemo } from 'react';
import { 
    TrendingUp, Package, Users, Calendar, 
    ArrowUpRight, AlertCircle, MessageSquare, 
    Activity, Loader2, Phone, Filter, ChevronDown, PenTool
} from 'lucide-react';
import { 
    AreaChart, Area, ResponsiveContainer, BarChart, Bar, 
    PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { useEnquiries } from '../hooks/useEnquiries';

const Home = ({ theme: t }) => {
    // --- STATE ---
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [timeFilter, setTimeFilter] = useState('This Month'); // This Month, Last Month, All Time, Custom
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    const { data: leadsData } = useEnquiries('Enquiries');
    
    // --- DATE RANGE LOGIC ---
    const getDateRange = React.useCallback(() => {
        const now = new Date();
        let start, end;

        if (timeFilter === 'This Month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        } else if (timeFilter === 'Last Month') {
            start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        } else if (timeFilter === 'Custom' && customRange.start && customRange.end) {
            start = new Date(customRange.start);
            end = new Date(customRange.end);
            end.setHours(23, 59, 59, 999);
        } else {
            // All Time
            return { startDate: null, endDate: null };
        }
        return { startDate: start.toISOString(), endDate: end.toISOString() };
    }, [timeFilter, customRange]);

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
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching analytics:', error);
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
            
            // Only process if it falls in the selected date range
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

    const COLORS = ['#f43f5e', '#f59e0b', '#cbd5e1'];

    // --- CHART DATA PROCESSING ---
    const processedSalesTrend = useMemo(() => {
        if (!stats?.sales?.trend) return [];
        // Group by day for simple trend
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans text-slate-800">
            
            {/* --- WELCOME HEADER & TIME FILTER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end pb-2 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Analytics Overview
                    </h1>
                    <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider opacity-70">Showroom Operations & Volumes</p>
                </div>
                
                <div className="flex items-center gap-2 relative">
                    <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex items-center">
                        {['This Month', 'Last Month', 'All Time', 'Custom'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setTimeFilter(f)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${timeFilter === f ? `bg-slate-900 text-white shadow-md` : 'text-slate-500 hover:bg-slate-100'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* CUSTOM DATE PICKER ROW */}
            {timeFilter === 'Custom' && (
                <div className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2 w-fit">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Start Date</label>
                        <input type="date" value={customRange.start} onChange={e => setCustomRange({...customRange, start: e.target.value})} className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-slate-400" />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">End Date</label>
                        <input type="date" value={customRange.end} onChange={e => setCustomRange({...customRange, end: e.target.value})} className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:border-slate-400" />
                    </div>
                </div>
            )}

            {loading || !stats ? (
                <div className="h-96 flex flex-col items-center justify-center space-y-4">
                    <Loader2 size={40} className={`animate-spin ${t.text}`} />
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Compiling Analytics...</p>
                </div>
            ) : (
                <>
                    {/* --- KPI HERO CARDS (Non-Monetary) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                        
                        {/* 1. Vehicles Sold */}
                        <div className={`lg:col-span-2 p-6 rounded-[2.5rem] bg-gradient-to-br ${THEME_GRADIENT} text-white shadow-xl relative overflow-hidden group transition-all hover:shadow-2xl hover:-translate-y-1`}>
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                            <div className="flex justify-between items-start relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-2 opacity-90">
                                        <TrendingUp size={18} />
                                        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Vehicles Delivered</span>
                                    </div>
                                    <p className="text-5xl font-black tracking-tighter">{stats.sales.total}</p>
                                    <p className="text-xs font-bold opacity-80 mt-2">units in selected period</p>
                                </div>
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-inner">
                                    <Package size={22} />
                                </div>
                            </div>
                        </div>

                        {/* 2. Active Leads */}
                        <div className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-slate-300 hover:shadow-xl transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leads Gen</p>
                                    <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{leadStats.total}</p>
                                </div>
                                <div className={`p-3 rounded-2xl ${t.light} ${t.text} group-hover:scale-110 transition-transform shadow-sm`}>
                                    <MessageSquare size={20} />
                                </div>
                            </div>
                            <p className="text-xs font-bold text-slate-400 mt-2">in selected period</p>
                        </div>

                        {/* 3. Spares Items Sold */}
                        <div className="p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-slate-300 hover:shadow-xl transition-all">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spares Sold</p>
                                    <p className="text-4xl font-black text-slate-900 mt-2 tracking-tight">{stats.spares.totalSold}</p>
                                </div>
                                <div className={`p-3 rounded-2xl bg-amber-50 text-amber-500 group-hover:rotate-12 transition-transform shadow-sm`}>
                                    <PenTool size={20} />
                                </div>
                            </div>
                            <p className="text-xs font-bold text-slate-400 mt-2">total items qty</p>
                        </div>

                        {/* 4. Current Stock & Staff (Time independent) */}
                        <div className="p-6 rounded-[2.5rem] bg-slate-900 text-white shadow-xl relative overflow-hidden flex flex-col justify-between group transition-all hover:-translate-y-1 hover:shadow-2xl hover:bg-slate-800">
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Stock</p>
                                    <p className="text-3xl font-black mt-2 tracking-tight">{stats.stock.total}</p>
                                </div>
                                <div className="p-3 bg-white/10 rounded-2xl text-emerald-400 shadow-inner">
                                    <Package size={20} />
                                </div>
                            </div>
                            <div className="relative z-10 flex justify-between items-end border-t border-slate-700 pt-4 mt-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Staff</p>
                                    <p className="text-2xl font-black mt-1 tracking-tight">{stats.staff.active}</p>
                                </div>
                                <Users size={20} className="text-slate-500 mb-1"/>
                            </div>
                        </div>

                    </div>

                    {/* --- CHARTS ROW --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        
                        {/* Sales Trend Chart */}
                        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Sales Volume Trend</h3>
                            <div className="h-64 w-full">
                                {processedSalesTrend.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={processedSalesTrend}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={THEME_HEX} stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor={THEME_HEX} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', fontWeight: 800 }} />
                                            <Area type="monotone" dataKey="count" stroke={THEME_HEX} strokeWidth={3} fill="url(#colorSales)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs font-bold text-slate-300 uppercase tracking-widest">No sales in this period</div>
                                )}
                            </div>
                        </div>

                        {/* Leads Pie Chart */}
                        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm flex flex-col">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Leads Quality</h3>
                            <div className="flex-1 min-h-[200px] relative">
                                {leadPieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={leadPieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {leadPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 800 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs font-bold text-slate-300 uppercase tracking-widest">No leads in this period</div>
                                )}
                                {/* Center Label */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                                    <span className="text-3xl font-black text-slate-800">{leadStats.total}</span>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Leads</span>
                                </div>
                            </div>
                            <div className="flex justify-center gap-4 mt-2">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-[10px] font-black text-slate-500">Hot</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-[10px] font-black text-slate-500">Warm</span></div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div><span className="text-[10px] font-black text-slate-500">Cold</span></div>
                            </div>
                        </div>

                    </div>

                    {/* --- TABLES ROW --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        
                        {/* Live Stock Composition */}
                        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Stock Composition</h3>
                            <div className="h-64 w-full">
                                {stats.stock.byModel.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.stock.byModel} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569', fontWeight: 800 }} width={100} />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontWeight: 800 }} />
                                            <Bar dataKey="count" fill={THEME_HEX} radius={[0, 8, 8, 0]} barSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-xs font-bold text-slate-300 uppercase tracking-widest">Out of stock</div>
                                )}
                            </div>
                        </div>

                        {/* Recent Deliveries List */}
                        <div className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm flex flex-col">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Recent Deliveries (Selected Period)</h3>
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                {stats.sales.trend.slice(-8).reverse().map((sale, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm text-white`} style={{ backgroundColor: THEME_HEX }}>
                                                <Package size={16} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800">{sale.customerName}</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">{sale.model || 'Unknown Model'}</p>
                                            </div>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {new Date(sale.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                ))}
                                {stats.sales.trend.length === 0 && (
                                    <div className="py-10 text-center text-xs font-bold text-slate-300 uppercase tracking-widest">No deliveries to display</div>
                                )}
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};

export default Home;