import React, { useState } from 'react';
import { 
    Search, Filter, Download, DollarSign, 
    User, AlertCircle, CheckCircle2, Clock, 
    X, Wallet, CreditCard, ChevronRight, Receipt, Calendar,
    Smartphone, Hash
} from 'lucide-react';

const Dues = ({ theme: t }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'payment'
    const [selectedDue, setSelectedDue] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');

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

    // --- MOCK DATA ---
    const [duesData, setDuesData] = useState([
        { 
            id: 'INV-001', customer: 'Rahul Verma', phone: '+91 98765 43210', 
            model: 'Rajhans Star', totalAmount: 124000, paidAmount: 80000, 
            lastPayment: 'Jan 10'
        },
        { 
            id: 'INV-004', customer: 'Md. Altaf', phone: '+91 99887 76655', 
            model: 'Rajhans Super', totalAmount: 135000, paidAmount: 100000, 
            lastPayment: 'Jan 15'
        },
        { 
            id: 'INV-007', customer: 'Sita Devi', phone: '+91 88776 65544', 
            model: 'Rajhans Yodha', totalAmount: 150000, paidAmount: 50000, 
            lastPayment: 'Jan 05'
        },
        { 
            id: 'INV-012', customer: 'Vikram Singh', phone: '+91 77665 54433', 
            model: 'Rajhans Plus', totalAmount: 145000, paidAmount: 140000, 
            lastPayment: 'Jan 18'
        },
        { 
            id: 'INV-015', customer: 'Arjun Kapur', phone: '+91 99112 23344', 
            model: 'Rajhans Star', totalAmount: 124000, paidAmount: 20000, 
            lastPayment: 'Dec 20'
        },
        { 
            id: 'INV-018', customer: 'Priya Sharma', phone: '+91 88990 01122', 
            model: 'Rajhans Super', totalAmount: 135000, paidAmount: 60000, 
            lastPayment: 'Jan 22'
        },
    ]);

    const [paymentHistory, setPaymentHistory] = useState([
        { id: 'TXN-101', customer: 'Rahul Verma', date: 'Jan 10, 2026', amount: 20000, method: 'Cash' },
        { id: 'TXN-102', customer: 'Md. Altaf', date: 'Jan 15, 2026', amount: 50000, method: 'UPI' },
        { id: 'TXN-103', customer: 'Sita Devi', date: 'Jan 05, 2026', amount: 10000, method: 'Cash' },
        { id: 'TXN-104', customer: 'Vikram Singh', date: 'Jan 18, 2026', amount: 5000, method: 'UPI' },
    ]);

    const kpiData = [
        { label: 'Total Receivables', value: '₹ 8.5 L', icon: Wallet, trend: '+5%', variant: 'primary', sub: 'Total Pending' },
        { label: 'Overdue Amount', value: '₹ 2.4 L', icon: AlertCircle, trend: '+12%', variant: 'dark', sub: 'Critical Dues' },
        { label: 'Collection Rate', value: '78%', icon: CheckCircle2, trend: '-2%', variant: 'light', sub: 'Efficiency' },
        { label: 'Active Debtors', value: '14', icon: User, trend: '0%', variant: 'light', sub: 'Customers' },
    ];

    // --- HANDLERS ---
    const handleOpenPayment = (due) => {
        setSelectedDue(due);
        setPaymentAmount('');
        setViewMode('payment');
    };

    const handleProcessPayment = () => {
        if (!paymentAmount || isNaN(paymentAmount) || Number(paymentAmount) <= 0) return;

        const amount = Number(paymentAmount);
        const newDuesData = duesData.map(item => {
            if (item.id === selectedDue.id) {
                return { ...item, paidAmount: item.paidAmount + amount };
            }
            return item;
        });

        const newTransaction = {
            id: `TXN-${Math.floor(Math.random() * 1000)}`,
            customer: selectedDue.customer,
            date: 'Just Now',
            amount: amount,
            method: 'Cash'
        };

        setDuesData(newDuesData);
        setPaymentHistory([newTransaction, ...paymentHistory]);
        setViewMode('list');
        setSelectedDue(null);
    };

    // --- RENDER ---
    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 font-sans text-slate-800">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-2">
                        Collections <span className="text-slate-300">/</span> Dues
                    </h1>
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1"><Clock size={12}/> Current Month</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className={t.text}>Live Updates</span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder="Find debtor..." 
                            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all shadow-sm w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all ${t.primary}`}>
                        <Filter size={14} /> Filter
                    </button>
                </div>
            </div>

            {/* --- KPI CARDS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiData.map((kpi, idx) => {
                    const isPrimary = kpi.variant === 'primary';
                    const isDark = kpi.variant === 'dark';
                    let cardClass = 'bg-white border-slate-200/60';
                    let textClass = 'text-slate-800';
                    let subClass = 'text-slate-400';
                    let iconBg = `${t.light} ${t.text}`;
                    
                    if (isPrimary) {
                        cardClass = `bg-gradient-to-br ${THEME_GRADIENT} text-white border-transparent`;
                        textClass = 'text-white';
                        subClass = 'text-white/70';
                        iconBg = 'bg-white/20 text-white backdrop-blur-md';
                    } else if (isDark) {
                        cardClass = 'bg-slate-900 text-white border-slate-800';
                        textClass = 'text-white';
                        subClass = 'text-slate-400';
                        iconBg = 'bg-slate-800 text-slate-200';
                    }

                    return (
                        <div key={idx} className={`${cardClass} p-5 rounded-[1.5rem] shadow-sm border relative overflow-hidden group hover:scale-[1.02] transition-all`}>
                            {(isPrimary || isDark) && <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>}
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className={`p-2.5 rounded-xl ${iconBg} shadow-sm`}><kpi.icon size={18} /></div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm ${isPrimary || isDark ? 'bg-white/10 text-white' : 'bg-emerald-50 text-emerald-600'}`}>{kpi.trend}</span>
                            </div>
                            <div className="relative z-10">
                                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${subClass}`}>{kpi.label}</p>
                                <p className={`text-2xl font-black tracking-tight ${textClass}`}>{kpi.value}</p>
                                <p className={`text-[9px] font-medium mt-1 ${subClass}`}>{kpi.sub}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* --- LEFT: NEW TABLE DESIGN --- */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Pending Dues</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Customers with outstanding balance</p>
                            </div>
                            <button className="text-[10px] font-bold text-slate-500 flex items-center gap-1 hover:text-slate-800 transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <Download size={12}/> Export
                            </button>
                        </div>
                        
                        {/* Custom "Floating" Rows Table Layout */}
                        <div className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                            {/* Table Header (Visual only) */}
                            <div className="grid grid-cols-12 px-4 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                <div className="col-span-4">Customer</div>
                                <div className="col-span-3 text-right">Payment Progress</div>
                                <div className="col-span-3 text-right">Balance Due</div>
                                <div className="col-span-2 text-center">Action</div>
                            </div>

                            {duesData.filter(d => d.customer.toLowerCase().includes(searchTerm.toLowerCase())).map((due, idx) => {
                                const balance = due.totalAmount - due.paidAmount;
                                const isCleared = balance <= 0;
                                const progress = (due.paidAmount / due.totalAmount) * 100;

                                return (
                                    <div key={due.id} className="grid grid-cols-12 items-center p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all group">
                                        
                                        {/* 1. Customer Info */}
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-sm ${['bg-indigo-500','bg-rose-500','bg-amber-500','bg-emerald-500'][idx%4]}`}>
                                                {due.customer.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{due.customer}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="flex items-center gap-1 text-[9px] text-slate-400"><Smartphone size={9}/> {due.phone}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Progress Bar (Total vs Paid) */}
                                        <div className="col-span-3 flex flex-col justify-center px-4">
                                            <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
                                                <span>₹{(due.paidAmount/1000).toFixed(1)}k Paid</span>
                                                <span className="text-slate-300">/ ₹{(due.totalAmount/1000).toFixed(1)}k</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${t.primary}`} style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </div>

                                        {/* 3. Balance (Hero Metric) */}
                                        <div className="col-span-3 text-right pr-4">
                                            {isCleared ? (
                                                <span className="text-xs font-bold text-emerald-500 flex items-center justify-end gap-1"><CheckCircle2 size={12}/> Fully Paid</span>
                                            ) : (
                                                <div>
                                                    <p className="text-sm font-black text-slate-800">₹{balance.toLocaleString()}</p>
                                                    <p className="text-[9px] font-bold text-rose-500">Overdue</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* 4. Action */}
                                        <div className="col-span-2 flex justify-center">
                                            {!isCleared && (
                                                <button 
                                                    onClick={() => handleOpenPayment(due)}
                                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold text-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all ${t.primary}`}
                                                >
                                                    Collect
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: HISTORY (Expanded) --- */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col h-full min-h-[600px]">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-900">Recent Collections</h3>
                                <p className="text-[10px] text-slate-500 mt-0.5">Live transaction history</p>
                            </div>
                            <div className={`p-2 rounded-xl ${t.light} ${t.text}`}>
                                <Receipt size={16} />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                            {paymentHistory.map((txn, idx) => (
                                <div key={idx} className="relative pl-4 border-l-2 border-slate-100 pb-2 last:pb-0">
                                    <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-white ${t.primary}`}></div>
                                    <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/30 flex items-center justify-between group hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                                        <div>
                                            <p className="text-[11px] font-bold text-slate-800">{txn.customer}</p>
                                            <p className="text-[9px] text-slate-400 mt-0.5">{txn.date} • <span className="uppercase font-bold text-slate-500">{txn.method}</span></p>
                                        </div>
                                        <span className="text-xs font-black text-emerald-600 font-mono">+₹{txn.amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-4 py-3 rounded-xl border border-dashed border-slate-300 text-[10px] font-bold text-slate-500 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-700 transition-all">
                            View All Transactions
                        </button>
                    </div>
                </div>
            </div>

            {/* --- NEW PAYMENT MODAL --- */}
            {viewMode === 'payment' && selectedDue && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Clean Header */}
                        <div className="px-6 pt-6 pb-4 flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Record Payment</h3>
                                <p className="text-xs text-slate-500 mt-1">Add transaction for <span className="font-bold text-slate-800">{selectedDue.customer}</span></p>
                            </div>
                            <button onClick={() => setViewMode('list')} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-6 pb-8 space-y-6">
                            {/* Balance Card */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Current Balance</p>
                                    <p className="text-lg font-black text-rose-600">₹ {(selectedDue.totalAmount - selectedDue.paidAmount).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Invoice</p>
                                    <p className="text-xs font-bold text-slate-700">{selectedDue.id}</p>
                                </div>
                            </div>

                            {/* Input Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Amount Received</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg group-focus-within:text-slate-800 transition-colors">₹</span>
                                        <input 
                                            type="number" 
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(e.target.value)}
                                            className="w-full pl-8 pr-4 py-3.5 bg-white border-2 border-slate-100 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:border-slate-300 transition-all shadow-sm"
                                            placeholder="0"
                                            autoFocus
                                        />
                                    </div>
                                    {/* Quick Amount Pills */}
                                    <div className="flex gap-2 mt-2">
                                        <button 
                                            onClick={() => setPaymentAmount(selectedDue.totalAmount - selectedDue.paidAmount)} 
                                            className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                                        >
                                            Full Due
                                        </button>
                                        <button 
                                            onClick={() => setPaymentAmount((selectedDue.totalAmount - selectedDue.paidAmount) / 2)} 
                                            className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                                        >
                                            50%
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Payment Mode</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['Cash', 'UPI', 'Cheque'].map(method => (
                                            <button key={method} className="py-2.5 rounded-xl border-2 border-slate-100 text-[10px] font-bold text-slate-600 hover:border-slate-300 hover:bg-slate-50 focus:border-slate-900 focus:text-slate-900 transition-all">
                                                {method}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleProcessPayment}
                                className={`w-full py-3.5 rounded-xl text-xs font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all uppercase tracking-widest ${t.primary}`}
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Dues;