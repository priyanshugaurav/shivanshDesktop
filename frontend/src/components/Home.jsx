import React from 'react';
import { 
    TrendingUp, Package, Users, CreditCard, 
    ArrowUpRight, ChevronRight, AlertCircle, 
    MessageSquare, DollarSign, Wallet, Activity
} from 'lucide-react';
import { 
    AreaChart, Area, ResponsiveContainer, BarChart, Bar, Cell 
} from 'recharts';

const Home = ({ theme: t, setActiveTab }) => {
    
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
    const THEME_HEX = t.primary.includes('emerald') ? '#10b981' : '#3b82f6'; // Simplified for charts

    // --- MOCK DATA ---
    const salesData = [
        { name: 'Mon', value: 4000 },
        { name: 'Tue', value: 3000 },
        { name: 'Wed', value: 5000 },
        { name: 'Thu', value: 2780 },
        { name: 'Fri', value: 1890 },
        { name: 'Sat', value: 2390 },
        { name: 'Sun', value: 3490 },
    ];

    const enquiryData = [
        { name: 'New', value: 12 },
        { name: 'Hot', value: 8 },
        { name: 'Cold', value: 4 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans text-slate-800">
            
            {/* --- WELCOME HEADER --- */}
            <div className="flex justify-between items-end pb-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Good Morning, Admin
                    </h1>
                    <p className="text-xs font-medium text-slate-500 mt-1">Here's what's happening at your showroom today.</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${t.primary} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${t.primary}`}></span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">System Live</span>
                </div>
            </div>

            {/* --- BENTO GRID LAYOUT --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[minmax(140px,auto)]">
                
                {/* 1. SALES HERO CARD (Span 2 cols) */}
                <div 
                    onClick={() => setActiveTab('analytics')}
                    className={`col-span-1 md:col-span-2 p-6 rounded-[2rem] bg-gradient-to-br ${THEME_GRADIENT} text-white shadow-xl relative overflow-hidden group cursor-pointer transition-transform hover:scale-[1.01]`}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <TrendingUp size={18} />
                                <span className="text-xs font-bold uppercase tracking-widest">Revenue</span>
                            </div>
                            <p className="text-4xl font-black tracking-tight">₹ 85.4 L</p>
                            <p className="text-xs font-medium opacity-80 mt-1">+12.5% vs last month</p>
                        </div>
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                            <ArrowUpRight size={20} />
                        </div>
                    </div>

                    <div className="h-[60px] w-full mt-4 -mb-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="colorSalesHome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <Area type="monotone" dataKey="value" stroke="#fff" strokeWidth={2} fill="url(#colorSalesHome)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. ENQUIRY SUMMARY */}
                <div 
                    onClick={() => setActiveTab('enquiry')}
                    className="p-6 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between cursor-pointer group hover:border-slate-300 transition-all"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Enquiries</p>
                            <p className="text-3xl font-black text-slate-800 mt-1">24</p>
                        </div>
                        <div className={`p-2.5 rounded-xl ${t.light} ${t.text} group-hover:scale-110 transition-transform`}>
                            <MessageSquare size={18} />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <div className="flex-1 bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Hot</p>
                            <p className="text-sm font-black text-rose-500">8</p>
                        </div>
                        <div className="flex-1 bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">New</p>
                            <p className="text-sm font-black text-emerald-500">12</p>
                        </div>
                    </div>
                </div>

                {/* 3. STOCK ALERT */}
                <div 
                    onClick={() => setActiveTab('stock')}
                    className="p-6 rounded-[2rem] bg-slate-900 text-white shadow-lg relative overflow-hidden flex flex-col justify-between cursor-pointer group transition-transform hover:scale-[1.02]"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inventory</p>
                            <p className="text-3xl font-black mt-1">128</p>
                        </div>
                        <div className="p-2.5 bg-white/10 rounded-xl text-amber-400">
                            <Package size={18} />
                        </div>
                    </div>
                    <div className="relative z-10 mt-4">
                        <div className="flex items-center gap-2 text-rose-400 text-xs font-bold mb-1">
                            <AlertCircle size={12} /> Low Stock Alert
                        </div>
                        <p className="text-[10px] text-slate-400">Rajhans Yodha (Red) is below 5 units.</p>
                    </div>
                </div>

                {/* 4. DUES COLLECTION */}
                <div 
                    onClick={() => setActiveTab('dues')}
                    className="p-6 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-all"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Dues</p>
                            <p className="text-2xl font-black text-slate-800 mt-1">₹ 8.5 L</p>
                        </div>
                        <div className={`p-2.5 rounded-xl ${t.light} ${t.text}`}>
                            <CreditCard size={18} />
                        </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                        <div className={`h-full bg-rose-500 w-[35%]`}></div>
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-[9px] font-bold text-slate-400">14 Customers</span>
                        <span className="text-[9px] font-bold text-rose-500">35% Overdue</span>
                    </div>
                </div>

                {/* 5. STAFF PRESENCE */}
                <div 
                    onClick={() => setActiveTab('employees')}
                    className="p-6 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between cursor-pointer hover:border-slate-300 transition-all"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Staff Present</p>
                            <p className="text-2xl font-black text-slate-800 mt-1">12<span className="text-sm text-slate-400">/14</span></p>
                        </div>
                        <div className={`p-2.5 rounded-xl ${t.light} ${t.text}`}>
                            <Users size={18} />
                        </div>
                    </div>
                    <div className="flex -space-x-2 mt-3 overflow-hidden">
                        {[1,2,3,4].map((i) => (
                            <div key={i} className={`inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500`}>
                                U{i}
                            </div>
                        ))}
                        <div className="h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                            +8
                        </div>
                    </div>
                </div>

                {/* 6. EXPENSE SNAPSHOT */}
                <div 
                    onClick={() => setActiveTab('expenses')}
                    className="col-span-1 md:col-span-2 p-6 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm flex items-center justify-between cursor-pointer hover:border-slate-300 transition-all"
                >
                    <div className="flex flex-col justify-center h-full">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">This Month's Expense</p>
                        <p className="text-3xl font-black text-slate-900 mt-1">₹ 3.14 L</p>
                        <div className="flex items-center gap-1 mt-2 text-[10px] font-bold text-slate-500">
                            <Activity size={12} className={t.text} /> 
                            <span>Payroll is the highest contributor (78%)</span>
                        </div>
                    </div>
                    <div className="h-[80px] w-[120px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={salesData.slice(0,5)}>
                                <Bar dataKey="value" radius={[4,4,0,0]}>
                                    {salesData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 2 ? THEME_HEX : '#f1f5f9'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* --- QUICK ACTIONS ROW --- */}
            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Quick Actions</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    <button onClick={() => setActiveTab('sales')} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:shadow-md hover:border-slate-300 transition-all whitespace-nowrap">
                        <DollarSign size={14} className="text-emerald-500"/> New Sale
                    </button>
                    <button onClick={() => setActiveTab('enquiry')} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:shadow-md hover:border-slate-300 transition-all whitespace-nowrap">
                        <MessageSquare size={14} className="text-blue-500"/> Add Enquiry
                    </button>
                    <button onClick={() => setActiveTab('stock')} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:shadow-md hover:border-slate-300 transition-all whitespace-nowrap">
                        <Package size={14} className="text-amber-500"/> Update Stock
                    </button>
                    <button onClick={() => setActiveTab('dues')} className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:shadow-md hover:border-slate-300 transition-all whitespace-nowrap">
                        <Wallet size={14} className="text-rose-500"/> Collect Payment
                    </button>
                </div>
            </div>

        </div>
    );
};

export default Home;