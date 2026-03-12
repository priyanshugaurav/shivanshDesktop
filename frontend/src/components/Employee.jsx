import React, { useState } from 'react';
import { 
    Users, Search, Filter, Plus, ChevronRight, Mail, Phone, 
    MapPin, Calendar, DollarSign, TrendingUp, Award, Clock, 
    CheckCircle2, XCircle, AlertCircle, FileText, Download,
    Briefcase, CreditCard, ChevronLeft, MoreHorizontal, UserCheck,
    Smartphone, Shield, Building2, Wallet, Target, Zap, UserPlus,
    LayoutGrid, PieChart as PieIcon, Activity, CalendarClock,
    LogIn, LogOut, Timer
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';

const Employee = ({ theme: t }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'sales', 'payroll', 'docs', 'attendance'

    // --- THEME UTILS ---
    const getThemeGradient = () => {
        if (t.primary.includes('emerald')) return 'from-emerald-600 to-emerald-800';
        if (t.primary.includes('blue')) return 'from-blue-600 to-blue-800';
        if (t.primary.includes('violet')) return 'from-violet-600 to-violet-800';
        if (t.primary.includes('rose')) return 'from-rose-600 to-rose-800';
        if (t.primary.includes('amber')) return 'from-amber-500 to-amber-700';
        return 'from-slate-700 to-slate-900';
    };
    const THEME_GRADIENT = getThemeGradient();
    
    // Hex for charts
    const THEME_HEX = t.primary.includes('emerald') ? '#059669' : 
                      t.primary.includes('blue') ? '#2563eb' : 
                      t.primary.includes('rose') ? '#e11d48' : '#475569';

    // --- MOCK DATA ---
    const employees = [
        { 
            id: 'EMP-2024-001', name: 'Amit Sharma', role: 'Senior DSE', status: 'Active', 
            email: 'amit.s@nexus.com', phone: '+91 98765 43210', location: 'Jagadhri HQ',
            joinDate: '15 Jan, 2024', rating: 4.8, dob: '12 Aug 1995', bloodGroup: 'O+',
            stats: { totalSales: 45, revenue: '58.5 L', commission: '1.45 L', attendance: '96%' },
            salary: { base: 18000, allowance: 4500, incentives: 12500, tax: 1500 }
        },
        { 
            id: 'EMP-2024-002', name: 'Vikram Rathore', role: 'Sales Executive', status: 'Active', 
            email: 'vikram.r@nexus.com', phone: '+91 98765 12345', location: 'City Center',
            joinDate: '01 Mar, 2024', rating: 4.5, dob: '05 May 1998', bloodGroup: 'B+',
            stats: { totalSales: 32, revenue: '41.2 L', commission: '98 K', attendance: '92%' },
            salary: { base: 15000, allowance: 3000, incentives: 8200, tax: 1200 }
        },
        // ... (other employees)
    ];

    const salesHistory = [
        { id: 'INV-102', model: 'Rajhans Star', date: 'Jan 24, 2026', customer: 'Rahul K.', price: '1,24,000', comm: '3,100', status: 'Paid' },
        { id: 'INV-098', model: 'Rajhans Super', date: 'Jan 20, 2026', customer: 'Anita Singh', price: '1,35,000', comm: '3,375', status: 'Paid' },
        { id: 'INV-095', model: 'Rajhans Yodha', date: 'Jan 18, 2026', customer: 'Gurmeet P.', price: '1,50,000', comm: '3,750', status: 'Pending' },
    ];

    const performanceData = [
        { month: 'Aug', sales: 4, revenue: 5.2 }, 
        { month: 'Sep', sales: 6, revenue: 7.8 }, 
        { month: 'Oct', sales: 8, revenue: 10.4 }, 
        { month: 'Nov', sales: 5, revenue: 6.5 }, 
        { month: 'Dec', sales: 9, revenue: 11.7 }, 
        { month: 'Jan', sales: 12, revenue: 15.6 }
    ];

    // Attendance Data Simulation
    const attendanceGrid = Array(28).fill(null).map((_, i) => {
        const r = Math.random();
        return r > 0.8 ? 'off' : r > 0.7 ? 'late' : r > 0.1 ? 'present' : 'absent';
    });

    const attendanceHistory = Array.from({ length: 15 }, (_, i) => ({
        date: `Jan ${28 - i}, 2026`,
        status: Math.random() > 0.9 ? 'Absent' : Math.random() > 0.8 ? 'Late' : 'Present',
        checkIn: '09:30 AM',
        checkOut: '06:30 PM',
        hours: '9h 00m'
    }));

    // --- HANDLERS ---
    const handleViewDetail = (emp) => {
        setSelectedEmp(emp);
        setViewMode('detail');
        setActiveTab('dashboard');
    };

    const handleBack = () => {
        setViewMode('list');
        setSelectedEmp(null);
    };

    const handleViewHistory = () => {
        setActiveTab('attendance');
    };

    // --- 1. VIEW: EMPLOYEE LIST ---
    if (viewMode === 'list') {
        return (
            <div className="space-y-6 animate-in fade-in duration-300 pb-20">
                
                {/* --- BENTO GRID STATS --- */}
                {/* Added mb-6 margin bottom as requested for spacing */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    
                    {/* 1. Workforce Hero */}
                    <div className={`md:col-span-2 p-6 rounded-[2rem] bg-gradient-to-r ${THEME_GRADIENT} text-white shadow-xl relative overflow-hidden flex items-center justify-between`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <Users size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest">Total Workforce</span>
                            </div>
                            <p className="text-4xl font-black">14 <span className="text-lg font-medium opacity-70">Employees</span></p>
                            <div className="flex gap-3 mt-4">
                                <span className="bg-white/20 px-3 py-1 rounded-xl text-[10px] font-bold backdrop-blur-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> 12 Active
                                </span>
                                <span className="bg-white/20 px-3 py-1 rounded-xl text-[10px] font-bold backdrop-blur-sm">2 On Leave</span>
                            </div>
                        </div>
                        <div className="hidden sm:block p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                            <CircularProgress percentage={92} color="white" size={60} stroke={6} />
                            <p className="text-[9px] font-bold text-center mt-2 uppercase tracking-wider">Present</p>
                        </div>
                    </div>

                    {/* 2. Department Split */}
                    <div className="p-6 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:border-slate-300 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Split</p>
                            <div className="p-2 bg-slate-50 rounded-xl text-slate-400"><LayoutGrid size={16} /></div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                                    <span>Sales (DSE)</span> <span>8</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full ${t.primary} w-[65%]`}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                                    <span>Service</span> <span>4</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 w-[30%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Payroll Pulse */}
                    <div className="flex flex-col gap-4">
                        <div className="flex-1 p-5 rounded-[1.5rem] bg-slate-900 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payroll Est.</p>
                                <p className="text-xl font-black mt-0.5">₹ 4.25 L</p>
                            </div>
                            <div className="p-2.5 bg-white/10 rounded-full backdrop-blur-md">
                                <DollarSign size={18} className="text-emerald-400"/>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-5 rounded-[1.5rem] bg-white border border-slate-200/60 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Probation</p>
                                <p className="text-xl font-black text-slate-900 mt-0.5">3 <span className="text-xs text-slate-400 font-medium">New</span></p>
                            </div>
                            <div className={`p-2.5 rounded-full ${t.light} ${t.text}`}>
                                <UserPlus size={18} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by name, role or ID..." 
                            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-300 transition-all shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                            <Filter size={14} /> Filters
                        </button>
                        <button className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ${t.primary}`}>
                            <Plus size={16} /> Add Employee
                        </button>
                    </div>
                </div>

                {/* Directory Table */}
                <div className="bg-white border border-slate-200/60 rounded-[1.5rem] shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="py-4 px-6 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Employee Details</th>
                                <th className="py-4 px-6 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Role & Status</th>
                                <th className="py-4 px-6 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Contact Info</th>
                                <th className="py-4 px-6 text-[10px] font-bold uppercase text-slate-400 tracking-wider text-right">Revenue Stats</th>
                                <th className="py-4 px-6 text-[10px] font-bold uppercase text-slate-400 tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {employees.map((emp) => (
                                <tr 
                                    key={emp.id} 
                                    onClick={() => handleViewDetail(emp)}
                                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                                >
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-md group-hover:scale-105 transition-transform ${
                                                ['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500'][employees.indexOf(emp) % 4]
                                            }`}>
                                                {emp.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{emp.name}</p>
                                                <p className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">{emp.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="text-xs font-bold text-slate-700">{emp.role}</p>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <span className={`w-2 h-2 rounded-full ${emp.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                                            <span className={`text-[10px] font-bold uppercase ${emp.status === 'Active' ? 'text-emerald-600' : 'text-amber-600'}`}>{emp.status}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors">
                                                <Mail size={12} className="text-slate-300"/> {emp.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors">
                                                <Phone size={12} className="text-slate-300"/> {emp.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <p className="text-sm font-black text-slate-900">{emp.stats.revenue}</p>
                                        <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block mt-1">
                                            Comm: {emp.stats.commission}
                                        </p>
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
                                            <ChevronRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // --- 2. VIEW: EMPLOYEE DETAILS ---
    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-20">
            
            {/* Top Navigation Bar (UNLOCKED / NOT STICKY) */}
            <div className="flex items-center gap-4 bg-white p-3 mb-10 rounded-2xl border border-slate-200/60 shadow-sm mb-2">
                <button 
                    onClick={handleBack}
                    className="p-2.5 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all"
                >
                    <ChevronLeft size={18} />
                </button>
                <div className="h-8 w-px bg-slate-200 mx-1"></div>
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">{selectedEmp.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{selectedEmp.role}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-[10px] font-medium text-slate-400">{selectedEmp.location}</span>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    <button className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-all border border-transparent hover:border-slate-200">
                        <MoreHorizontal size={18} />
                    </button>
                    <button className={`px-5 py-2 rounded-xl text-[11px] font-bold text-white shadow-md hover:shadow-lg transition-all ${t.primary}`}>
                        Edit Profile
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* --- LEFT COLUMN: PROFILE CARD (3 cols) --- */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Hero Profile Card */}
                    <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm relative overflow-hidden h-full flex flex-col">
                        <div className={`h-32 w-full bg-gradient-to-br ${THEME_GRADIENT}`}></div>
                        <div className="px-6 pb-6 text-center -mt-12 relative z-10 flex-1 flex flex-col">
                            <div className="w-24 h-24 mx-auto bg-white p-1 rounded-3xl shadow-xl">
                                <div className={`w-full h-full rounded-2xl flex items-center justify-center text-3xl font-black text-white bg-gradient-to-br ${THEME_GRADIENT}`}>
                                    {selectedEmp.name.substring(0, 2).toUpperCase()}
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mt-4">{selectedEmp.name}</h2>
                            <p className="text-xs font-medium text-slate-500 mb-6">{selectedEmp.id}</p>
                            
                            <div className="grid grid-cols-2 gap-3 text-left mb-6">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Join Date</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400"/>
                                        <span className="text-xs font-bold text-slate-700">{selectedEmp.joinDate}</span>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rating</p>
                                    <div className="flex items-center gap-2">
                                        <Award size={14} className="text-amber-500"/>
                                        <span className="text-xs font-bold text-slate-700">{selectedEmp.rating} / 5.0</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex flex-col gap-3 mt-auto">
                                <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                                    <div className="p-2 bg-slate-100 rounded-lg"><Mail size={14}/></div>
                                    {selectedEmp.email}
                                </div>
                                <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                                    <div className="p-2 bg-slate-100 rounded-lg"><Phone size={14}/></div>
                                    {selectedEmp.phone}
                                </div>
                                <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                                    <div className="p-2 bg-slate-100 rounded-lg"><MapPin size={14}/></div>
                                    {selectedEmp.location}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT COLUMN: TABS & DATA (8 cols) --- */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Tab Navigation */}
                    <div className="bg-white p-1.5 rounded-2xl border border-slate-200/60 shadow-sm inline-flex w-full sm:w-auto overflow-x-auto">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                            { id: 'sales', label: 'Sales', icon: FileText },
                            { id: 'payroll', label: 'Payroll', icon: CreditCard },
                            { id: 'attendance', label: 'Attendance', icon: Clock }, // Added Attendance Tab
                            { id: 'docs', label: 'Document', icon: Briefcase }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                    activeTab === tab.id 
                                    ? `${t.primary} text-white shadow-md` 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                            >
                                <tab.icon size={14} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* --- TAB: DASHBOARD --- */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Performance Chart */}
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Performance Trend</h3>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Sales vs Revenue (Last 6 Months)</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                            <span className={`w-2 h-2 rounded-full ${t.primary}`}></span>
                                            <span className="text-[10px] font-bold text-slate-600">Revenue (L)</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={THEME_HEX} stopOpacity={0.2}/>
                                                    <stop offset="95%" stopColor={THEME_HEX} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 11, fill:'#94a3b8', fontWeight: 600}} dy={10}/>
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill:'#94a3b8'}}/>
                                            <Tooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}}/>
                                            <Area type="monotone" dataKey="revenue" strokeWidth={3} stroke={THEME_HEX} fill="url(#colorRevenue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Bottom 3-Column Bento Grid (Aligned) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                
                                {/* 1. Attendance Card */}
                                <div className="bg-white p-5 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-xs font-bold text-slate-900">Attendance</h3>
                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">96%</span>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1.5">
                                        {attendanceGrid.slice(0, 14).map((status, i) => (
                                            <div key={i} className={`w-full aspect-square rounded-full ${
                                                status === 'present' ? 'bg-emerald-400' :
                                                status === 'absent' ? 'bg-rose-400' :
                                                status === 'late' ? 'bg-amber-400' : 'bg-slate-200'
                                            }`}></div>
                                        ))}
                                    </div>
                                    <button 
                                        onClick={handleViewHistory}
                                        className="w-full mt-3 py-2 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-800 border border-dashed border-slate-200 hover:bg-slate-50 transition-colors"
                                    >
                                        View Full History
                                    </button>
                                </div>

                                {/* 2. Monthly Goal */}
                                <div className="bg-indigo-50/50 p-5 rounded-[2rem] border border-indigo-100 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm"><Target size={18}/></div>
                                        <span className="text-[9px] font-bold text-indigo-400">Target</span>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-indigo-900">12<span className="text-lg text-indigo-400">/15</span></p>
                                        <p className="text-[10px] font-bold text-indigo-600">Vehicles Sold</p>
                                    </div>
                                </div>

                                {/* 3. Earnings */}
                                <div className="bg-emerald-50/50 p-5 rounded-[2rem] border border-emerald-100 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm"><Wallet size={18}/></div>
                                        <span className="text-[9px] font-bold text-emerald-400">Comm.</span>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-emerald-900">₹ 1.45 L</p>
                                        <p className="text-[10px] font-bold text-emerald-600">Total YTD</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: ATTENDANCE HISTORY --- */}
                    {activeTab === 'attendance' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            
                            {/* Calendar / Summary Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Present</p>
                                    <p className="text-2xl font-black text-emerald-900 mt-1">24</p>
                                </div>
                                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                                    <p className="text-[10px] font-bold text-amber-600 uppercase">Late</p>
                                    <p className="text-2xl font-black text-amber-900 mt-1">3</p>
                                </div>
                                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
                                    <p className="text-[10px] font-bold text-rose-600 uppercase">Absent</p>
                                    <p className="text-2xl font-black text-rose-900 mt-1">1</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase">Avg. Hrs</p>
                                    <p className="text-2xl font-black text-slate-800 mt-1">9.2</p>
                                </div>
                            </div>

                            {/* Detailed Log Table */}
                            <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-slate-900">January 2026</h3>
                                    <div className="flex gap-2">
                                        <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronLeft size={16}/></button>
                                        <button className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"><ChevronRight size={16}/></button>
                                    </div>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50">
                                        <tr>
                                            <th className="py-3 px-5 text-[9px] font-bold text-slate-400 uppercase">Date</th>
                                            <th className="py-3 px-5 text-[9px] font-bold text-slate-400 uppercase text-center">Status</th>
                                            <th className="py-3 px-5 text-[9px] font-bold text-slate-400 uppercase">Check In</th>
                                            <th className="py-3 px-5 text-[9px] font-bold text-slate-400 uppercase">Check Out</th>
                                            <th className="py-3 px-5 text-[9px] font-bold text-slate-400 uppercase text-right">Work Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {attendanceHistory.map((day, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="py-3 px-5 text-xs font-bold text-slate-700">{day.date}</td>
                                                <td className="py-3 px-5 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                        day.status === 'Present' ? 'bg-emerald-50 text-emerald-600' :
                                                        day.status === 'Late' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                                    }`}>
                                                        {day.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-5 text-xs font-medium text-slate-600 flex items-center gap-2">
                                                    <LogIn size={12} className="text-slate-400"/> {day.checkIn}
                                                </td>
                                                <td className="py-3 px-5 text-xs font-medium text-slate-600">
                                                    <span className="flex items-center gap-2"><LogOut size={12} className="text-slate-400"/> {day.checkOut}</span>
                                                </td>
                                                <td className="py-3 px-5 text-xs font-bold text-slate-800 text-right font-mono">
                                                    {day.hours}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: SALES LOG --- */}
                    {activeTab === 'sales' && (
                        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Commission History</h3>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Track all sales and incentives</p>
                                </div>
                                <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                                    <Download size={14}/> Export
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="py-3 px-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Invoice</th>
                                            <th className="py-3 px-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Product</th>
                                            <th className="py-3 px-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">Sale Value</th>
                                            <th className="py-3 px-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">Commission</th>
                                            <th className="py-3 px-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {salesHistory.map((sale, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <p className="text-xs font-bold text-slate-700 font-mono">{sale.id}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{sale.date}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <p className="text-xs font-bold text-slate-900">{sale.model}</p>
                                                    <p className="text-[10px] text-slate-500">Cust: {sale.customer}</p>
                                                </td>
                                                <td className="py-4 px-6 text-xs font-bold text-slate-600 text-right">₹{sale.price}</td>
                                                <td className="py-4 px-6 text-xs font-black text-emerald-600 text-right">+ ₹{sale.comm}</td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                                                        sale.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                        {sale.status === 'Paid' ? <CheckCircle2 size={10}/> : <Clock size={10}/>}
                                                        {sale.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: PAYROLL --- */}
                    {activeTab === 'payroll' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            
                            {/* Digital Salary Slip */}
                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Payable (Jan)</p>
                                            <h2 className="text-5xl font-black tracking-tight">₹ 34,800</h2>
                                        </div>
                                        <div className="text-right">
                                            <div className="inline-block p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                                <Building2 size={24} className="text-emerald-400"/>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Base Salary</p>
                                            <p className="text-lg font-bold">₹ {selectedEmp.salary.base}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Allowances</p>
                                            <p className="text-lg font-bold">₹ {selectedEmp.salary.allowance}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Incentives</p>
                                            <p className="text-lg font-bold text-emerald-400">+ ₹ {selectedEmp.salary.incentives}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Tax / TDS</p>
                                            <p className="text-lg font-bold text-rose-400">- ₹ {selectedEmp.salary.tax}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-4">
                                        <button className="flex-1 py-3 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors shadow-lg flex items-center justify-center gap-2">
                                            <CreditCard size={14}/> Process Payment
                                        </button>
                                        <button className="px-6 py-3 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-colors border border-white/10 flex items-center gap-2">
                                            <Download size={14}/> Slip
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Bonus Manager */}
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Zap size={14} className="text-amber-500 fill-current"/> Add Bonus / Deduction
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                        <input 
                                            type="text" 
                                            placeholder="Amount" 
                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-100 outline-none"
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Reason (e.g. Diwali Bonus)" 
                                        className="flex-[2] px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-100 outline-none"
                                    />
                                    <button className={`px-6 py-3 rounded-xl text-white shadow-md hover:shadow-lg transition-all font-bold text-xs ${t.primary}`}>
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: DOCUMENTS --- */}
                    {activeTab === 'docs' && (
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-200/60 shadow-sm text-center min-h-[400px] flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="p-4 bg-slate-50 rounded-full mb-4">
                                <Shield size={32} className="text-slate-300"/>
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">Employee Documents</h3>
                            <p className="text-xs text-slate-500 mt-2 max-w-xs">Securely store ID proofs, contracts, and other confidential files here.</p>
                            <button className={`mt-6 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md ${t.primary}`}>
                                Upload New Document
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

// --- Helper Component for Circular Progress ---
const CircularProgress = ({ percentage, color, size, stroke }) => {
    const radius = (size - stroke) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    stroke="currentColor"
                    strokeWidth={stroke}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    className="text-white/20"
                />
                <circle
                    stroke="currentColor"
                    strokeWidth={stroke}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    className="text-white transition-all duration-1000 ease-out"
                />
            </svg>
            <span className="absolute text-[10px] font-bold text-white">{percentage}%</span>
        </div>
    );
};

export default Employee;