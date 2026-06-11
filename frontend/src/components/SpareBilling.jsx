import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Plus, Search, Receipt, X, Trash2, CheckCircle2, User, Phone, IndianRupee, Layers, Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const SpareBilling = ({ theme: t }) => {
    // --- STATE ---
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'new_bill'
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // New Bill State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [labourCharge, setLabourCharge] = useState('');
    const [labourRemark, setLabourRemark] = useState('');
    const [isLabourChargeAdded, setIsLabourChargeAdded] = useState(false);
    
    // Items for the new bill
    const [billItems, setBillItems] = useState([]);
    
    // Available spares to select from
    const [availableCategories, setAvailableCategories] = useState([]);
    const [availableSpares, setAvailableSpares] = useState([]);
    
    // Current item being added to bill
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSpareId, setSelectedSpareId] = useState('');
    const [selectedSpareQty, setSelectedSpareQty] = useState(1);
    const [selectedSparePrice, setSelectedSparePrice] = useState(0);

    const [submitting, setSubmitting] = useState(false);

    // --- HELPER: GET HEADERS ---
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return { headers: { Authorization: token } };
    };

    // --- API CALLS ---
    const fetchBills = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/spare-bills`, getAuthHeader());
            setBills(res.data);
        } catch (err) { 
            console.error("Error fetching bills", err); 
        } finally { 
            setLoading(false); 
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await axios.get(`${API_URL}/spare-categories`, getAuthHeader());
            setAvailableCategories(res.data);
        } catch (err) {
            console.error("Error fetching categories", err);
        }
    };

    const fetchSparesByCategory = async (categoryId) => {
        try {
            const res = await axios.get(`${API_URL}/spare-stocks/${categoryId}`, getAuthHeader());
            // Only show spares that have quantity > 0
            const inStock = res.data.filter(s => s.qty > 0 && s.status === 'Available');
            setAvailableSpares(inStock);
            
            if (inStock.length > 0) {
                setSelectedSpareId(inStock[0]._id);
                setSelectedSparePrice('');
            } else {
                setSelectedSpareId('');
                setSelectedSparePrice(0);
            }
        } catch (err) {
            console.error("Error fetching spares", err);
        }
    };

    useEffect(() => {
        fetchBills();
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            fetchSparesByCategory(selectedCategory);
        } else {
            setAvailableSpares([]);
            setSelectedSpareId('');
        }
    }, [selectedCategory]);

    // Handle changing the selected spare to auto-update the default selling price
    useEffect(() => {
        if (selectedSpareId) {
            const spare = availableSpares.find(s => s._id === selectedSpareId);
            if (spare) {
                setSelectedSparePrice('');
            }
        }
    }, [selectedSpareId]);


    // --- HANDLERS ---
    const handleAddItemToBill = () => {
        if (!selectedSpareId) return alert("Please select a spare item.");
        if (selectedSpareQty <= 0) return alert("Quantity must be at least 1.");
        
        const spare = availableSpares.find(s => s._id === selectedSpareId);
        if (!spare) return;

        if (selectedSpareQty > spare.qty) {
            return alert(`Only ${spare.qty} in stock for ${spare.name}`);
        }

        // Check if already in bill
        const existingItemIndex = billItems.findIndex(item => item.stockId === spare._id);
        if (existingItemIndex >= 0) {
            const updatedItems = [...billItems];
            updatedItems[existingItemIndex].qty += Number(selectedSpareQty);
            setBillItems(updatedItems);
        } else {
            setBillItems([
                ...billItems,
                {
                    stockId: spare._id,
                    name: spare.name,
                    qty: Number(selectedSpareQty),
                    sellingPrice: Number(selectedSparePrice)
                }
            ]);
        }

        // Reset selection inputs
        setSelectedSpareQty(1);
    };

    const handleRemoveItemFromBill = (index) => {
        const updatedItems = [...billItems];
        updatedItems.splice(index, 1);
        setBillItems(updatedItems);
    };

    const handleCreateBill = async () => {
        if (!customerName.trim()) return alert("Customer Name is required.");
        if (billItems.length === 0) return alert("Please add at least one item to the bill.");

        const itemsTotal = billItems.reduce((sum, item) => sum + (item.qty * item.sellingPrice), 0);
        const totalAmount = itemsTotal + (Number(labourCharge) || 0);

        setSubmitting(true);
        try {
            const payload = {
                customerName,
                customerPhone,
                items: billItems,
                paymentMethod,
                totalAmount,
                labourCharge: Number(labourCharge) || 0,
                labourRemark
            };

            await axios.post(`${API_URL}/spare-bills`, payload, getAuthHeader());
            
            // Reset form
            setCustomerName('');
            setCustomerPhone('');
            setPaymentMethod('Cash');
            setLabourCharge('');
            setLabourRemark('');
            setIsLabourChargeAdded(false);
            setBillItems([]);
            setSelectedCategory('');
            
            // Return to dashboard and refresh
            setViewMode('dashboard');
            fetchBills();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to create bill.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteBill = async (id) => {
        if (!window.confirm("Are you sure you want to delete this bill? This will restore the items back to stock.")) return;
        try {
            await axios.delete(`${API_URL}/spare-bills/${id}`, getAuthHeader());
            fetchBills();
        } catch (err) {
            console.error(err);
            alert("Failed to delete bill.");
        }
    };

    const handlePrintBill = (bill) => {
        const doc = new jsPDF();
        
        // Colors
        const primaryColor = [252, 193, 22]; // Yellow theme
        const darkText = [30, 41, 59];
        const lightText = [100, 116, 139];
        
        // --- HEADER ---
        // Yellow rectangle top right
        doc.setFillColor(...primaryColor);
        doc.rect(130, 15, 80, 18, 'F');
        
        doc.setFontSize(26);
        doc.setTextColor(255, 255, 255);
        doc.text("INVOICE", 140, 28);
        
        // Brand Name (Left)
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkText);
        doc.text("SHIVANSH AUTO ENTERPRISES", 14, 25);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...lightText);
        doc.text("Authorised Spare Parts Dealer", 14, 31);
        
        // --- INVOICE INFO ---
        // Left - Customer Info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkText);
        doc.text("Invoice to:", 14, 50);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(bill.customerName, 14, 56);
        if (bill.customerPhone) {
            doc.text(`Phone: ${bill.customerPhone}`, 14, 61);
        }
        
        // Right - Invoice Details
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("Invoice#", 130, 50);
        doc.text("Date", 130, 56);
        
        doc.setFont('helvetica', 'normal');
        const shortId = bill._id.substring(bill._id.length - 6).toUpperCase();
        doc.text(shortId, 160, 50);
        doc.text(new Date(bill.createdAt).toLocaleDateString(), 160, 56);
        
        // --- TABLE ---
        const tableColumn = ["SL.", "Item Description", "Price", "Qty.", "Total"];
        const tableRows = [];
        
        let subTotal = 0;
        
        bill.items.forEach((item, index) => {
            const rowTotal = item.qty * item.sellingPrice;
            subTotal += rowTotal;
            tableRows.push([
                index + 1,
                item.name,
                `Rs. ${item.sellingPrice.toLocaleString()}`,
                item.qty.toString(),
                `Rs. ${rowTotal.toLocaleString()}`
            ]);
        });
        
        if (bill.labourCharge > 0) {
            subTotal += bill.labourCharge;
            tableRows.push([
                bill.items.length + 1,
                `Labour Charge: ${bill.labourRemark || ''}`,
                "-",
                "-",
                `Rs. ${bill.labourCharge.toLocaleString()}`
            ]);
        }
        
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
            theme: 'plain',
            headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: darkText },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            styles: { fontSize: 10, cellPadding: 6 },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 35, halign: 'right' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 35, halign: 'right' }
            }
        });
        
        const finalY = doc.lastAutoTable.finalY || 70;
        
        // --- BOTTOM TOTALS ---
        const rightColX = 130;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text("Sub Total:", rightColX, finalY + 15);
        doc.text("Tax:", rightColX, finalY + 22);
        
        doc.setFont('helvetica', 'normal');
        doc.text(`Rs. ${subTotal.toLocaleString()}`, 160, finalY + 15);
        doc.text(`0.00`, 160, finalY + 22);
        
        // Yellow Total Box
        doc.setFillColor(...primaryColor);
        doc.rect(rightColX - 5, finalY + 28, 75, 10, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text("Total:", rightColX, finalY + 35);
        doc.text(`Rs. ${bill.totalAmount.toLocaleString()}`, 160, finalY + 35);
        
        // --- BOTTOM LEFT DETAILS ---
        doc.setTextColor(...darkText);
        doc.setFontSize(10);
        doc.text("Thank you for your business!", 14, finalY + 15);
        
        doc.setFontSize(9);
        doc.text("Payment Info:", 14, finalY + 28);
        doc.setFont('helvetica', 'normal');
        doc.text(`Method: ${bill.paymentMethod}`, 14, finalY + 34);
        
        // --- FOOTER ---
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Yellow line
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(1);
        doc.line(14, pageHeight - 30, 196, pageHeight - 30);
        
        doc.setFontSize(9);
        doc.setTextColor(...lightText);
        doc.text("Authorised Sign", 160, pageHeight - 20);
        doc.text("Shivansh Auto Enterprises | Thank you", 14, pageHeight - 20);
        
        // Save
        const fileName = `Invoice_${bill.customerName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
        doc.save(fileName);
    };

    // --- RENDER HELPERS ---
    const filteredBills = bills.filter(bill => 
        bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (bill.customerPhone && bill.customerPhone.includes(searchTerm))
    );

    const totalBillAmount = billItems.reduce((sum, item) => sum + (item.qty * item.sellingPrice), 0) + (Number(labourCharge) || 0);

    return (
        <div className="w-full min-h-screen bg-slate-50 p-6 flex flex-col font-sans text-slate-800">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                        <Receipt className="text-blue-600" size={28} />
                        Spare Billing
                    </h1>
                    <p className="text-sm text-slate-500 font-medium mt-1">Manage outbound stock and customer bills for spare parts.</p>
                </div>
                
                {viewMode === 'dashboard' ? (
                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Search Customer..."
                                className="h-10 pl-9 pr-4 rounded-xl bg-white border border-slate-200 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-64 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={() => setViewMode('new_bill')}
                            className={`h-10 px-5 ${t.primary} text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all flex items-center gap-2`}
                        >
                            <Plus size={16} /> New Bill
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setViewMode('dashboard')}
                        className="h-10 px-5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold uppercase tracking-widest shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2"
                    >
                        <X size={16} /> Cancel
                    </button>
                )}
            </div>

            {/* --- DASHBOARD VIEW --- */}
            {viewMode === 'dashboard' && (
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden flex-1">
                    {filteredBills.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12">
                            <Receipt size={48} className="mb-4 opacity-30"/>
                            <h3 className="text-lg font-black uppercase text-slate-500 mb-1">No Bills Found</h3>
                            <p className="text-sm font-medium">Create a new bill to see it here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Items Billed</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Payment</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Total Amount</th>
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBills.map((bill) => (
                                        <tr key={bill._id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors group">
                                            <td className="py-4 px-6">
                                                <span className="text-sm font-bold text-slate-600">
                                                    {new Date(bill.createdAt).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800">{bill.customerName}</span>
                                                    {bill.customerPhone && <span className="text-xs font-semibold text-slate-400">{bill.customerPhone}</span>}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-0.5">
                                                    {bill.items.map((item, idx) => (
                                                        <span key={idx} className="text-xs font-semibold text-slate-600">
                                                            {item.qty}x {item.name}
                                                        </span>
                                                    ))}
                                                    {bill.labourCharge > 0 && (
                                                        <span className="text-xs font-bold text-slate-500 mt-1">
                                                            + Labour: ₹{bill.labourCharge} ({bill.labourRemark || 'No remark'})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                                    bill.paymentMethod === 'Cash' ? 'bg-emerald-100 text-emerald-700' :
                                                    bill.paymentMethod === 'UPI' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-purple-100 text-purple-700'
                                                }`}>
                                                    {bill.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <span className="text-sm font-mono font-black text-slate-800">₹ {bill.totalAmount.toLocaleString()}</span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handlePrintBill(bill)}
                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Download PDF"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteBill(bill._id)}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete Bill & Restore Stock"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* --- NEW BILL VIEW --- */}
            {viewMode === 'new_bill' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Customer Details & Form */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Customer Info Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                                <User size={16}/> Customer Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Customer Name *</label>
                                    <input 
                                        type="text" 
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                                        placeholder="e.g. Rahul Kumar"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Phone Number</label>
                                    <input 
                                        type="text" 
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Add Items Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-visible">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                                <Layers size={16}/> Add Spares to Bill
                            </h3>
                            
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Category</label>
                                        <select 
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-blue-500 bg-white"
                                        >
                                            <option value="">-- Select Category --</option>
                                            {availableCategories.map(cat => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Spare Part</label>
                                        <select 
                                            value={selectedSpareId}
                                            onChange={(e) => setSelectedSpareId(e.target.value)}
                                            disabled={!selectedCategory || availableSpares.length === 0}
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                                        >
                                            <option value="">-- Select Item --</option>
                                            {availableSpares.map(spare => (
                                                <option key={spare._id} value={spare._id}>{spare.name} (Qty: {spare.qty})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Quantity</label>
                                        <input 
                                            type="number" 
                                            min="1"
                                            value={selectedSpareQty}
                                            onChange={(e) => setSelectedSpareQty(e.target.value)}
                                            className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-blue-600 uppercase block mb-1.5">Selling Price (₹)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            value={selectedSparePrice}
                                            onChange={(e) => setSelectedSparePrice(e.target.value)}
                                            className="w-full h-11 px-4 rounded-xl border-2 border-blue-100 font-mono font-bold text-blue-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-blue-50 focus:bg-white transition-all"
                                            placeholder="Dynamic Price"
                                        />
                                    </div>
                                    <div>
                                        <button 
                                            onClick={handleAddItemToBill}
                                            disabled={!selectedSpareId}
                                            className="w-full h-11 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                        >
                                            <Plus size={14}/> Add Item
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Bill Summary & Checkout */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sticky top-6">
                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 mb-6 flex items-center gap-2">
                                <IndianRupee className="text-emerald-500"/> Bill Summary
                            </h3>

                            <div className="min-h-[150px] max-h-[300px] overflow-y-auto pr-2 mb-6 space-y-3">
                                {billItems.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase py-8 border-2 border-dashed border-slate-100 rounded-xl">
                                        No items added
                                    </div>
                                ) : (
                                    billItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-bold text-slate-800 leading-tight">{item.name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                                    {item.qty} x ₹{item.sellingPrice}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 ml-3">
                                                <span className="text-sm font-mono font-black text-slate-800">
                                                    ₹{(item.qty * item.sellingPrice).toLocaleString()}
                                                </span>
                                                <button 
                                                    onClick={() => handleRemoveItemFromBill(idx)}
                                                    className="text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                                <div className="border-t border-slate-100 pt-5 space-y-4">
                                {isLabourChargeAdded ? (
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                                        <button 
                                            onClick={() => {
                                                setIsLabourChargeAdded(false);
                                                setLabourCharge('');
                                                setLabourRemark('');
                                            }}
                                            className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Remove Labour Charge"
                                        >
                                            <X size={16}/>
                                        </button>
                                        <h4 className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Labour Details</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Amount (₹)</label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    value={labourCharge}
                                                    onChange={(e) => setLabourCharge(e.target.value)}
                                                    className="w-full h-10 px-3 rounded-xl border border-slate-200 font-mono font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white transition-all"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Remark</label>
                                                <input 
                                                    type="text" 
                                                    value={labourRemark}
                                                    onChange={(e) => setLabourRemark(e.target.value)}
                                                    className="w-full h-10 px-3 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white transition-all"
                                                    placeholder="Optional"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsLabourChargeAdded(true)}
                                        className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-500 rounded-xl font-bold uppercase text-xs hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex justify-center items-center gap-2"
                                    >
                                        <Plus size={14}/> Add Labour Charge
                                    </button>
                                )}
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Amount</span>
                                    <span className="text-2xl font-black text-emerald-600 font-mono tracking-tight">₹{totalBillAmount.toLocaleString()}</span>
                                </div>
                                
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Payment Method</label>
                                    <select 
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 outline-none focus:border-emerald-500 bg-white"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>

                                <button 
                                    onClick={handleCreateBill}
                                    disabled={submitting || billItems.length === 0 || !customerName.trim()}
                                    className={`w-full h-14 mt-2 ${t.primary} text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-500/30 hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2`}
                                >
                                    {submitting ? 'Processing...' : <><CheckCircle2 size={18}/> Generate Bill</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpareBilling;
