import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    LayoutGrid, Plus, Search, Battery, Zap, Hash, 
    Settings, DollarSign, Package, CheckCircle2, 
    X, FileText, Filter, Tag, Palette, LogOut
} from 'lucide-react';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';


const TechnicalStockDashboard = ({ theme: t }) => {
    // --- STATE ---
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'add_stock'
    const [models, setModels] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // New Model Input State
    const [newModelName, setNewModelName] = useState('');
    const [isAddingModel, setIsAddingModel] = useState(false);

    // Filter State
    const [filterVariant, setFilterVariant] = useState('All'); 
    const [filterVoltage, setFilterVoltage] = useState('All'); 

    // Add Stock Form State
    const initialStockForm = {
        variant: 'Lead Acid',
        voltage: '48V',
        chassisNo: '',
        motorNo: '',
        batteryNo: '',
        color: 'Red',
        purchaseRate: '',
        hsn: ''
    };
    const [stockForm, setStockForm] = useState(initialStockForm);
    const [submitting, setSubmitting] = useState(false);

    // --- HELPER: GET HEADERS ---
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: token } };
    };

    // --- API CALLS ---

    // 1. Fetch Models (Sidebar)
    const fetchModels = async () => {
        try {
            // FIXED: Added getAuthHeader()
            const res = await axios.get(`${API_URL}/models`, getAuthHeader());
            setModels(res.data);
            
            if (!selectedModel && res.data.length > 0) {
                handleSelectModel(res.data[0]);
            }
        } catch (err) { 
            console.error("Error fetching models", err); 
        }
    };

    // 2. Fetch Stocks (Main Screen)
    const fetchStocks = async (modelId) => {
        setLoading(true);
        try {
            // FIXED: Added getAuthHeader()
            const res = await axios.get(`${API_URL}/stocks/${modelId}`, getAuthHeader());
            setStocks(res.data);
        } catch (err) { 
            console.error("Error fetching stocks", err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    // --- HANDLERS ---

    const handleSelectModel = (model) => {
        setSelectedModel(model);
        setViewMode('dashboard');
        fetchStocks(model._id);
    };

    const handleAddModel = async () => {
        if (!newModelName.trim()) return;
        try {
            // FIXED: Added getAuthHeader() as the third argument
            await axios.post(`${API_URL}/models`, { name: newModelName }, getAuthHeader());
            setNewModelName('');
            setIsAddingModel(false);
            fetchModels(); 
        } catch (err) { 
            console.error(err);
            alert('Failed to add model. Make sure you are logged in.'); 
        }
    };

    const handleAddStockSubmit = async () => {
        if (!stockForm.chassisNo) return alert("Chassis Number is required");
        setSubmitting(true);
        try {
            // FIXED: Added getAuthHeader() as the third argument
            await axios.post(`${API_URL}/stocks`, {
                ...stockForm,
                modelId: selectedModel._id
            }, getAuthHeader());

            await fetchStocks(selectedModel._id); 
            await fetchModels(); 
            setViewMode('dashboard');
            setStockForm(initialStockForm);
        } catch (err) {
            alert(err.response?.data?.message || "Error adding stock");
        } finally {
            setSubmitting(false);
        }
    };

    // --- FILTERING LOGIC ---
    const filteredStocks = stocks.filter(stock => {
        const matchesSearch = stock.chassisNo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (stock.batteryNo && stock.batteryNo.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesVariant = filterVariant === 'All' || stock.variant === filterVariant;
        const matchesVoltage = filterVoltage === 'All' || stock.voltage === filterVoltage;
        return matchesSearch && matchesVariant && matchesVoltage;
    });

    const totalStockValue = filteredStocks.reduce((sum, item) => sum + (item.purchaseRate || 0), 0);
    const colors = ['Red', 'Blue', 'Green', 'White', 'Black', 'Yellow', 'Grey'];

    // --- RENDER ---
    return (
        <div className="w-full min-h-screen bg-white rounded-[1.25rem] border border-slate-200 shadow-xl shadow-slate-200/40 flex items-stretch font-sans text-slate-700 overflow-hidden">
            
            {/* --- SIDEBAR --- */}
            <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-5 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                        <div className={`h-8 w-8 rounded-lg ${t.primary} flex items-center justify-center text-white shadow-md`}>
                            <LayoutGrid size={16} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-wider text-slate-900">Model Catalog</span>
                    </div>

                    {isAddingModel ? (
                        <div className="flex gap-2">
                            <input 
                                autoFocus
                                value={newModelName}
                                onChange={(e) => setNewModelName(e.target.value)}
                                placeholder="Model Name..."
                                className="w-full text-xs p-2 rounded border border-slate-300 focus:outline-none focus:border-blue-500"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
                            />
                            <button onClick={handleAddModel} className="bg-green-500 text-white p-2 rounded hover:bg-green-600"><CheckCircle2 size={14}/></button>
                            <button onClick={() => setIsAddingModel(false)} className="bg-slate-200 text-slate-500 p-2 rounded hover:bg-slate-300"><X size={14}/></button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAddingModel(true)}
                            className="w-full py-2.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 text-xs font-bold uppercase hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={14} /> Add New Model
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {models.map((model) => (
                        <button
                            key={model._id}
                            onClick={() => handleSelectModel(model)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between group relative overflow-hidden ${
                                selectedModel?._id === model._id 
                                ? 'bg-white shadow-md border border-slate-100' 
                                : 'hover:bg-slate-100 border border-transparent'
                            }`}
                        >
                            <div className="flex flex-col z-10">
                                <span className={`text-sm font-bold ${selectedModel?._id === model._id ? 'text-slate-800' : 'text-slate-600'}`}>
                                    {model.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                                    {model.type}
                                </span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${selectedModel?._id === model._id ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                                {model.stockCount || 0}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
                
                {/* Header */}
                <div className="h-16 px-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-20">
                    <div>
                        {selectedModel ? (
                            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                {selectedModel.name} <span className="text-slate-300 font-normal">|</span> <span className="text-sm font-bold text-slate-400 uppercase">Stock Overview</span>
                            </h1>
                        ) : (
                            <h1 className="text-xl font-bold text-slate-300">Select a Model</h1>
                        )}
                    </div>
                    
                    {selectedModel && (
                        <div className="flex gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Search Chassis/Battery..."
                                    className="h-9 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-400 w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={() => setViewMode('add_stock')}
                                className={`h-9 px-4 ${t.primary} text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all flex items-center gap-2`}
                            >
                                <Plus size={14} /> Add Stock
                            </button>
                        </div>
                    )}
                </div>

                {/* --- ADD STOCK FORM VIEW --- */}
                {viewMode === 'add_stock' && selectedModel && (
                    <div className="flex-1 p-8 bg-slate-50/50 overflow-y-auto">
                        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <Package className="text-blue-500" /> Add New Unit to {selectedModel.name}
                                </h2>
                                <button onClick={() => setViewMode('dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                    <X size={20}/>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                {/* Left Column: Config */}
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Configuration</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-500">BATTERY TYPE</span>
                                                <div className="flex gap-2">
                                                    {['Lead Acid', 'Lithium Ion'].map(v => (
                                                        <button 
                                                            key={v}
                                                            onClick={() => setStockForm({...stockForm, variant: v})}
                                                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded border ${
                                                                stockForm.variant === v 
                                                                ? 'bg-slate-800 text-white border-slate-800' 
                                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                                            }`}
                                                        >
                                                            {v}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-500">VOLTAGE</span>
                                                <div className="flex gap-2">
                                                    {['48V', '60V'].map(v => (
                                                        <button 
                                                            key={v}
                                                            onClick={() => setStockForm({...stockForm, voltage: v})}
                                                            className={`flex-1 py-2 text-[10px] font-bold uppercase rounded border ${
                                                                stockForm.voltage === v 
                                                                ? 'bg-blue-600 text-white border-blue-600' 
                                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                                            }`}
                                                        >
                                                            {v}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Color</label>
                                        <div className="flex flex-wrap gap-2">
                                            {colors.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setStockForm({...stockForm, color: c})}
                                                    className={`h-8 px-3 rounded-full border flex items-center gap-2 ${
                                                        stockForm.color === c ? 'border-slate-800 bg-slate-50' : 'border-slate-200 bg-white'
                                                    }`}
                                                >
                                                    <div className={`w-3 h-3 rounded-full border border-black/10`} style={{backgroundColor: c.toLowerCase()}}></div>
                                                    <span className="text-[10px] font-bold uppercase text-slate-600">{c}</span>
                                                    {stockForm.color === c && <CheckCircle2 size={12} className="text-green-500"/>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Financials</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-500">PURCHASE RATE (₹)</span>
                                                <input 
                                                    type="number" 
                                                    value={stockForm.purchaseRate}
                                                    onChange={(e) => setStockForm({...stockForm, purchaseRate: e.target.value})}
                                                    className="w-full h-10 px-3 rounded border border-slate-200 font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-500">HSN CODE</span>
                                                <input 
                                                    type="text" 
                                                    value={stockForm.hsn}
                                                    onChange={(e) => setStockForm({...stockForm, hsn: e.target.value})}
                                                    className="w-full h-10 px-3 rounded border border-slate-200 font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                                                    placeholder="e.g. 8703"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Identifiers */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Technical Identifiers</label>
                                        
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Hash size={12}/> CHASSIS NO.</span>
                                            <input 
                                                type="text" 
                                                value={stockForm.chassisNo}
                                                onChange={(e) => setStockForm({...stockForm, chassisNo: e.target.value})}
                                                className="w-full h-10 px-3 rounded border border-slate-200 font-mono font-bold text-slate-700 focus:border-blue-500 focus:outline-none bg-slate-50"
                                                placeholder="Enter Unique Chassis ID"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Battery size={12}/> BATTERY NO.</span>
                                            <input 
                                                type="text" 
                                                value={stockForm.batteryNo}
                                                onChange={(e) => setStockForm({...stockForm, batteryNo: e.target.value})}
                                                className="w-full h-10 px-3 rounded border border-slate-200 font-mono font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                                                placeholder="Enter Battery Serial"
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Zap size={12}/> MOTOR NO.</span>
                                            <input 
                                                type="text" 
                                                value={stockForm.motorNo}
                                                onChange={(e) => setStockForm({...stockForm, motorNo: e.target.value})}
                                                className="w-full h-10 px-3 rounded border border-slate-200 font-mono font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                                                placeholder="Enter Motor/Engine No"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button 
                                            onClick={handleAddStockSubmit}
                                            disabled={submitting}
                                            className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg"
                                        >
                                            {submitting ? 'Saving...' : 'Add to Inventory'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- DASHBOARD VIEW (TABLE) --- */}
                {viewMode === 'dashboard' && selectedModel && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        
                        {/* Filters Bar */}
                        <div className="px-6 py-3 border-b border-slate-100 flex gap-4 bg-slate-50/50">
                            <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-lg">
                                {['All', 'Lead Acid', 'Lithium Ion'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setFilterVariant(filter)}
                                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                                            filterVariant === filter ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                            <div className="w-px bg-slate-200 my-1"></div>
                            <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-lg">
                                {['All', '48V', '60V'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setFilterVoltage(filter)}
                                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                                            filterVoltage === filter ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Stock Value:</span>
                                <span className="text-sm font-black text-slate-700">₹ {totalStockValue.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Stock Table */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {filteredStocks.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                                    <Package size={32} className="mb-2 opacity-50"/>
                                    <span className="text-xs font-bold uppercase">No Stock Found</span>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Chassis No</th>
                                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Battery No</th>
                                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Variant</th>
                                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Color</th>
                                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStocks.map((item) => (
                                            <tr key={item._id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                                                <td className="py-3 px-4">
                                                    <span className={`inline-block w-2 h-2 rounded-full ${item.status === 'Available' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-mono text-xs font-bold text-slate-700">{item.chassisNo}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-mono text-xs text-slate-500">{item.batteryNo || '-'}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{item.variant}</span>
                                                        <span className="text-[9px] font-bold text-blue-500">{item.voltage}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 rounded-full border border-black/10 shadow-sm" style={{backgroundColor: item.color?.toLowerCase()}}></div>
                                                        <span className="text-xs text-slate-600">{item.color}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="font-mono text-xs font-bold text-slate-700">₹ {item.purchaseRate?.toLocaleString()}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TechnicalStockDashboard;