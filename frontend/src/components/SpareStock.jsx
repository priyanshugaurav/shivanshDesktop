import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    LayoutGrid, Plus, Search, Package, CheckCircle2, 
    X, Pencil, Trash2, AlertCircle, Download, Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const SpareStockDashboard = ({ theme: t }) => {
    // --- STATE ---
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'add_stock'
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // New Category State
    const [newCategory, setNewCategory] = useState({ name: '', description: '' });
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingCategory, setDeletingCategory] = useState(null);
    const [deleteConfirmName, setDeleteConfirmName] = useState('');

    // Filter State
    const [filterStatus, setFilterStatus] = useState('All');

    // Add Stock Form State
    const initialStockForm = {
        name: '',
        qty: '',
        purchaseRate: '',
        status: 'Available'
    };
    const [stockForm, setStockForm] = useState(initialStockForm);
    const [submitting, setSubmitting] = useState(false);
    const [editingStock, setEditingStock] = useState(null);

    // --- HELPER: GET HEADERS ---
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: token } };
    };

    // --- API CALLS ---
    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${API_URL}/spare-categories`, getAuthHeader());
            setCategories(res.data);
            
            if (!selectedCategory && res.data.length > 0) {
                handleSelectCategory(res.data[0]);
            }
        } catch (err) { 
            console.error("Error fetching categories", err); 
        }
    };

    const fetchStocks = async (categoryId) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/spare-stocks/${categoryId}`, getAuthHeader());
            setStocks(res.data);
        } catch (err) { 
            console.error("Error fetching stocks", err); 
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // --- HANDLERS ---
    const handleSelectCategory = (cat) => {
        setSelectedCategory(cat);
        setViewMode('dashboard');
        fetchStocks(cat._id);
    };

    const handleAddCategory = async () => {
        if (!newCategory.name.trim()) return;
        try {
            await axios.post(`${API_URL}/spare-categories`, newCategory, getAuthHeader());
            setNewCategory({ name: '', description: '' });
            setIsAddingCategory(false);
            fetchCategories(); 
        } catch (err) { 
            console.error(err);
            alert(err.response?.data?.message || 'Failed to add category'); 
        }
    };

    const handleUpdateCategory = async () => {
        if (!editingCategory?.name.trim()) return;
        try {
            await axios.put(`${API_URL}/spare-categories/${editingCategory._id}`, editingCategory, getAuthHeader());
            setEditingCategory(null);
            fetchCategories();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to update category');
        }
    };

    const handleDeleteCategory = async () => {
        if (deleteConfirmName !== deletingCategory.name) {
            return alert("Confirmation failed: Name does not match.");
        }
        try {
            await axios.delete(`${API_URL}/spare-categories/${deletingCategory._id}`, getAuthHeader());
            setDeletingCategory(null);
            setDeleteConfirmName('');
            fetchCategories();
            if (selectedCategory?._id === deletingCategory._id) {
                setSelectedCategory(null);
                setStocks([]);
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete category');
        }
    };

    const handleAddStockSubmit = async () => {
        if (!stockForm.name) return alert("Item Name is required");
        setSubmitting(true);
        try {
            const payload = {
                ...stockForm,
                categoryId: selectedCategory._id,
                qty: Number(stockForm.qty) || 0,
                purchaseRate: Number(stockForm.purchaseRate) || 0,
            };

            if (editingStock) {
                await axios.put(`${API_URL}/spare-stocks/${editingStock._id}`, payload, getAuthHeader());
            } else {
                await axios.post(`${API_URL}/spare-stocks`, payload, getAuthHeader());
            }

            await fetchStocks(selectedCategory._id); 
            await fetchCategories(); 
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
        if (!window.confirm("Are you sure you want to delete this spare item?")) return;
        try {
            await axios.delete(`${API_URL}/spare-stocks/${id}`, getAuthHeader());
            fetchStocks(selectedCategory._id);
            fetchCategories();
        } catch (err) {
            console.error(err);
            alert("Failed to delete stock");
        }
    };

    const handleExportAllStocks = () => {
        // Simple export of current table
        const data = filteredStocks.map(stock => ({
            "Category": selectedCategory?.name || 'Unknown',
            "Item Name": stock.name || '',
            "Quantity": stock.qty || 0,
            "Purchase Rate": stock.purchaseRate || 0,
            "Total": (stock.qty || 0) * (stock.purchaseRate || 0),
            "Status": stock.status || 'Available',
            "Added On": stock.createdAt ? new Date(stock.createdAt).toLocaleDateString() : ''
        }));
        
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Spares");
        XLSX.writeFile(wb, "Spare_Stock_Inventory.xlsx");
    };

    // --- FILTERING LOGIC ---
    const filteredStocks = stocks.filter(stock => {
        const matchesSearch = stock.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || stock.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const totalStockValue = filteredStocks.reduce((sum, item) => sum + ((item.purchaseRate || 0) * (item.qty || 0)), 0);

    // --- RENDER ---
    return (
        <div className="w-full min-h-screen bg-white rounded-[1.25rem] border border-slate-200 shadow-xl shadow-slate-200/40 flex items-stretch font-sans text-slate-700 overflow-hidden">
            
            {/* --- SIDEBAR --- */}
            <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
                <div className="p-5 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-2 mb-4">
                        <div className={`h-8 w-8 rounded-lg ${t.primary} flex items-center justify-center text-white shadow-md`}>
                            <Layers size={16} />
                        </div>
                        <span className="text-sm font-black uppercase tracking-wider text-slate-900">Spare Categories</span>
                    </div>

                    {isAddingCategory ? (
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-2 duration-300">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black uppercase text-slate-400">New Category</span>
                                <button onClick={() => setIsAddingCategory(false)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                            </div>
                            <input 
                                autoFocus
                                value={newCategory.name}
                                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                                placeholder="Category Name..."
                                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50 font-bold"
                            />
                            <input 
                                value={newCategory.description}
                                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                                placeholder="Description (optional)"
                                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                            />
                            <button 
                                onClick={handleAddCategory} 
                                className={`w-full py-2.5 rounded-lg ${t.primary} text-white text-[10px] font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all flex items-center justify-center gap-2`}
                            >
                                <CheckCircle2 size={14}/> Create Category
                            </button>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsAddingCategory(true)}
                            className="w-full py-2.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 text-xs font-bold uppercase hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={14} /> Add New Category
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {categories.map((cat) => (
                        <div key={cat._id} className="relative group">
                            <button
                                onClick={() => handleSelectCategory(cat)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all flex items-center justify-between overflow-hidden ${
                                    selectedCategory?._id === cat._id 
                                    ? 'bg-white shadow-md border border-slate-100' 
                                    : 'hover:bg-slate-100 border border-transparent'
                                }`}
                            >
                                <div className="flex flex-col z-10">
                                    <span className={`text-sm font-bold ${selectedCategory?._id === cat._id ? 'text-slate-800' : 'text-slate-600'}`}>
                                        {cat.name}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[150px]">
                                        {cat.description || 'No description'}
                                    </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${selectedCategory?._id === cat._id ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                                    {cat.stockCount || 0}
                                </span>
                            </button>
                            <div className="absolute right-12 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); }}
                                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-blue-500 hover:border-blue-200 shadow-sm"
                                >
                                    <Pencil size={12} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeletingCategory(cat); }}
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
                        {selectedCategory ? (
                            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                {selectedCategory.name} <span className="text-slate-300 font-normal">|</span> <span className="text-sm font-bold text-slate-400 uppercase">Spare Stock Overview</span>
                            </h1>
                        ) : (
                            <h1 className="text-xl font-bold text-slate-300">Select a Category</h1>
                        )}
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={handleExportAllStocks}
                            className="h-9 px-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-emerald-100 hover:text-emerald-700 transition-all flex items-center gap-2"
                        >
                            <Download size={14} /> Export Spares
                        </button>
                        {selectedCategory && (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Search Item Name..."
                                        className="h-9 pl-9 pr-4 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold focus:outline-none focus:border-blue-400 w-64"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={() => setViewMode('add_stock')}
                                    className={`h-9 px-4 ${t.primary} text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all flex items-center gap-2`}
                                >
                                    <Plus size={14} /> Add Item
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* --- ADD STOCK FORM VIEW --- */}
                {viewMode === 'add_stock' && selectedCategory && (
                    <div className="flex-1 p-8 bg-slate-50/50 overflow-y-auto">
                        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                    <Package className="text-blue-500" /> {editingStock ? 'Edit Item' : 'Add New Item'} to {selectedCategory.name}
                                </h2>
                                <button onClick={() => setViewMode('dashboard')} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                                    <X size={20}/>
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Item Name</label>
                                    <input 
                                        type="text" 
                                        value={stockForm.name}
                                        onChange={(e) => setStockForm({...stockForm, name: e.target.value})}
                                        className="w-full h-10 px-3 rounded border border-slate-200 font-bold text-slate-700 focus:border-blue-500 focus:outline-none bg-slate-50"
                                        placeholder="e.g. Front Headlight Assembly"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Quantity</label>
                                        <input 
                                            type="number" 
                                            value={stockForm.qty}
                                            onChange={(e) => setStockForm({...stockForm, qty: e.target.value})}
                                            className="w-full h-10 px-3 rounded border border-slate-200 font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                                        <select 
                                            value={stockForm.status}
                                            onChange={(e) => setStockForm({...stockForm, status: e.target.value})}
                                            className="w-full h-10 px-3 rounded border border-slate-200 font-bold text-slate-700 focus:border-blue-500 focus:outline-none bg-white"
                                        >
                                            <option>Available</option>
                                            <option>Out of Stock</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Purchase Rate (₹)</label>
                                        <input 
                                            type="number" 
                                            value={stockForm.purchaseRate}
                                            onChange={(e) => setStockForm({...stockForm, purchaseRate: e.target.value})}
                                            className="w-full h-10 px-3 rounded border border-slate-200 font-mono font-bold text-slate-700 focus:border-blue-500 focus:outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <button 
                                        onClick={handleAddStockSubmit}
                                        disabled={submitting}
                                        className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-lg"
                                    >
                                        {submitting ? 'Saving...' : (editingStock ? 'Update Item' : 'Add to Inventory')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- DASHBOARD VIEW (TABLE) --- */}
                {viewMode === 'dashboard' && selectedCategory && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        
                        {/* Filters Bar */}
                        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-4 bg-slate-50/50">
                            <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-lg">
                                {['All', 'Available', 'Out of Stock'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setFilterStatus(filter)}
                                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                                            filterStatus === filter ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Value (Cost):</span>
                                <span className="text-sm font-black text-slate-700">₹ {totalStockValue.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Stock Table */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {filteredStocks.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                                    <Package size={32} className="mb-2 opacity-50"/>
                                    <span className="text-xs font-bold uppercase">No Spares Found</span>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Status</th>
                                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400">Item Name</th>
                                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Quantity</th>
                                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Purchase Rate</th>
                                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Total</th>
                                            <th className="py-3 px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStocks.map((item) => (
                                            <tr key={item._id} className="border-b border-slate-50 transition-colors group hover:bg-slate-50/80">
                                                <td className="py-3 px-4">
                                                    <span className={`inline-block w-2 h-2 rounded-full ${item.status === 'Available' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-bold text-sm text-slate-700">{item.name}</span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className={`font-bold ${item.qty > 0 ? 'text-slate-700' : 'text-red-500'}`}>{item.qty}</span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="font-mono text-xs font-bold text-slate-500">₹ {item.purchaseRate?.toLocaleString()}</span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="font-mono text-xs font-bold text-emerald-600">₹ {((item.qty || 0) * (item.purchaseRate || 0)).toLocaleString()}</span>
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => {
                                                                setEditingStock(item);
                                                                setStockForm({
                                                                    name: item.name,
                                                                    qty: item.qty,
                                                                    purchaseRate: item.purchaseRate,
                                                                    status: item.status
                                                                });
                                                                setViewMode('add_stock');
                                                            }}
                                                            className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                                                            title="Edit Item"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteStock(item._id)}
                                                            className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                                            title="Delete Item"
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

            {/* --- DELETE CATEGORY MODAL (SECURITY) --- */}
            {deletingCategory && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center gap-3 text-red-600 mb-4">
                                <div className="p-2 bg-red-50 rounded-lg"><AlertCircle size={20}/></div>
                                <h3 className="text-lg font-black uppercase tracking-tight">Security Verification</h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
                                You are about to permanently delete <span className="font-bold text-slate-900">{deletingCategory.name}</span>. 
                                This action cannot be undone. To confirm, please type the category name below:
                            </p>
                            <input 
                                type="text"
                                value={deleteConfirmName}
                                onChange={(e) => setDeleteConfirmName(e.target.value)}
                                placeholder="Type category name to confirm..."
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl mb-6 font-bold text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => { setDeletingCategory(null); setDeleteConfirmName(''); }}
                                    className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase text-[10px] hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDeleteCategory}
                                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-[10px] hover:bg-red-700 transition-all shadow-lg shadow-red-500/30"
                                >
                                    Permanently Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Edit Category Modal */}
            {editingCategory && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800">Edit Category</h3>
                            <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Category Name</label>
                                <input 
                                    autoFocus
                                    value={editingCategory.name}
                                    onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 focus:outline-none bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Description</label>
                                <input 
                                    value={editingCategory.description || ''}
                                    onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})}
                                    className="w-full p-3 rounded-xl border border-slate-200 text-slate-800 focus:border-blue-500 focus:outline-none bg-slate-50"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setEditingCategory(null)}
                                className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold uppercase text-[10px] hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpdateCategory}
                                className={`flex-1 py-3 ${t.primary} text-white rounded-xl font-bold uppercase text-[10px] hover:opacity-90 shadow-lg`}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpareStockDashboard;