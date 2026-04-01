import React, { useState, useEffect, useMemo } from 'react';
import { 
    Search, Truck, FileText, CheckCircle2, 
    AlertCircle, User, Calendar, X,
    Filter, Hash, ShieldCheck, Clock, 
    MoreHorizontal, ArrowRight, LayoutGrid, Loader2
} from 'lucide-react';

const AddVehicle = ({ theme: t }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [filterMode, setFilterMode] = useState('all'); // 'all' | 'reg' | 'permit'
    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState([]);
    
    // Form States
    const [regInput, setRegInput] = useState('');
    const [permitInput, setPermitInput] = useState('');
    const [permitDate, setPermitDate] = useState('');

    // --- FETCH REAL DATA ---
    const fetchQueue = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/agreements/registration-queue', {
                headers: { 'Authorization': token }
            });
            if (res.ok) {
                const data = await res.json();
                // Map backend fields to frontend names
                const mapped = data.map(agg => ({
                    id: agg._id,
                    agreementId: agg.agreementId,
                    customer: agg.customerId?.personal?.name || 'Unknown',
                    model: agg.model?.name || 'N/A',
                    date: new Date(agg.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                    vehicleNo: agg.registrationNo || null,
                    permitNo: agg.permitNo || null,
                    chassis: agg.chassis || 'N/A'
                }));
                setVehicles(mapped);
            }
        } catch (error) {
            console.error('Error fetching queue:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    // --- THEME HELPERS ---
    const themeColor = t.text.split('-')[1]; 
    const activeBorder = `border-${themeColor}-500`;
    const activeRing = `focus:ring-${themeColor}-500`;

    // --- FILTER LOGIC ---
    const filteredVehicles = useMemo(() => {
        return vehicles.filter(v => {
            const matchesSearch = v.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  v.model.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (!matchesSearch) return false;

            if (filterMode === 'reg') return !v.vehicleNo;
            if (filterMode === 'permit') return !v.permitNo;
            return true;
        });
    }, [vehicles, searchTerm, filterMode]);

    // --- HANDLERS ---
    const handleSelect = (v) => {
        setSelectedVehicle(v);
        setRegInput(v.vehicleNo || '');
        setPermitInput(v.permitNo || '');
        setPermitDate('');
    };

    const handleSaveReg = async () => {
        if (!regInput || !selectedVehicle) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/agreement/${selectedVehicle.id}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': token,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ registrationNo: regInput })
            });

            if (res.ok) {
                const updated = vehicles.map(v => v.id === selectedVehicle.id ? { ...v, vehicleNo: regInput } : v);
                setVehicles(updated);
                setSelectedVehicle({ ...selectedVehicle, vehicleNo: regInput });
            }
        } catch (error) {
            console.error('Save Reg error:', error);
        }
    };

    const handleSavePermit = async () => {
        if (!permitInput || !selectedVehicle) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/agreement/${selectedVehicle.id}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': token,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ permitNo: permitInput })
            });

            if (res.ok) {
                const updated = vehicles.map(v => v.id === selectedVehicle.id ? { ...v, permitNo: permitInput } : v);
                setVehicles(updated);
                setSelectedVehicle({ ...selectedVehicle, permitNo: permitInput });
            }
        } catch (error) {
            console.error('Save Permit error:', error);
        }
    };

    // Helper for Status Pills
    const getStatusColor = (v) => {
        if (!v.vehicleNo && !v.permitNo) return 'bg-rose-500';
        if (!v.vehicleNo || !v.permitNo) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    if (loading && vehicles.length === 0) {
        return (
            <div className="w-full h-[680px] bg-white rounded-[1.5rem] flex flex-col items-center justify-center space-y-4">
                 <Loader2 size={40} className={`animate-spin ${t.text}`} />
                 <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Registration Queue...</p>
            </div>
        );
    }

    return (
        <div className="w-full h-[680px] bg-white rounded-[1.5rem] border border-slate-200 shadow-xl flex overflow-hidden font-sans text-slate-800">
            
            {/* --- LEFT SIDEBAR: SMART QUEUE --- */}
            <div className="w-[340px] bg-slate-50 border-r border-slate-200 flex flex-col">
                
                {/* 1. Header & Filters */}
                <div className="p-5 border-b border-slate-200 bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                            <LayoutGrid size={16} className={t.text} />
                            Task Queue
                        </h2>
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-lg">
                            {filteredVehicles.length}
                        </span>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex p-1 bg-slate-100 rounded-xl mb-4">
                        {['all', 'reg', 'permit'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setFilterMode(mode)}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-all ${
                                    filterMode === mode 
                                    ? 'bg-white text-slate-900 shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                {mode === 'all' ? 'All' : mode === 'reg' ? 'No Reg' : 'No Permit'}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-100 transition-all"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* 2. The List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                    {filteredVehicles.map((vehicle) => {
                        const isSelected = selectedVehicle?.id === vehicle.id;
                        return (
                            <button
                                key={vehicle.id}
                                onClick={() => handleSelect(vehicle)}
                                className={`w-full text-left p-3.5 rounded-2xl border transition-all relative group ${
                                    isSelected 
                                    ? 'bg-white border-slate-300 shadow-md ring-1 ring-slate-100' 
                                    : 'bg-white border-transparent hover:border-slate-200 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(vehicle)}`}></div>
                                        <span className="text-xs font-bold text-slate-900">{vehicle.customer}</span>
                                    </div>
                                    <span className="text-[9px] font-mono font-medium text-slate-400">{vehicle.id}</span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-500 font-medium bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                        {vehicle.model}
                                    </span>
                                    
                                    {/* Mini Status Icons */}
                                    <div className="flex gap-1">
                                        <div className={`p-1 rounded-md ${vehicle.vehicleNo ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                                            <Truck size={10} />
                                        </div>
                                        <div className={`p-1 rounded-md ${vehicle.permitNo ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}`}>
                                            <FileText size={10} />
                                        </div>
                                    </div>
                                </div>
                                
                                {isSelected && (
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full ${t.primary}`}></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* --- RIGHT PANEL: WORKSPACE --- */}
            <div className="flex-1 bg-white relative flex flex-col">
                {selectedVehicle ? (
                    <>
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-20">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-md ${
                                    ['bg-indigo-500', 'bg-rose-500', 'bg-amber-500'][vehicles.indexOf(selectedVehicle) % 3] || 'bg-slate-800'
                                }`}>
                                    {selectedVehicle.customer.charAt(0)}
                                </div>
                                <div>
                                    <h1 className="text-xl font-black text-slate-900 tracking-tight">{selectedVehicle.customer}</h1>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{selectedVehicle.model}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span className="text-xs text-slate-400 font-mono">{selectedVehicle.date}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedVehicle(null)} className="p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto custom-scrollbar h-full bg-slate-50/30">
                            <div className="max-w-3xl mx-auto grid grid-cols-1 gap-6">
                                
                                {/* 1. REGISTRATION CARD */}
                                <div className={`group relative p-6 rounded-[2rem] border transition-all duration-300 ${
                                    selectedVehicle.vehicleNo 
                                    ? 'bg-white border-emerald-100 shadow-sm' 
                                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                                }`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-2xl ${selectedVehicle.vehicleNo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                <Truck size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">Vehicle Registration</h3>
                                                <p className="text-[10px] text-slate-500 font-medium">Step 1: License Plate</p>
                                            </div>
                                        </div>
                                        {selectedVehicle.vehicleNo ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                                <CheckCircle2 size={12}/> Done
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                                                <Clock size={12}/> Pending
                                            </span>
                                        )}
                                    </div>

                                    {selectedVehicle.vehicleNo ? (
                                        // View Mode
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plate Number</p>
                                                <p className="text-xl font-black text-slate-800 font-mono">{selectedVehicle.vehicleNo}</p>
                                            </div>
                                            <button onClick={() => { setSelectedVehicle({...selectedVehicle, vehicleNo: null}); setRegInput('') }} className="text-xs font-bold text-slate-400 hover:text-slate-600 underline">Edit</button>
                                        </div>
                                    ) : (
                                        // Edit Mode
                                        <div className="flex gap-3">
                                            <div className="flex-1 relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">IND</span>
                                                <input 
                                                    type="text" 
                                                    placeholder="HR02AB0000"
                                                    value={regInput}
                                                    onChange={(e) => setRegInput(e.target.value.toUpperCase())}
                                                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200 transition-all font-mono"
                                                />
                                            </div>
                                            <button 
                                                onClick={handleSaveReg}
                                                disabled={!regInput}
                                                className={`px-6 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                                                    regInput ? `${t.primary} hover:shadow-lg hover:-translate-y-0.5` : 'bg-slate-300 cursor-not-allowed'
                                                }`}
                                            >
                                                Save
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* 2. PERMIT CARD */}
                                <div className={`group relative p-6 rounded-[2rem] border transition-all duration-300 ${
                                    selectedVehicle.permitNo 
                                    ? 'bg-white border-emerald-100 shadow-sm' 
                                    : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                                }`}>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-2xl ${selectedVehicle.permitNo ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-900">Commercial Permit</h3>
                                                <p className="text-[10px] text-slate-500 font-medium">Step 2: Legal Docs</p>
                                            </div>
                                        </div>
                                        {selectedVehicle.permitNo ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                                <CheckCircle2 size={12}/> Done
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                                                <AlertCircle size={12}/> Missing
                                            </span>
                                        )}
                                    </div>

                                    {selectedVehicle.permitNo ? (
                                        // View Mode
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Permit Number</p>
                                                <p className="text-xl font-black text-slate-800 font-mono">{selectedVehicle.permitNo}</p>
                                            </div>
                                            <button onClick={() => { setSelectedVehicle({...selectedVehicle, permitNo: null}); setPermitInput('') }} className="text-xs font-bold text-slate-400 hover:text-slate-600 underline">Edit</button>
                                        </div>
                                    ) : (
                                        // Edit Mode
                                        <div className="space-y-3">
                                            <div className="flex gap-3">
                                                <div className="flex-1 relative">
                                                    <Hash size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        type="text" 
                                                        placeholder="P-2026/..."
                                                        value={permitInput}
                                                        onChange={(e) => setPermitInput(e.target.value.toUpperCase())}
                                                        className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-200 transition-all font-mono"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <button 
                                                    onClick={handleSavePermit}
                                                    disabled={!permitInput}
                                                    className={`px-8 py-3 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                                                        permitInput ? `${t.primary} hover:shadow-lg hover:-translate-y-0.5` : 'bg-slate-300 cursor-not-allowed'
                                                    }`}
                                                >
                                                    Issue Permit
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    </>
                ) : (
                    // --- EMPTY STATE DASHBOARD ---
                    <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50/50">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-10 rounded-full"></div>
                            <div className="relative w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center border border-slate-100">
                                <ShieldCheck size={48} className="text-slate-300" strokeWidth={1.5} />
                            </div>
                        </div>
                        
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Registration Control</h2>
                        <p className="text-sm text-slate-500 mb-8 max-w-xs text-center">
                            Select a pending vehicle from the queue to manage registration numbers and commercial permits.
                        </p>

                        <div className="grid grid-cols-3 gap-4 w-full max-w-xl">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col items-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Queue</span>
                                <span className="text-2xl font-black text-slate-900">{vehicles.length}</span>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col items-center">
                                <span className="text-[10px] font-bold text-amber-500 uppercase mb-1">Pending Reg</span>
                                <span className="text-2xl font-black text-amber-500">
                                    {vehicles.filter(v => !v.vehicleNo).length}
                                </span>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col items-center">
                                <span className="text-[10px] font-bold text-rose-500 uppercase mb-1">No Permit</span>
                                <span className="text-2xl font-black text-rose-500">
                                    {vehicles.filter(v => !v.permitNo).length}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddVehicle;