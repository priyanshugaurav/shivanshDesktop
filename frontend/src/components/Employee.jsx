import React, { useState, useEffect } from 'react';
import { 
    Users, Search, Filter, Plus, ChevronRight, Mail, Phone, 
    MapPin, Calendar, DollarSign, TrendingUp, Award, Clock, 
    CheckCircle2, XCircle, AlertCircle, FileText, Download,
    Briefcase, CreditCard, ChevronLeft, MoreHorizontal, UserCheck,
    Smartphone, Shield, Building2, Wallet, Target, Zap, UserPlus,
    LayoutGrid, PieChart as PieIcon, Activity, CalendarClock,
    LogIn, LogOut, Timer, History
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';

const Employee = ({ theme: t }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail' | 'add'
    const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'sales', 'payroll', 'attendance', 'salary_history', 'docs'
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [selectedEmp, setSelectedEmp] = useState(null);
    
    // New Salary/Payroll States
    const [selectedMonth, setSelectedMonth] = useState(new Date().toLocaleString('en-US', { month: 'long' }));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [otherAmount, setOtherAmount] = useState(0);
    const [payRemark, setPayRemark] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [staffSales, setStaffSales] = useState([]);
    const [isLoadingSales, setIsLoadingSales] = useState(false);

    // Custom Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteConfig, setDeleteConfig] = useState({ id: null, type: '', name: '', recordId: null });
    const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

    const [newEmp, setNewEmp] = useState({
        personal: { firstName: '', lastName: '', phone: '', email: '', dob: '', bloodGroup: '', address: '' },
        professional: { role: 'DSE', status: 'Active', location: 'Showroom', joinDate: new Date().toISOString().split('T')[0] },
        financial: { baseSalary: 0, allowance: 0, incentives: 0, tax: 0 }
    });


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
    // --- DATA FETCHING ---
    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/employees', {
                headers: { 'Authorization': localStorage.getItem('token') }
            });
            const data = await res.json();
            setEmployees(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching employees:', error);
            setLoading(false);
        }
    };

    const fetchSalaryHistory = async (empId) => {
        try {
            const res = await fetch(`/api/employees/${empId}/payroll`, {
                headers: { 'Authorization': localStorage.getItem('token') }
            });
            const data = await res.json();
            setSalaryHistory(data);
        } catch (error) {
            console.error('Error fetching salary history:', error);
        }
    };

    const fetchStaffSales = async (firstName, lastName) => {
        setIsLoadingSales(true);
        try {
            const fullName = `${firstName} ${lastName}`;
            const res = await fetch(`/api/agreements/staff/${fullName}`, {
                headers: { 'Authorization': localStorage.getItem('token') }
            });
            const data = await res.json();
            setStaffSales(data);
        } catch (error) {
            console.error('Error fetching staff sales:', error);
        } finally {
            setIsLoadingSales(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (selectedEmp) {
            if (activeTab === 'salary_history') fetchSalaryHistory(selectedEmp._id);
            if (activeTab === 'dashboard' || activeTab === 'sales') {
                fetchStaffSales(selectedEmp.personal.firstName, selectedEmp.personal.lastName);
            }
        }
    }, [selectedEmp, activeTab]);

    const totalSalary = employees.reduce((acc, curr) => acc + (curr.financial?.baseSalary || 0) + (curr.financial?.allowance || 0), 0);
    const activeCount = employees.filter(e => e.professional?.status === 'Active').length;
    const probationCount = employees.filter(e => e.professional?.status === 'Probation').length;
    const salesCount = employees.filter(e => e.professional?.role === 'DSE').length;
    const serviceCount = employees.filter(e => e.professional?.role === 'Mechanic' || e.professional?.role === 'Helper').length;
    const othersCount = employees.length - (salesCount + serviceCount);

    // --- SALES CALCULATIONS ---
    const getMonthlySalesData = () => {
        if (!staffSales.length) return { count: 0, commission: 0 };
        const filtered = staffSales.filter(sale => {
            const saleDate = new Date(sale.payment?.date || sale.createdAt);
            const m = saleDate.toLocaleString('en-US', { month: 'long' });
            const y = saleDate.getFullYear();
            return m === selectedMonth && y === selectedYear;
        });
        const commLine = filtered.reduce((acc, curr) => acc + (parseFloat(curr.dse?.dseCommission) || 0), 0);
        return { count: filtered.length, commission: commLine };
    };
    const monthlySales = getMonthlySalesData();

    // --- PERFORMANCE ANALYTICS (REAL DATA) ---
    const getYTDSalesData = () => {
        const currentYear = new Date().getFullYear();
        const ytdSales = staffSales.filter(sale => {
            const saleDate = new Date(sale.payment?.date || sale.createdAt);
            return saleDate.getFullYear() === currentYear;
        });
        const totalComm = ytdSales.reduce((acc, curr) => acc + (parseFloat(curr.dse?.dseCommission) || 0), 0);
        return { count: ytdSales.length, commission: totalComm };
    };
    const ytdSales = getYTDSalesData();

    const getRealPerformanceData = () => {
        const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mName = monthsShort[d.getMonth()];
            const year = d.getFullYear();
            
            const monthSales = staffSales.filter(sale => {
                const sDate = new Date(sale.payment?.date || sale.createdAt);
                return sDate.getMonth() === d.getMonth() && sDate.getFullYear() === year;
            });
            
            const revenue = monthSales.reduce((acc, curr) => acc + (parseFloat(curr.dse?.dseCommission) || 0), 0) / 100000; // In Lakhs
            data.push({ 
                month: mName, 
                sales: monthSales.length, 
                revenue: parseFloat(revenue.toFixed(2)) 
            });
        }
        return data;
    };
    const realPerformanceData = getRealPerformanceData();

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

    const handleDeleteEmployee = () => {
        setDeleteConfig({ 
            id: selectedEmp._id, 
            type: 'employee', 
            name: `${selectedEmp.personal.firstName} ${selectedEmp.personal.lastName}` 
        });
        setDeleteConfirmInput('');
        setIsDeleteModalOpen(true);
    };

    const handleDeletePayroll = (recordId) => {
        const record = salaryHistory.find(r => r.id === recordId || r._id === recordId);
        setDeleteConfig({ 
            id: selectedEmp._id, 
            type: 'payroll', 
            name: `${record?.month} ${record?.year} Salary`,
            recordId: recordId
        });
        setDeleteConfirmInput('');
        setIsDeleteModalOpen(true);
    };

    const executeDeletion = async () => {
        if (deleteConfirmInput !== 'okay') return;

        try {
            if (deleteConfig.type === 'employee') {
                const res = await fetch(`/api/employees/${deleteConfig.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': localStorage.getItem('token') }
                });
                if (res.ok) {
                    setSelectedEmp(null);
                    setViewMode('list');
                    fetchEmployees();
                }
            } else if (deleteConfig.type === 'payroll') {
                const res = await fetch(`/api/employees/${deleteConfig.id}/payroll/${deleteConfig.recordId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': localStorage.getItem('token') }
                });
                if (res.ok) {
                    fetchSalaryHistory(deleteConfig.id);
                }
            }
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Error executing deletion:', error);
        }
    };

    const handleEditProfile = () => {
        setNewEmp({
            personal: { ...selectedEmp.personal },
            professional: { ...selectedEmp.professional },
            financial: { ...selectedEmp.financial }
        });
        setViewMode('add'); // Reusing the add screen for editing
    };

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

    const handleSaveEmployee = async () => {
        try {
            const res = await fetch(`/api/employees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify(newEmp)
            });
            if (res.ok) {
                const savedEmp = await res.json();
                setEmployees([savedEmp, ...employees]);
                setViewMode('list');
                setNewEmp({
                    personal: { firstName: '', lastName: '', phone: '', email: '', dob: '', bloodGroup: '', address: '' },
                    professional: { role: 'DSE', status: 'Active', location: 'Showroom', joinDate: new Date().toISOString().split('T')[0] },
                    financial: { baseSalary: 0, allowance: 0, incentives: 0, tax: 0 }
                });
            }
        } catch (error) {
            console.error('Error saving employee:', error);
        }
    };

    const handleProcessPayroll = async () => {
        if (!selectedEmp) return;
        setIsProcessing(true);
        try {
            const totalIncentives = (selectedEmp.financial.incentives || 0) + monthlySales.commission;
            const totalPayable = selectedEmp.financial.baseSalary + selectedEmp.financial.allowance + totalIncentives - selectedEmp.financial.tax + Number(otherAmount);
            const res = await fetch(`/api/employees/${selectedEmp._id}/payroll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify({
                    month: selectedMonth,
                    year: selectedYear,
                    baseSalary: selectedEmp.financial.baseSalary,
                    allowance: selectedEmp.financial.allowance,
                    incentives: totalIncentives,
                    tax: selectedEmp.financial.tax,
                    otherAmount: Number(otherAmount),
                    remark: payRemark,
                    totalPayable
                })
            });
            
            const data = await res.json();
            if (res.ok) {
                setShowSuccess(true);
                setOtherAmount(0);
                setPayRemark('');
                
                // Navigate to history after animation
                setTimeout(() => {
                    setShowSuccess(false);
                    setActiveTab('salary_history');
                }, 2500);
            } else {
                alert(data.message || 'Error processing payroll');
            }
        } catch (error) {
            console.error('Error processing payroll:', error);
            alert('Failed to process payroll');
        } finally {
            setIsProcessing(false);
        }
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
                            <p className="text-4xl font-black">{employees.length} <span className="text-lg font-medium opacity-70">Employees</span></p>
                            <div className="flex gap-3 mt-4">
                                <span className="bg-white/20 px-3 py-1 rounded-xl text-[10px] font-bold backdrop-blur-sm flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> {activeCount} Active
                                </span>
                                <span className="bg-white/20 px-3 py-1 rounded-xl text-[10px] font-bold backdrop-blur-sm">{employees.length - activeCount} Other</span>
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
                                    <span>Sales (DSE)</span> <span>{salesCount}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full ${t.primary} transition-all duration-1000`} style={{ width: `${(salesCount / (employees.length || 1)) * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-slate-600 mb-1">
                                    <span>Service & Ops</span> <span>{serviceCount}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${(serviceCount / (employees.length || 1)) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 3. Payroll Pulse */}
                    <div className="flex flex-col gap-4">
                        <div className="flex-1 p-5 rounded-[1.5rem] bg-slate-900 text-white shadow-lg relative overflow-hidden flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payroll Est.</p>
                                <p className="text-xl font-black mt-0.5">₹ {(totalSalary / 100000).toFixed(2)} L</p>
                            </div>
                            <div className="p-2.5 bg-white/10 rounded-full backdrop-blur-md">
                                <DollarSign size={18} className="text-emerald-400"/>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-5 rounded-[1.5rem] bg-white border border-slate-200/60 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Probation</p>
                                <p className="text-xl font-black text-slate-900 mt-0.5">{probationCount} <span className="text-xs text-slate-400 font-medium">New</span></p>
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
                        <button 
                            onClick={() => setViewMode('add')}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ${t.primary}`}
                        >
                            <Plus size={14} /> Add Employee
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
                            {employees.map((emp, idx) => (
                                <tr 
                                    key={emp._id} 
                                    onClick={() => handleViewDetail(emp)}
                                    className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                                >
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white shadow-md group-hover:scale-105 transition-transform ${
                                                ['bg-indigo-500', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500'][idx % 4]
                                            }`}>
                                                {emp.personal.firstName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {emp.personal.firstName} {emp.personal.lastName}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">{emp.professional.employeeId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="text-xs font-bold text-slate-700">{emp.professional.role}</p>
                                        <div className="flex items-center gap-1.5 mt-1.5">
                                            <span className={`w-2 h-2 rounded-full ${emp.professional.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                                            <span className={`text-[10px] font-bold uppercase ${emp.professional.status === 'Active' ? 'text-emerald-600' : 'text-amber-600'}`}>{emp.professional.status}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors">
                                                <Mail size={12} className="text-slate-300"/> {emp.personal.email || 'N/A'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition-colors">
                                                <Phone size={12} className="text-slate-300"/> {emp.personal.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <p className="text-sm font-black text-slate-900">₹{(emp.financial.baseSalary + emp.financial.allowance + (emp.financial.incentives || 0)).toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md inline-block mt-1">
                                            Tax: ₹{emp.financial.tax}
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

    if (viewMode === 'add') {
        return (
            <AddEmployeeScreen
                theme={t}
                newEmp={newEmp}
                setNewEmp={setNewEmp}
                onSave={selectedEmp ? handleUpdateEmployee : handleSaveEmployee}
                onClose={() => setViewMode(selectedEmp ? 'detail' : 'list')}
                isEditing={!!selectedEmp}
            />
        );
    }

    // --- 2. VIEW: EMPLOYEE DETAILS ---
    const handleUpdateEmployee = async () => {
        try {
            const res = await fetch(`/api/employees/${selectedEmp._id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify(newEmp)
            });
            if (res.ok) {
                const updated = await res.json();
                setSelectedEmp(updated);
                setViewMode('detail');
                fetchEmployees();
            }
        } catch (error) {
            console.error('Error updating employee:', error);
        }
    };

    return (
        <div className={`min-h-screen ${t.bg} p-4 sm:p-8 font-sans selection:bg-indigo-100 selection:text-indigo-900`}>
            {/* Custom Delete Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsDeleteModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-6 rotate-12">
                                <AlertCircle size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Are you sure?</h3>
                            <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed px-4">
                                You are about to permanently delete <span className="text-slate-900 font-bold underline decoration-rose-200">{deleteConfig.name}</span>. This action cannot be undone.
                            </p>
                            
                            <div className="relative mb-6">
                                <input 
                                    type="text" 
                                    placeholder='Type "okay" to confirm'
                                    value={deleteConfirmInput}
                                    onChange={(e) => setDeleteConfirmInput(e.target.value.toLowerCase())}
                                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-rose-200 focus:bg-white transition-all text-center font-bold text-slate-900 placeholder:text-slate-300 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-6 py-4 rounded-2xl text-[11px] font-black text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all uppercase tracking-widest"
                                >
                                    No, Keep it
                                </button>
                                <button 
                                    onClick={executeDeletion}
                                    disabled={deleteConfirmInput !== 'okay'}
                                    className={`px-6 py-4 rounded-2xl text-[11px] font-black text-white shadow-xl transition-all uppercase tracking-widest ${deleteConfirmInput === 'okay' ? 'bg-rose-500 shadow-rose-200 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0' : 'bg-slate-200 cursor-not-allowed grayscale'}`}
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
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
                    <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                        {selectedEmp.personal.firstName} {selectedEmp.personal.lastName}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{selectedEmp.professional.role}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-[10px] font-medium text-slate-400">{selectedEmp.professional.location}</span>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    <button 
                        onClick={handleDeleteEmployee}
                        className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all border border-transparent hover:border-rose-100"
                    >
                        <XCircle size={18} />
                    </button>
                    <button 
                        onClick={handleEditProfile}
                        className={`px-5 py-2 rounded-xl text-[11px] font-bold text-white shadow-md hover:shadow-lg transition-all ${t.primary}`}
                    >
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
                                    {selectedEmp.personal.firstName.substring(0, 2).toUpperCase()}
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mt-4">{selectedEmp.personal.firstName} {selectedEmp.personal.lastName}</h2>
                            <p className="text-xs font-medium text-slate-500 mb-6">{selectedEmp.professional.employeeId}</p>
                            
                            <div className="grid grid-cols-2 gap-3 text-left mb-6">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Join Date</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400"/>
                                        <span className="text-xs font-bold text-slate-700">
                                            {new Date(selectedEmp.professional.joinDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rating</p>
                                    <div className="flex items-center gap-2">
                                        <Award size={14} className="text-amber-500"/>
                                        <span className="text-xs font-bold text-slate-700">{selectedEmp.rating || '4.5'} / 5.0</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex flex-col gap-3 mt-auto">
                                <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                                    <div className="p-2 bg-slate-100 rounded-lg"><Mail size={14}/></div>
                                    {selectedEmp.personal.email || 'N/A'}
                                </div>
                                <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                                    <div className="p-2 bg-slate-100 rounded-lg"><Phone size={14}/></div>
                                    {selectedEmp.personal.phone}
                                </div>
                                <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
                                    <div className="p-2 bg-slate-100 rounded-lg"><MapPin size={14}/></div>
                                    {selectedEmp.professional.location}
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
                            { id: 'salary_history', label: 'History', icon: History },
                            { id: 'attendance', label: 'Attendance', icon: Clock },
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
                                        <AreaChart data={realPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                        <p className="text-3xl font-black text-indigo-900">{ytdSales.count}<span className="text-lg text-indigo-400">/15</span></p>
                                        <p className="text-[10px] font-bold text-indigo-600">Total Vehicles Sold</p>
                                    </div>
                                </div>

                                {/* 3. Earnings */}
                                <div className="bg-emerald-50/50 p-5 rounded-[2rem] border border-emerald-100 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-white rounded-xl text-emerald-600 shadow-sm"><Wallet size={18}/></div>
                                        <span className="text-[9px] font-bold text-emerald-400">Comm.</span>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-emerald-900">₹ {ytdSales.commission.toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-emerald-600">Total YTD Commission</p>
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
                                        {staffSales.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="py-20 text-center opacity-30">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <FileText size={40} />
                                                        <p className="text-xs font-bold uppercase tracking-widest">No Sales Found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            staffSales.map((sale, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <p className="text-xs font-bold text-slate-700 font-mono">#{sale.agreementId}</p>
                                                        <p className="text-[10px] text-slate-400 mt-0.5">{new Date(sale.payment?.date || sale.createdAt).toLocaleDateString()}</p>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <p className="text-xs font-bold text-slate-900">{sale.model?.name || 'Unit Sale'}</p>
                                                        <p className="text-[10px] text-slate-500">Cust: {sale.customerId?.personal?.firstName} {sale.customerId?.personal?.lastName}</p>
                                                    </td>
                                                    <td className="py-4 px-6 text-xs font-bold text-slate-600 text-right">₹{sale.model?.onRoadPrice || '0'}</td>
                                                    <td className="py-4 px-6 text-right">
                                                        <p className="text-xs font-black text-emerald-600">₹{sale.dse?.dseCommission || '0'}</p>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                                                            'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                        }`}>
                                                            <CheckCircle2 size={10}/> Paid
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: PAYROLL --- */}
                    {activeTab === 'payroll' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            
                            {/* Date Selector for Payroll */}
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-3 rounded-2xl ${t.primary} text-white shadow-lg`}>
                                        <Calendar size={20}/>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900">Period Selection</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Select month to process</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <select 
                                        value={selectedMonth} 
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-100"
                                    >
                                        {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <select 
                                        value={selectedYear} 
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-100"
                                    >
                                        {[2024, 2025, 2026].map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Digital Salary Slip */}
                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-8">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Payable ({selectedMonth})</p>
                                            <h2 className="text-5xl font-black tracking-tight">₹ {(selectedEmp.financial.baseSalary + selectedEmp.financial.allowance + (selectedEmp.financial.incentives || 0) + monthlySales.commission - selectedEmp.financial.tax + Number(otherAmount)).toLocaleString()}</h2>
                                        </div>
                                        <div className="text-right">
                                            <div className="inline-block p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                                                <Building2 size={24} className="text-emerald-400"/>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-6 p-6 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-sm">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Base Salary</p>
                                            <p className="text-lg font-bold">₹ {selectedEmp.financial.baseSalary}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Allowances</p>
                                            <p className="text-lg font-bold">₹ {selectedEmp.financial.allowance}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Sales Comm.</p>
                                            <p className="text-lg font-bold text-emerald-400">+ ₹ {monthlySales.commission}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Incentives</p>
                                            <p className="text-lg font-bold text-emerald-400">+ ₹ {selectedEmp.financial.incentives || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Tax / TDS</p>
                                            <p className="text-lg font-bold text-rose-400">- ₹ {selectedEmp.financial.tax}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex gap-4">
                                        <button 
                                            onClick={handleProcessPayroll}
                                            disabled={isProcessing}
                                            className="flex-1 py-3 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors shadow-lg flex items-center justify-center gap-2"
                                        >
                                            {isProcessing ? <Zap size={14} className="animate-spin" /> : <CreditCard size={14}/>} 
                                            {isProcessing ? 'Processing...' : 'Process Payment'}
                                        </button>
                                        <button className="px-6 py-3 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition-colors border border-white/10 flex items-center gap-2">
                                            <Download size={14}/> Slip
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Adjustment Manager */}
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-sm">
                                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Zap size={14} className="text-amber-500 fill-current"/> Add Bonus / Deduction
                                </h3>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                                        <input 
                                            type="number" 
                                            value={otherAmount}
                                            onChange={(e) => setOtherAmount(e.target.value)}
                                            placeholder="Amount" 
                                            className="w-full pl-8 pr-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-100 outline-none"
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={payRemark}
                                        onChange={(e) => setPayRemark(e.target.value)}
                                        placeholder="Reason (e.g. Festival Bonus)" 
                                        className="flex-[2] px-4 py-3 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-100 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: SALARY HISTORY --- */}
                    {activeTab === 'salary_history' && (
                        <div className="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
                             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Payment Ledger</h3>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Summary of all historical payments</p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="py-3 px-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment ID</th>
                                            <th className="py-3 px-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Month/Year</th>
                                            <th className="py-3 px-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">Net Amount</th>
                                            <th className="py-3 px-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                                            <th className="py-3 px-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-right">Date</th>
                                            <th className="py-3 px-6 text-[9px] font-bold text-slate-400 uppercase tracking-wider text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {salaryHistory.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-20 text-center">
                                                    <div className="flex flex-col items-center gap-2 opacity-30">
                                                        <History size={40} />
                                                        <p className="text-xs font-bold uppercase tracking-[0.2em]">No history found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            salaryHistory.map((rec, idx) => (
                                                <tr key={rec._id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-4 px-6">
                                                        <p className="text-xs font-bold text-slate-700 font-mono">#{rec._id.substring(rec._id.length-6).toUpperCase()}</p>
                                                        {rec.remark && <p className="text-[9px] text-indigo-500 font-black uppercase mt-1">Note: {rec.remark}</p>}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <p className="text-xs font-bold text-slate-900">{rec.month} {rec.year}</p>
                                                        {rec.otherAmount !== 0 && (
                                                            <p className={`text-[9px] font-bold mt-1 ${rec.otherAmount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {rec.otherAmount > 0 ? '+' : ''}₹{rec.otherAmount} Adjustment
                                                            </p>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-6 text-xs font-black text-slate-700 text-right">₹{rec.totalPayable.toLocaleString()}</td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                            <CheckCircle2 size={10}/> Paid
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right">
                                                        <p className="text-[10px] font-bold text-slate-400">{new Date(rec.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <button 
                                                            onClick={() => handleDeletePayroll(rec._id)}
                                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                        >
                                                            <XCircle size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
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

            {/* Success Animation Overlay (Global for Detail View) */}
            {showSuccess && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] p-12 text-center shadow-2xl max-w-sm w-full animate-in zoom-in-95 curve-spring duration-700">
                        <div className="relative mb-10">
                            <div className={`h-28 w-28 mx-auto rounded-full ${t.primary} flex items-center justify-center text-white shadow-2xl animate-bounce-subtle`}>
                                <CheckCircle2 size={56} className="animate-pulse" />
                            </div>
                            {/* Decorative Sparkles */}
                            <div className="absolute -top-4 -right-4 h-8 w-8 bg-amber-400 rounded-full blur-xl opacity-40 animate-ping"></div>
                            <div className="absolute -bottom-4 -left-4 h-10 w-10 bg-indigo-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-3 leading-none">Payroll Processed</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">Generated Successfully</p>
                        <div className="h-1.5 w-48 mx-auto bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${t.primary} animate-progress-loading`}></div>
                        </div>
                        <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Redirecting to History...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

const EmployeeInput = ({ label, name, value, onChange, placeholder, type = "text", prefix }) => (
    <div className="space-y-1.5 group">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
            {prefix && <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-300">{prefix}</span>}
            <input 
                name={name}
                value={value} 
                onChange={onChange} 
                type={type}
                placeholder={placeholder} 
                className={`w-full ${prefix ? 'pl-8' : 'px-4'} py-3 bg-slate-50 border border-transparent rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 outline-none transition-all`} 
            />
        </div>
    </div>
);

// --- Add Employee Screen Component (Full-page redesigned) ---
const AddEmployeeScreen = ({ theme: t, newEmp, setNewEmp, onSave, onClose, isEditing }) => {
    const handlePersonalChange = (e) => {
        const { name, value } = e.target;
        setNewEmp(prev => ({ ...prev, personal: { ...prev.personal, [name]: value } }));
    };

    const handleProfessionalChange = (e) => {
        const { name, value } = e.target;
        setNewEmp(prev => ({ ...prev, professional: { ...prev.professional, [name]: value } }));
    };

    const handleFinancialChange = (e) => {
        const { name, value } = e.target;
        setNewEmp(prev => ({ ...prev, financial: { ...prev.financial, [name]: Number(value) } }));
    };

    const THEME_ACCENT = t.primary.includes('emerald') ? 'bg-emerald-500' : 
                         t.primary.includes('blue') ? 'bg-blue-500' : 
                         t.primary.includes('rose') ? 'bg-rose-500' : 'bg-slate-700';

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full bg-slate-50/20">
            {/* 1. TOP ACTION BAR */}
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        {isEditing ? 'Edit Employee Profile' : 'Register New Staff'}
                    </h1>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                        {isEditing ? 'Update personnel and financial information' : 'Onboard a new member to your dealership workforce'}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={onClose}
                        className="group flex items-center gap-3 text-[11px] font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest"
                    >
                        <div className="p-2 rounded-xl bg-white border border-slate-200 group-hover:bg-slate-50 transition-all shrink-0 shadow-sm">
                            <ChevronLeft size={16} />
                        </div>
                        <span>Cancel & Exit</span>
                    </button>
                    <button 
                        onClick={onSave}
                        className={`px-8 py-3 rounded-2xl text-xs font-bold text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all uppercase tracking-widest ${t.primary}`}
                    >
                        {isEditing ? 'Update Profile' : 'Complete Registration'}
                    </button>
                </div>
            </div>

            {/* 2. MAIN SPLIT CONTAINER */}
            <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-[0_12px_44px_-16px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col md:flex-row items-stretch min-h-[600px]">
                
                {/* LEFT SIDEBAR */}
                <div className={`w-full md:w-[320px] ${THEME_ACCENT} relative p-10 flex flex-col shrink-0 overflow-hidden`}>
                    {/* Pattern Background */}
                    <div className="absolute inset-0 opacity-[0.08] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                    
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="mb-10">
                            <div className="h-14 w-14 bg-white/20 backdrop-blur-xl rounded-[1.25rem] flex items-center justify-center border border-white/30 shadow-2xl mb-6">
                                <Users size={28} className="text-white" />
                            </div>
                            <h1 className="text-3xl font-black text-white tracking-tighter mb-2 leading-tight">Staff Onboarding</h1>
                            <p className="text-white/70 text-[10px] font-black leading-relaxed uppercase tracking-widest">Employee Registry v4.0</p>
                        </div>

                        {/* Visual Steps */}
                        <div className="space-y-8 mt-4">
                            <div className="flex items-center gap-4 group">
                                <div className="h-8 w-8 rounded-full bg-white text-emerald-600 flex items-center justify-center font-black text-xs shadow-lg">1</div>
                                <span className="text-white text-xs font-black uppercase tracking-widest">Identity</span>
                            </div>
                            <div className="flex items-center gap-4 group opacity-50">
                                <div className="h-8 w-8 rounded-full border-2 border-white/40 text-white flex items-center justify-center font-black text-xs">2</div>
                                <span className="text-white text-xs font-black uppercase tracking-widest">Work Role</span>
                            </div>
                            <div className="flex items-center gap-4 group opacity-50">
                                <div className="h-8 w-8 rounded-full border-2 border-white/40 text-white flex items-center justify-center font-black text-xs">3</div>
                                <span className="text-white text-xs font-black uppercase tracking-widest">Salary Basis</span>
                            </div>
                        </div>

                        <div className="mt-auto pt-10">
                            <div className="p-5 bg-white/10 backdrop-blur-md rounded-[1.5rem] border border-white/10 shadow-inner">
                                <p className="text-[9px] text-white/40 font-black uppercase tracking-widest mb-2">Note</p>
                                <p className="text-[11px] text-white font-bold leading-relaxed opacity-90">Verify all financial records before finalizing.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT FORM AREA */}
                <div className="flex-1 bg-slate-50/30 overflow-y-auto custom-scrollbar p-10 md:p-14">
                    <div className="max-w-3xl mx-auto space-y-12">
                        {/* FORM SECTIONS (REUSED FROM PREVIOUS DESIGN) */}
                        <div className="space-y-6">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3 px-1">
                                <div className={`h-1.5 w-1.5 rounded-full ${t.primary}`}></div> Personal Profile
                            </h3>
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 grid grid-cols-1 md:grid-cols-2 gap-6 relative overflow-hidden group hover:border-slate-200 transition-all">
                                <div className="grid grid-cols-2 gap-4">
                                    <EmployeeInput label="First Name" name="firstName" value={newEmp.personal.firstName} onChange={handlePersonalChange} placeholder="John" />
                                    <EmployeeInput label="Last Name" name="lastName" value={newEmp.personal.lastName} onChange={handlePersonalChange} placeholder="Doe" />
                                </div>
                                <EmployeeInput label="Email Address" name="email" value={newEmp.personal.email} onChange={handlePersonalChange} placeholder="john.doe@rajhans.com" />
                                <EmployeeInput label="Phone Number" name="phone" value={newEmp.personal.phone} onChange={handlePersonalChange} placeholder="+91 00000 00000" />
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blood Group</label>
                                    <select 
                                        name="bloodGroup" 
                                        value={newEmp.personal.bloodGroup} 
                                        onChange={handlePersonalChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Select</option>
                                        <option value="A+">A+</option><option value="B+">B+</option><option value="O+">O+</option><option value="AB+">AB+</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3 px-1">
                                <div className={`h-1.5 w-1.5 rounded-full ${t.primary}`}></div> Work Contract
                            </h3>
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 grid grid-cols-1 md:grid-cols-2 gap-6 transition-all hover:border-slate-200">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role / Designation</label>
                                    <select 
                                        name="role" 
                                        value={newEmp.professional.role} 
                                        onChange={handleProfessionalChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all"
                                    >
                                        <option value="DSE">DSE (Sales)</option>
                                        <option value="Manager">Manager</option>
                                        <option value="Mechanic">Mechanic</option>
                                        <option value="Helper">Helper</option>
                                    </select>
                                </div>
                                <EmployeeInput label="Work Location" name="location" value={newEmp.professional.location} onChange={handleProfessionalChange} placeholder="Showroom / Branch" />
                                <EmployeeInput label="Joining Date" name="joinDate" type="date" value={newEmp.professional.joinDate} onChange={handleProfessionalChange} />
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Employment Status</label>
                                    <select 
                                        name="status" 
                                        value={newEmp.professional.status} 
                                        onChange={handleProfessionalChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-200 focus:ring-4 focus:ring-slate-100 transition-all"
                                    >
                                        <option value="Probation">Probation</option>
                                        <option value="Active">Active</option>
                                        <option value="On Leave">On Leave</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3 px-1">
                                <div className={`h-1.5 w-1.5 rounded-full ${t.primary}`}></div> Salary Basis
                            </h3>
                            <div className="bg-slate-900 p-8 rounded-[2rem] border border-white/5 shadow-2xl grid grid-cols-1 md:grid-cols-3 gap-6 group/finance transition-all hover:border-white/10">
                                <EmployeeInput label="Base Salary" name="baseSalary" value={newEmp.financial.baseSalary} onChange={handleFinancialChange} prefix="₹" type="number" />
                                <EmployeeInput label="Allowances" name="allowance" value={newEmp.financial.allowance} onChange={handleFinancialChange} prefix="₹" type="number" />
                                <EmployeeInput label="TDS / Tax" name="tax" value={newEmp.financial.tax} onChange={handleFinancialChange} prefix="₹" type="number" />
                                
                                <div className="md:col-span-3 pt-6 border-t border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Monthly Cost to Company (Est.)</p>
                                        <p className="text-4xl font-black text-white tracking-tighter">
                                            ₹ {(newEmp.financial.baseSalary + newEmp.financial.allowance).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl backdrop-blur-md border border-white/5 hidden sm:block">
                                        <Wallet size={24} className="text-emerald-400" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
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