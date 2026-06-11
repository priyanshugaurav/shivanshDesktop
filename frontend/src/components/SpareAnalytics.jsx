import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    TrendingUp, Wallet, Package, AlertCircle, Clock, ArrowUpRight, ArrowDownRight,
    IndianRupee, Layers, ShoppingCart, Users, Wrench, BarChart3, Activity, ChevronRight
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ComposedChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const SpareAnalytics = ({ theme: t }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [period, setPeriod] = useState('all_time');
    const [customMonth, setCustomMonth] = useState('');

    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: token } };
    };

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

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                let url = `${API_URL}/spare-analytics?period=${period}`;
                if (period === 'custom' && customMonth) {
                    url += `&month=${customMonth}`;
                }
                const res = await axios.get(url, getAuthHeader());
                setData(res.data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        
        // If custom is selected but no month chosen yet, don't fetch or just fetch all
        if (period === 'custom' && !customMonth) return;
        
        fetchData();
    }, [period, customMonth]);

    const formatCurrency = (val) => {
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
        return `₹${val.toLocaleString()}`;
    };

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

    const { kpis, monthlyData, paymentDistribution, topItems, categoryDistribution, recentBills, topCustomers } = data;

    const PIE_COLORS = [THEME_COLOR, '#334155', '#94a3b8', '#cbd5e1', '#e2e8f0'];

    const kpiCards = [
        { id: 'revenue', label: 'Total Revenue', value: formatCurrency(kpis.totalRevenue), icon: IndianRupee, variant: 'primary', sub: 'All spare part sales', isPositive: true },
        { id: 'profit', label: 'Net Profit', value: formatCurrency(kpis.totalProfit), icon: Wallet, variant: 'dark', sub: 'Revenue minus cost price', isPositive: kpis.totalProfit >= 0 },
        { id: 'cost', label: 'Total Cost', value: formatCurrency(kpis.totalCost), icon: ShoppingCart, variant: 'white', sub: 'Purchase cost of items sold', isPositive: false },
        { id: 'labour', label: 'Labour Revenue', value: formatCurrency(kpis.totalLabourRevenue), icon: Wrench, variant: 'white', sub: 'Pure service earnings', isPositive: true },
        { id: 'bills', label: 'Total Bills', value: kpis.totalBills.toString(), icon: Layers, variant: 'white', sub: `${kpis.totalItemsSold} items sold`, isPositive: true },
        { id: 'stock_value', label: 'Stock Value', value: formatCurrency(kpis.totalStockValue), icon: Package, variant: 'dark', sub: `${kpis.totalStockQty} items in stock`, isPositive: true },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans text-slate-800">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-2 flex items-center gap-2">
                        Spare Analytics <span className="text-slate-300 font-light">/</span> Overview
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
                <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time Period</label>
                        <select 
                            value={period} 
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:border-slate-400 shadow-sm min-w-[140px]"
                        >
                            <option value="all_time">All Time</option>
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="custom">Custom Month</option>
                        </select>
                    </div>
                    {period === 'custom' && (
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Month</label>
                            <input 
                                type="month" 
                                value={customMonth}
                                onChange={(e) => setCustomMonth(e.target.value)}
                                className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:border-slate-400 shadow-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* --- KPI CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {kpiCards.map((kpi) => {
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
                            {(isPrimary || isDark) && (
                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none group-hover:bg-white/20 transition-all"></div>
                            )}
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`p-2.5 rounded-xl ${iconBox} shadow-sm`}>
                                    <kpi.icon size={16} />
                                </div>
                                <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg ${trendBox}`}>
                                    {kpi.isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                </div>
                            </div>
                            <div className="relative z-10">
                                <h3 className={`text-[9px] font-black uppercase tracking-widest mb-1 ${subClass}`}>{kpi.label}</h3>
                                <p className={`text-2xl font-black tracking-tight ${textClass}`}>{kpi.value}</p>
                                <p className={`text-[9px] font-medium mt-2 ${subClass}`}>{kpi.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- MAIN CHARTS ROW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Revenue vs Profit Chart */}
                <div className="lg:col-span-8 bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Revenue & Profit Trend</h3>
                            <p className="text-[10px] text-slate-500 font-medium">Last 6 months performance</p>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${t.primary}`}></span>
                                <span className="text-[9px] font-bold uppercase text-slate-500">Revenue</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-[9px] font-bold uppercase text-slate-500">Profit</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                                <span className="text-[9px] font-bold uppercase text-slate-500">Cost</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                                <CartesianGrid stroke="#f1f5f9" vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} dy={10} />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    tickFormatter={(val) => val >= 100000 ? `${(val/100000).toFixed(1)}L` : val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px' }}
                                    cursor={{ fill: '#f8fafc' }}
                                    formatter={(val, name) => [
                                        `₹ ${new Intl.NumberFormat('en-IN').format(val)}`,
                                        name === 'revenue' ? 'Revenue' : name === 'profit' ? 'Profit' : 'Cost'
                                    ]}
                                />
                                <Bar dataKey="revenue" barSize={18} fill="currentColor" className={t.text} radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                                <Line type="monotone" dataKey="cost" stroke="#1e293b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Payment Distribution + Out of Stock */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                    {/* Payment Distribution */}
                    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-slate-900">Payment Methods</h3>
                            <div className={`p-1.5 rounded-lg ${t.light} ${t.text}`}>
                                <BarChart3 size={14} />
                            </div>
                        </div>
                        <div className="h-[160px] w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={paymentDistribution} innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" stroke="none">
                                        {paymentDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', fontSize: '10px', border: 'none' }}
                                        formatter={(val) => [`${val} Bills`, 'Count']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                                <span className="block text-2xl font-black text-slate-800">{kpis.totalBills}</span>
                                <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Total Bills</span>
                            </div>
                        </div>
                        <div className="flex justify-center gap-4">
                            {paymentDistribution.map((m, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                                    <span className="text-[9px] font-bold text-slate-600">{m.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Inventory Health */}
                    <div className="bg-slate-900 p-5 rounded-[1.5rem] shadow-lg text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-4 relative z-10">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Inventory Health</h3>
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-bold">Live</span>
                        </div>
                        <div className="relative z-10 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-300 font-medium">Total Stock Qty</span>
                                <span className="text-sm font-black text-white">{kpis.totalStockQty}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-300 font-medium">Stock Worth</span>
                                <span className="text-sm font-black text-white">{formatCurrency(kpis.totalStockValue)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-300 font-medium">Out of Stock</span>
                                <span className={`text-sm font-black ${kpis.outOfStockCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {kpis.outOfStockCount} items
                                </span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden mt-2">
                                <div
                                    className={`h-full ${t.primary} rounded-full transition-all duration-700`}
                                    style={{ width: `${kpis.totalStockQty > 0 ? Math.max(((kpis.totalStockQty - kpis.outOfStockCount) / kpis.totalStockQty) * 100, 5) : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BENTO ROW: Top Items, Customers, Recent Bills --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Top Selling Items */}
                <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex flex-col h-[360px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <TrendingUp size={12} className="text-emerald-500" /> Top Selling Items
                        </h3>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">By Revenue</span>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {topItems.length > 0 ? topItems.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all group cursor-pointer">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm group-hover:scale-110 transition-transform">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-bold text-slate-900 leading-tight">{item.name}</h4>
                                        <p className="text-[9px] text-slate-500 font-medium">{item.qtySold} units sold</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-black ${t.text}`}>₹{item.revenue.toLocaleString()}</span>
                            </div>
                        )) : (
                            <div className="text-[10px] text-slate-400 text-center py-12 italic">No sales data yet</div>
                        )}
                    </div>
                </div>

                {/* Recent Bills */}
                <div className="lg:col-span-1 bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex flex-col h-[360px]">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <Activity size={12} className="text-blue-500" /> Recent Bills
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {recentBills.length > 0 ? recentBills.map((bill, i) => (
                            <div key={i} className="flex gap-3 items-start group">
                                <div className={`mt-1 w-2 h-2 rounded-full shrink-0 bg-emerald-500 ring-4 ring-white group-hover:scale-125 transition-transform`}></div>
                                <div className="pb-3 border-b border-slate-50 w-full group-last:border-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-700">{bill.customer}</p>
                                            <p className="text-[9px] text-slate-400 mt-0.5">{bill.items}</p>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-800">₹{bill.total.toLocaleString()}</span>
                                    </div>
                                    <p className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-1"><Clock size={8}/> {bill.date} • {bill.payment}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="text-[10px] text-slate-400 text-center py-12 italic">No bills yet</div>
                        )}
                    </div>
                </div>

                {/* Top Customers + Category Distribution */}
                <div className="flex flex-col gap-5">
                    {/* Top Customers */}
                    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex-1">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-slate-900">Top Customers</h3>
                            <Users size={14} className="text-slate-400" />
                        </div>
                        <div className="space-y-2">
                            {topCustomers.length > 0 ? topCustomers.map((cust, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm ${['bg-indigo-500','bg-rose-500','bg-amber-500','bg-emerald-500','bg-violet-500'][i%5]}`}>
                                            {cust.name[0]}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-slate-600 truncate max-w-[100px]">{cust.name}</span>
                                            <span className="text-[8px] text-slate-400">{cust.count} orders</span>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md">₹{cust.total.toLocaleString()}</span>
                                </div>
                            )) : (
                                <div className="text-[10px] text-slate-400 text-center py-8 italic">No customer data yet</div>
                            )}
                        </div>
                    </div>

                    {/* Category Distribution */}
                    <div className="bg-slate-900 p-5 rounded-[1.5rem] shadow-lg text-white relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-3 relative z-10">
                            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Stock by Category</h3>
                        </div>
                        <div className="space-y-3 relative z-10">
                            {categoryDistribution.length > 0 ? categoryDistribution.map((cat, i) => (
                                <div key={i} className="flex flex-col gap-1 group">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-bold text-slate-300 truncate max-w-[120px]">{cat.name}</span>
                                        <span className="text-[10px] font-black text-white">{cat.value} pcs</span>
                                    </div>
                                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${t.primary} rounded-full transition-all duration-700`}
                                            style={{ width: `${Math.max((cat.value / Math.max(kpis.totalStockQty, 1)) * 100, 3)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-[10px] text-slate-500 text-center py-8 italic">No categories yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PROFIT SUMMARY FOOTER --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 bg-gradient-to-r from-slate-900 to-slate-800 rounded-[1.5rem] p-5 text-white flex items-center justify-between shadow-xl shadow-slate-200/50 relative overflow-hidden">
                    <div className="absolute left-0 top-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10">
                            <Wallet size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">Spare Parts Profit Summary</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                                Revenue: <span className="text-white font-bold">₹{kpis.totalRevenue.toLocaleString()}</span> — 
                                Cost: <span className="text-white font-bold">₹{kpis.totalCost.toLocaleString()}</span> — 
                                Labour: <span className="text-white font-bold">₹{kpis.totalLabourRevenue.toLocaleString()}</span>
                            </p>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block relative z-10">
                        <p className={`text-2xl font-black ${kpis.totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ₹{kpis.totalProfit.toLocaleString()}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Net Profit</p>
                    </div>
                </div>

                <div className="bg-white border border-slate-200/60 rounded-[1.5rem] p-5 flex flex-col justify-center items-center text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group">
                    <div className={`p-3 rounded-full ${t.light} ${t.text} mb-2 group-hover:scale-110 transition-transform`}>
                        <BarChart3 size={18} />
                    </div>
                    <h5 className="font-bold text-slate-900 text-xs">Spare Reports</h5>
                    <p className="text-[9px] text-slate-400 mt-0.5">Coming Soon</p>
                </div>
            </div>
        </div>
    );
};

export default SpareAnalytics;
