import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    LayoutGrid, Plus, Search, Battery, Zap, Hash, 
    Settings, DollarSign, Package, CheckCircle2, 
    X, FileText, Filter, Tag, Palette, LogOut,
    Pencil, Trash2, AlertCircle
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
    const [newModel, setNewModel] = useState({ name: '', type: 'E-Rickshaw' });
    const [isAddingModel, setIsAddingModel] = useState(false);
    const [editingModel, setEditingModel] = useState(null); // { _id: string, name: string, type: string }
    const [deletingModel, setDeletingModel] = useState(null); // model object
    const [deleteConfirmName, setDeleteConfirmName] = useState('');

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
        batteryCompany: '',
        chargerNo: '',
        chargerCompany: '',
        color: 'Red',
        purchaseRate: '',
        hsn: ''
    };
    const [stockForm, setStockForm] = useState(initialStockForm);
    const [submitting, setSubmitting] = useState(false);
    const [editingStock, setEditingStock] = useState(null); // stock object
    const [deletingStock, setDeletingStock] = useState(null); // stock object

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
        if (!newModel.name.trim()) return;
        try {
            await axios.post(`${API_URL}/models`, newModel, getAuthHeader());
            setNewModel({ name: '', type: 'E-Rickshaw' });
            setIsAddingModel(false);
            fetchModels(); 
        } catch (err) { 
            console.error(err);
            alert(err.response?.data?.message || 'Failed to add model'); 
        }
    };

    const handleUpdateModel = async () => {
        if (!editingModel?.name.trim()) return;
        try {
            await axios.put(`${API_URL}/models/${editingModel._id}`, editingModel, getAuthHeader());
            setEditingModel(null);
            fetchModels();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to update model');
        }
    };

    const handleDeleteModel = async () => {
        if (deleteConfirmName !== deletingModel.name) {
            return alert("Confirmation failed: Model name does not match.");
        }
        try {
            await axios.delete(`${API_URL}/models/${deletingModel._id}`, getAuthHeader());
            setDeletingModel(null);
            setDeleteConfirmName('');
            fetchModels();
            if (selectedModel?._id === deletingModel._id) {
                setSelectedModel(null);
                setStocks([]);
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete model');
        }
    };

    const handleAddStockSubmit = async () => {
        if (!stockForm.chassisNo) return alert("Chassis Number is required");
        setSubmitting(true);
        try {
            if (editingStock) {
                await axios.put(`${API_URL}/stocks/${editingStock._id}`, {
                    ...stockForm,
                    modelId: selectedModel._id
                }, getAuthHeader());
            } else {
                await axios.post(`${API_URL}/stocks`, {
                    ...stockForm,
                    modelId: selectedModel._id
                }, getAuthHeader());
            }

            await fetchStocks(selectedModel._id); 
            await fetchModels(); 
            setViewMode('dashboard');
            setStockForm(initialStockForm);
            setEditingStock(null);
        } catch (err) {
            alert(err.response?.data?.message || "Error saving stock");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteStock = async (id) => {
        if (!window.confirm("Are you sure you want to delete this stock unit?")) return;
        try {
            await axios.delete(`${API_URL}/stocks/${id}`, getAuthHeader());
            fetchStocks(selectedModel._id);
            fetchModels();
        } catch (err) {
            console.error(err);
            alert("Failed to delete stock");
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
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black uppercase text-slate-400">New Model</span>
                                <button onClick={() => setIsAddingModel(false)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                            </div>
                            <input 
                                autoFocus
                                value={newModel.name}
                                onChange={(e) => setNewModel({...newModel, name: e.target.value})}
                                placeholder="Model Name..."
                                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 font-bold"
                            />
                            <select 
                                value={newModel.type}
                                onChange={(e) => setNewModel({...newModel, type: e.target.value})}
                                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold bg-slate-50"
                            >
                                <option>E-Rickshaw</option>
                                <option>E-Loader</option>
                                <option>E-Bike</option>
                            </select>
                            <button 
                                onClick={handleAddModel} 
                                className={`w-full py-2.5 rounded-lg ${t.primary} text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2`}
                            >
                                <CheckCircle2 size={14}/> Create Catalog Item
                            </button>
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
                        <div key={model._id} className="relative group">
                            <button
                                onClick={() => handleSelectModel(model)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between overflow-hidden ${
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
                            <div className="absolute right-12 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingModel(model); }}
                                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-200 shadow-sm"
                                >
                                    <Pencil size={12} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeletingModel(model); }}
                                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-200 shadow-sm"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
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
                                    <Package className="text-blue-500" /> {editingStock ? 'Edit Unit' : 'Add New Unit'} to {selectedModel.name}
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
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Financials (Unit Specific)</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Purchase Rate (₹)</span>
                                                <input 
                                                    type="number" 
                                                    value={stockForm.purchaseRate}
                                                    onChange={(e) => setStockForm({...stockForm, purchaseRate: e.target.value})}
                                                    className="w-full h-10 px-3 rounded border border-slate-200 font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">HSN Code</span>
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
                                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Tag size={12}/> BATTERY COMPANY</span>
                                            <input 
                                                type="text" 
                                                value={stockForm.batteryCompany}
                                                onChange={(e) => setStockForm({...stockForm, batteryCompany: e.target.value})}
                                                className="w-full h-10 px-3 rounded border border-slate-200 font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                                                placeholder="e.g. Eastman, Exide"
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

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Hash size={12}/> CHARGER NO.</span>
                                                <input 
                                                    type="text" 
                                                    value={stockForm.chargerNo}
                                                    onChange={(e) => setStockForm({...stockForm, chargerNo: e.target.value})}
                                                    className="w-full h-10 px-3 rounded border border-slate-200 font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                                                    placeholder="Charger Serial"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Settings size={12}/> CHARGER COMPANY</span>
                                                <input 
                                                    type="text" 
                                                    value={stockForm.chargerCompany}
                                                    onChange={(e) => setStockForm({...stockForm, chargerCompany: e.target.value})}
                                                    className="w-full h-10 px-3 rounded border border-slate-200 font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                                                    placeholder="Manufacturer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button 
                                            onClick={handleAddStockSubmit}
                                            disabled={submitting}
                                            className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg"
                                        >
                                            {submitting ? 'Saving...' : (editingStock ? 'Update Unit' : 'Add to Inventory')}
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
                                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
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
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => {
                                                                setEditingStock(item);
                                                                setStockForm({
                                                                    variant: item.variant,
                                                                    voltage: item.voltage,
                                                                    chassisNo: item.chassisNo,
                                                                    motorNo: item.motorNo,
                                                                    batteryNo: item.batteryNo,
                                                                    batteryCompany: item.batteryCompany || '',
                                                                    chargerNo: item.chargerNo || '',
                                                                    chargerCompany: item.chargerCompany || '',
                                                                    color: item.color,
                                                                    purchaseRate: item.purchaseRate,
                                                                    hsn: item.hsn
                                                                });
                                                                setViewMode('add_stock');
                                                            }}
                                                            className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                                                            title="Edit Unit"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteStock(item._id)}
                                                            className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                                            title="Delete Unit"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
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

            {/* --- DELETE MODEL MODAL (SECURITY) --- */}
            {deletingModel && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-3 text-red-600 mb-4">
                                <div className="p-2 bg-red-50 rounded-lg"><AlertCircle size={20}/></div>
                                <h3 className="text-lg font-black uppercase tracking-tight">Security Verification</h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                                You are about to permanently delete <span className="font-bold text-slate-900">{deletingModel.name}</span>. 
                                This action cannot be undone. To confirm, please type the model name below:
                            </p>
                            <input 
                                type="text"
                                value={deleteConfirmName}
                                onChange={(e) => setDeleteConfirmName(e.target.value)}
                                placeholder="Type model name to confirm..."
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mb-6 font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { setDeletingModel(null); setDeleteConfirmName(''); }}
                                    className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase text-[10px] hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDeleteModel}
                                    disabled={deleteConfirmName !== deletingModel.name}
                                    className={`flex-1 py-3 rounded-xl font-black uppercase text-[10px] text-white shadow-lg transition-all ${
                                        deleteConfirmName === deletingModel.name ? 'bg-red-600 shadow-red-500/20 hover:bg-red-700' : 'bg-slate-300 shadow-none cursor-not-allowed'
                                    }`}
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- EDIT MODEL MODAL --- */}
            {editingModel && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Edit Model Details</h3>
                                <button onClick={() => setEditingModel(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Model Name</label>
                                    <input 
                                        type="text"
                                        value={editingModel.name}
                                        onChange={(e) => setEditingModel({...editingModel, name: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Model Type</label>
                                    <select 
                                        value={editingModel.type}
                                        onChange={(e) => setEditingModel({...editingModel, type: e.target.value})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                                    >
                                        <option>E-Rickshaw</option>
                                        <option>E-Loader</option>
                                        <option>E-Bike</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-8">
                                <button 
                                    onClick={handleUpdateModel}
                                    className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={16}/> Update Model Info
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TechnicalStockDashboard;