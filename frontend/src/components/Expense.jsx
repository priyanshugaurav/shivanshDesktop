import React, { useState } from 'react';
import { 
    DollarSign, TrendingDown, Calendar, Filter, Plus, 
    Download, PieChart, CreditCard, Receipt, Wallet, 
    ArrowUpRight, ArrowDownRight, Briefcase, Zap, User, CheckCircle2 ,
    Lock, ChevronDown, Activity, Clock
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';

const Expense = ({ theme: t }) => {
    // --- STATE: DATE SELECTION ---
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState({
        month: today.getMonth(), // 0-11
        year: today.getFullYear()
    });

    // Check if the selected view is the current month (to enable/disable Add)
    const isCurrentPeriod = selectedDate.month === today.getMonth() && selectedDate.year === today.getFullYear();

    const [viewMode, setViewMode] = useState('list'); // 'list' | 'add'
    
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
    
    const THEME_HEX = t.primary.includes('emerald') ? '#10b981' : 
                      t.primary.includes('blue') ? '#3b82f6' : 
                      t.primary.includes('rose') ? '#f43f5e' : '#64748b';

    const months = [
        "January", "February", "March", "April", "May", "June", 
        "July", "August", "September", "October", "November", "December"
    ];

    const years = [2024, 2025, 2026];

    const [expenses, setExpenses] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newExpense, setNewExpense] = useState({
        amount: '',
        category: 'Maintenance',
        description: ''
    });

    // --- DATA FETCHING ---
    const fetchExpenses = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const monthName = months[selectedDate.month];
            const res = await fetch(`/api/expenses?month=${monthName}&year=${selectedDate.year}`, {
                headers: { 'Authorization': token }
            });
            const data = await res.json();
            setExpenses(data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchExpenses();
    }, [selectedDate]);

    // --- ACTIONS ---
    const handleSaveExpense = async () => {
        if (!newExpense.amount || !newExpense.description) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': token 
                },
                body: JSON.stringify({
                    ...newExpense,
                    month: months[selectedDate.month],
                    year: selectedDate.year
                })
            });
            if (res.ok) {
                setNewExpense({ amount: '', category: 'Maintenance', description: '' });
                fetchExpenses();
            }
        } catch (error) {
            console.error('Error saving expense:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/expenses/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': token }
            });
            if (res.ok) fetchExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
        }
    };

    // --- ANALYTICS ---
    const totalSpend = Array.isArray(expenses) ? expenses.reduce((acc, curr) => acc + curr.amount, 0) : 0;
    const payrollTotal = Array.isArray(expenses) ? expenses.filter(e => e.type === 'Payroll').reduce((acc, curr) => acc + curr.amount, 0) : 0;
    
    // Daily average based on days passed or full month
    const daysInMonth = new Date(selectedDate.year, selectedDate.month + 1, 0).getDate();
    const daysToCount = isCurrentPeriod ? today.getDate() : daysInMonth;
    const dailyAvg = totalSpend / (daysToCount || 1);

    // Chart Data (Grouped by Week)
    const getChartData = () => {
        const weeks = [
            { name: 'Week 1', amount: 0 },
            { name: 'Week 2', amount: 0 },
            { name: 'Week 3', amount: 0 },
            { name: 'Week 4', amount: 0 }
        ];
        if (Array.isArray(expenses)) {
            expenses.forEach(exp => {
                const weekIdx = Math.min(Math.floor((exp.date - 1) / 7), 3);
                weeks[weekIdx].amount += exp.amount;
            });
        }
        return weeks;
    };
    const chartData = getChartData();

    // Category Splits for Progress Bars
    const getSplits = () => {
        if (!totalSpend || !Array.isArray(expenses)) return { payroll: 0, rent: 0, other: 0 };
        const rent = expenses.filter(e => e.category === 'Rent & Lease').reduce((acc, curr) => acc + curr.amount, 0);
        return {
            payroll: Math.round((payrollTotal / totalSpend) * 100),
            rent: Math.round((rent / totalSpend) * 100),
            other: Math.round(((totalSpend - payrollTotal - rent) / totalSpend) * 100)
        };
    };
    const splits = getSplits();

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans text-slate-800">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-2">
                        Expense Manager
                    </h1>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Clock size={12}/> Financial Overview</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className={t.text}>{isCurrentPeriod ? 'Live Tracking' : 'Historical Data'}</span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    {/* Month Selector */}
                    <div className="relative">
                        <select 
                            value={selectedDate.month}
                            onChange={(e) => setSelectedDate({...selectedDate, month: parseInt(e.target.value)})}
                            className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-100 shadow-sm cursor-pointer"
                        >
                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* Year Selector */}
                    <div className="relative">
                        <select 
                            value={selectedDate.year}
                            onChange={(e) => setSelectedDate({...selectedDate, year: parseInt(e.target.value)})}
                            className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-100 shadow-sm cursor-pointer"
                        >
                            {years.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                    </div>

                    {/* Add Button (Now always enabled) */}
                    <button 
                        onClick={() => {
                            const formElement = document.getElementById('expense-form');
                            if (formElement) {
                                formElement.scrollIntoView({ behavior: 'smooth' });
                                // Optional: focus first input
                                formElement.querySelector('input')?.focus();
                            }
                        }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold text-white shadow-lg transition-all ${t.primary} hover:shadow-xl hover:-translate-y-0.5`}
                    >
                        <Plus size={14} />
                        <span>Add Expense</span>
                    </button>
                </div>
            </div>

            {/* --- KPI CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Total Spend (Gradient) */}
                <div className={`p-6 rounded-[2rem] bg-gradient-to-br ${THEME_GRADIENT} text-white shadow-xl relative overflow-hidden flex flex-col justify-between`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3 opacity-90">
                            <Wallet size={18} />
                            <span className="text-xs font-bold uppercase tracking-widest">Total Spend</span>
                        </div>
                        <p className="text-4xl font-black">₹ {totalSpend.toLocaleString()}</p>
                        <p className="text-xs font-medium opacity-80 mt-2 flex items-center gap-1">
                            {months[selectedDate.month]} {selectedDate.year} Summary
                        </p>
                    </div>
                </div>

                {/* 2. Daily Average (Replaced Budget) */}
                <div className="p-6 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Average</p>
                            <p className="text-3xl font-black text-slate-800 mt-1">₹ {Math.round(dailyAvg).toLocaleString()}</p>
                        </div>
                        <div className={`p-2.5 rounded-xl ${t.light} ${t.text}`}>
                            <Activity size={20} />
                        </div>
                    </div>
                    
                    <div className="mt-4 flex items-end justify-between">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold mb-1">Burn Rate</span>
                            <div className="flex gap-1">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className={`w-1.5 h-3 rounded-sm ${i < 3 ? t.primary : 'bg-slate-100'}`}></div>
                                ))}
                            </div>
                        </div>
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Stable</span>
                    </div>
                </div>

                {/* 3. Auto Payroll (Dark) */}
                <div className="p-6 rounded-[2rem] bg-slate-900 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payroll (Auto)</p>
                            <p className="text-2xl font-black mt-1">₹ {payrollTotal.toLocaleString()}</p>
                        </div>
                        <div className="p-2.5 bg-white/10 rounded-xl text-emerald-400">
                            <Briefcase size={20} />
                        </div>
                    </div>
                    <div className="relative z-10 mt-3 pt-3 border-t border-white/10">
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                            <span>Status</span>
                            <span className="text-white font-bold flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-400"/> Calculated</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* --- LEFT: EXPENSE LIST --- */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Chart Section */}
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-sm font-bold text-slate-900">Expense Trend</h3>
                            <div className="flex gap-2">
                                <span className={`w-2 h-2 rounded-full ${t.primary}`}></span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Weekly Flow</span>
                            </div>
                        </div>
                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={THEME_HEX} stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor={THEME_HEX} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill:'#94a3b8', fontWeight: 600}} dy={10}/>
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill:'#94a3b8'}}/>
                                    <Tooltip contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)'}}/>
                                    <Area type="monotone" dataKey="amount" strokeWidth={3} stroke={THEME_HEX} fill="url(#colorExpense)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-900">Transaction History</h3>
                            <button className="text-[10px] font-bold text-slate-500 flex items-center gap-1 hover:text-slate-800 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <Download size={12}/> CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="py-4 px-6 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Details</th>
                                        <th className="py-4 px-6 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Category</th>
                                        <th className="py-4 px-6 text-[9px] font-bold uppercase text-slate-400 tracking-wider">Date</th>
                                        <th className="py-4 px-6 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-right">Amount</th>
                                        <th className="py-4 px-6 text-[9px] font-bold uppercase text-slate-400 tracking-wider text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-20 text-center opacity-30">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Receipt size={40} />
                                                    <p className="text-xs font-bold uppercase tracking-widest">No Expenses Recorded</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        expenses.map((exp, idx) => (
                                            <tr key={idx} className="group hover:bg-slate-50/40 transition-colors">
                                                <td className="py-4 px-6">
                                                    <p className="text-xs font-bold text-slate-900">{exp.description}</p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{exp.id}</p>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border ${
                                                        exp.category === 'Salary' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 
                                                        exp.category.includes('Rent') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-100'
                                                    }`}>
                                                        {exp.category === 'Salary' && <User size={10}/>}
                                                        {exp.category.includes('Rent') && <Briefcase size={10}/>}
                                                        {exp.category.includes('Utilities') && <Zap size={10}/>}
                                                        {exp.category}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-xs font-medium text-slate-500">
                                                    {exp.date} {months[selectedDate.month].substring(0,3)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className="text-xs font-black text-slate-800">₹{exp.amount.toLocaleString()}</span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    {exp.type === 'Manual' ? (
                                                        <button 
                                                            onClick={() => handleDeleteExpense(exp._id)}
                                                            className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                        >
                                                            <Activity size={14} className="rotate-45" /> {/* Using Activity as a placeholder for trash for variety */}
                                                        </button>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Locked</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: ADD EXPENSE & SUMMARY --- */}
                <div className="space-y-6">
                    
                    {/* Quick Add Form */}
                    <div id="expense-form" className={`bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm transition-opacity`}>
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                            <div className={`p-2 rounded-xl ${t.light} ${t.text}`}>
                                <Receipt size={18} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900">Record Expense</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Amount</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold group-focus-within:text-slate-800 transition-colors">₹</span>
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label>
                                <select 
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all cursor-pointer"
                                >
                                    <option>Salary</option>
                                    <option>Rent</option>
                                    <option>Electricity</option>
                                    <option>Water Bill</option>
                                    <option>Internet / Wi-Fi</option>
                                    <option>Fuel</option>
                                    <option>Vehicle Maintenance</option>
                                    <option>Insurance (Vehicle/Health)</option>
                                    <option>Spare Parts Purchase</option>
                                    <option>Workshop Tools & Equipment</option>
                                    <option>Employee Training</option>
                                    <option>Towing Charges</option>
                                    <option>Logistics / Transport</option>
                                    <option>Office Supplies</option>
                                    <option>Software Subscriptions (CRM, ERP)</option>
                                    <option>Marketing / Advertising</option>
                                    <option>Loan EMI</option>
                                    <option>Legal / Consultant Fees</option>
                                    <option>Government Fees / RTO Charges</option>
                                    <option>Courier / Delivery Charges</option>
                                    <option>Cleaning & Sanitation</option>
                                    <option>Event / Sponsorship</option>
                                    <option>Security Services</option>
                                    <option>Refreshments / Staff Welfare</option>
                                    <option>Office Event</option>
                                    <option>Miscellaneous</option>
                                    <option>Others</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Description</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Office Snacks"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all"
                                />
                            </div>

                            <button 
                                onClick={handleSaveExpense}
                                disabled={isLoading}
                                className={`w-full py-3.5 rounded-xl text-xs font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all uppercase tracking-wider mt-2 ${t.primary} ${isLoading ? 'opacity-50' : ''}`}
                            >
                                {isLoading ? 'Saving...' : 'Save Expense'}
                            </button>
                        </div>
                    </div>

                    {/* Breakdown Mini-Chart */}
                    <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                        <h3 className="text-sm font-bold mb-4 relative z-10 flex items-center gap-2">
                            <PieChart size={16} className="text-emerald-400" /> Category Split
                        </h3>
                        <div className="space-y-3 relative z-10">
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                    <span>Payroll</span>
                                    <span className="text-white">{splits.payroll}%</span>
                                </div>
                                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${splits.payroll}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                    <span>Rent</span>
                                    <span className="text-white">{splits.rent}%</span>
                                </div>
                                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${splits.rent}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                    <span>Ops</span>
                                    <span className="text-white">{splits.other}%</span>
                                </div>
                                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: `${splits.other}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Expense;