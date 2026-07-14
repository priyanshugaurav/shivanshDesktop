import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Receipt, X, Trash2, CheckCircle2, User, Phone, IndianRupee, Layers, Printer, Download, Filter, Eye } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const SpareBilling = ({ theme: t }) => {
    // --- STATE ---
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'new_bill'
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filterFromDate, setFilterFromDate] = useState('');
    const [filterToDate, setFilterToDate] = useState('');

    // New Bill State
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerVillage, setCustomerVillage] = useState('');
    const [viewPdfDataUrl, setViewPdfDataUrl] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);

    // Labour for new bill
    const [labourList, setLabourList] = useState([]);
    const [labourAmount, setLabourAmount] = useState('');
    const [labourRemark, setLabourRemark] = useState('');

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

    const [isFreeService, setIsFreeService] = useState(false);
    const [serviceNumber, setServiceNumber] = useState('');
    const [selectedSpareDiscount, setSelectedSpareDiscount] = useState('');
    const [labourDiscount, setLabourDiscount] = useState('');

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
        const existingItemIndex = billItems.findIndex(item => item.stockId === spare._id && (item.discount || 0) === (Number(selectedSpareDiscount) || 0));
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
                    sellingPrice: Number(selectedSparePrice),
                    discount: Number(selectedSpareDiscount) || 0
                }
            ]);
        }

        // Reset selection inputs
        setSelectedSpareQty(1);
        setSelectedSpareDiscount('');
    };

    const handleRemoveItemFromBill = (index) => {
        const updatedItems = [...billItems];
        updatedItems.splice(index, 1);
        setBillItems(updatedItems);
    };

    const handleCreateBill = async () => {
        if (!customerName.trim()) return alert("Customer Name is required.");
        if (billItems.length === 0) return alert("Please add at least one item to the bill.");

        const itemsTotal = billItems.reduce((sum, item) => sum + (item.qty * item.sellingPrice * (1 - (item.discount || 0) / 100)), 0);
        let labourTotal = 0;
        if (!(isFreeService && serviceNumber)) {
            labourTotal = labourList.reduce((sum, l) => sum + ((Number(l.amount) || 0) * (1 - (l.discount || 0) / 100)), 0);
        }
        const totalAmount = itemsTotal + labourTotal;

        setSubmitting(true);
        try {
            const payload = {
                customerName,
                customerPhone,
                customerVillage,
                items: billItems,
                paymentMethod,
                totalAmount,
                labourList,
                isFreeService,
                serviceNumber,
                createdAt: billDate
            };

            await axios.post(`${API_URL}/spare-bills`, payload, getAuthHeader());

            // Reset form
            setCustomerName('');
            setCustomerPhone('');
            setCustomerVillage('');
            setBillItems([]);
            setLabourList([]);
            setLabourAmount('');
            setLabourRemark('');
            setLabourDiscount('');
            setIsFreeService(false);
            setServiceNumber('');
            setBillDate(new Date().toISOString().split('T')[0]);
            setBillItems([]);
            setSelectedCategory('');
            setSelectedSpareDiscount('');

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

    const generatePdf = (bill) => {
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
        doc.text("INVOICE", 145, 28); // Shifted text slightly right

        // Brand Name (Left)
        doc.setFontSize(18); // Reduced to prevent overlap
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
        let yOffset = 61;
        if (bill.customerPhone) {
            doc.text(`Phone: ${bill.customerPhone}`, 14, yOffset);
            yOffset += 5;
        }
        if (bill.customerVillage) {
            doc.text(`Village: ${bill.customerVillage}`, 14, yOffset);
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
            const itemDiscount = item.discount || 0;
            const discountedPrice = item.sellingPrice * (1 - itemDiscount / 100);
            const rowTotal = item.qty * discountedPrice;
            subTotal += rowTotal;
            let description = item.name;
            if (itemDiscount > 0) description += ` (${itemDiscount}% Off)`;
            tableRows.push([
                index + 1,
                description,
                `Rs. ${item.sellingPrice.toLocaleString()}`,
                item.qty.toString(),
                `Rs. ${rowTotal.toLocaleString()}`
            ]);
        });

        let labourIndex = bill.items.length + 1;
        const freeServiceMode = bill.isFreeService && bill.serviceNumber;
        if (bill.labourCharge > 0) {
            const rowTotal = freeServiceMode ? 0 : bill.labourCharge;
            subTotal += rowTotal;
            let desc = `Labour Charge: ${bill.labourRemark || ''}`;
            if (freeServiceMode) desc += ` (Free Service ${bill.serviceNumber})`;
            tableRows.push([
                labourIndex++,
                desc,
                "-",
                "-",
                `Rs. ${rowTotal.toLocaleString()}`
            ]);
        }
        if (bill.labourList && bill.labourList.length > 0) {
            bill.labourList.forEach(l => {
                const lDisc = l.discount || 0;
                let rowTotal = l.amount * (1 - lDisc / 100);
                if (freeServiceMode) rowTotal = 0;
                subTotal += rowTotal;
                let desc = `Labour: ${l.remark}`;
                if (freeServiceMode) desc += ` (Free Service ${bill.serviceNumber})`;
                else if (lDisc > 0) desc += ` (${lDisc}% Off)`;
                tableRows.push([
                    labourIndex++,
                    desc,
                    "-",
                    "-",
                    `Rs. ${rowTotal.toLocaleString()}`
                ]);
            });
        }

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 70,
            theme: 'plain',
            headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
            bodyStyles: { textColor: darkText },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            styles: { fontSize: 9, cellPadding: 5 }, // Reduced padding slightly to prevent wrap
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

        doc.setFont('helvetica', 'normal');
        doc.text(`Rs. ${subTotal.toLocaleString()}`, 160, finalY + 15);

        // Yellow Total Box
        doc.setFillColor(...primaryColor);
        doc.rect(rightColX - 5, finalY + 22, 85, 12, 'F');

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text("Total:", rightColX, finalY + 30);
        doc.text(`Rs. ${bill.totalAmount.toLocaleString()}`, 160, finalY + 30);

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
        return doc;
    };

    const handlePrintBill = (bill) => {
        const doc = generatePdf(bill);
        const fileName = `Invoice_${bill.customerName.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
        doc.save(fileName);
    };

    const handleViewBill = (bill) => {
        const doc = generatePdf(bill);
        setViewPdfDataUrl(doc.output('datauristring'));
    };

    // --- RENDER HELPERS ---
    const filteredBills = bills.filter(bill => {
        const matchSearch = bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (bill.customerPhone && bill.customerPhone.includes(searchTerm));

        let matchDate = true;
        if (filterFromDate || filterToDate) {
            const billDate = new Date(bill.createdAt);
            billDate.setHours(0, 0, 0, 0);

            if (filterFromDate) {
                const from = new Date(filterFromDate);
                from.setHours(0, 0, 0, 0);
                if (billDate < from) matchDate = false;
            }
            if (filterToDate) {
                const to = new Date(filterToDate);
                to.setHours(23, 59, 59, 999);
                if (billDate > to) matchDate = false;
            }
        }
        return matchSearch && matchDate;
    });

    const handleExportExcel = () => {
        if (filteredBills.length === 0) return alert("No bills to export.");

        const data = filteredBills.map(bill => {
            const listLabourSum = (bill.labourList || []).reduce((s, l) => s + l.amount, 0);
            const listLabourRemark = (bill.labourList || []).map(l => `${l.remark} (${l.amount})`).join(', ');
            return {
                "Date": new Date(bill.createdAt).toLocaleDateString(),
                "Customer Name": bill.customerName,
                "Phone": bill.customerPhone || 'N/A',
                "Items Billed": bill.items.map(i => `${i.qty}x ${i.name}`).join(', '),
                "Payment Method": bill.paymentMethod,
                "Total Amount (Rs.)": bill.totalAmount,
                "Labour Charge (Rs.)": (bill.labourCharge || 0) + listLabourSum,
                "Labour Remark": [bill.labourRemark, listLabourRemark].filter(Boolean).join(' | ')
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Spare_Bills");
        XLSX.writeFile(workbook, `Spare_Bills_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
    };

    const totalBillAmount = billItems.reduce((sum, item) => sum + (item.qty * item.sellingPrice * (1 - (item.discount || 0) / 100)), 0) + ((isFreeService && serviceNumber) ? 0 : labourList.reduce((sum, l) => sum + ((Number(l.amount) || 0) * (1 - (l.discount || 0) / 100)), 0));

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
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Customer..."
                                className="h-10 pl-9 pr-4 rounded-xl bg-white border border-slate-200 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-48 lg:w-64 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-10 px-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2 border ${showFilters ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                            title="Filter by Date"
                        >
                            <Filter size={16} /> <span className="hidden lg:inline">Filter</span>
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="h-10 px-4 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2"
                            title="Download Excel"
                        >
                            <Download size={16} /> <span className="hidden lg:inline">Export</span>
                        </button>
                        <button
                            onClick={() => setViewMode('new_bill')}
                            className={`h-10 px-5 ${t.primary} text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all flex items-center gap-2`}
                        >
                            <Plus size={16} /> <span className="hidden lg:inline">New Bill</span>
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

            {/* Filters Row */}
            {viewMode === 'dashboard' && showFilters && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex gap-4 items-end animate-in slide-in-from-top-2">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">From Date</label>
                        <input
                            type="date"
                            value={filterFromDate}
                            onChange={(e) => setFilterFromDate(e.target.value)}
                            className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">To Date</label>
                        <input
                            type="date"
                            value={filterToDate}
                            onChange={(e) => setFilterToDate(e.target.value)}
                            className="h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 outline-none focus:border-blue-500"
                        />
                    </div>
                    <button
                        onClick={() => { setFilterFromDate(''); setFilterToDate(''); }}
                        className="h-10 px-4 text-slate-500 hover:text-red-500 text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            )}

            {/* --- DASHBOARD VIEW --- */}
            {viewMode === 'dashboard' && (
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden flex-1">
                    {filteredBills.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12">
                            <Receipt size={48} className="mb-4 opacity-30" />
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
                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Qty</th>
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
                                                            {item.name}
                                                        </span>
                                                    ))}
                                                    {bill.labourCharge > 0 && (
                                                        <span className="text-xs font-bold text-slate-500 mt-1">
                                                            + Labour: ₹{bill.labourCharge} ({bill.labourRemark || 'No remark'})
                                                        </span>
                                                    )}
                                                    {bill.labourList && bill.labourList.map((l, i) => (
                                                        <span key={`l-${i}`} className="text-xs font-bold text-slate-500 mt-1">
                                                            + Labour: ₹{l.amount} ({l.remark})
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <div className="flex flex-col gap-0.5 items-center">
                                                    {bill.items.map((item, idx) => (
                                                        <span key={idx} className="text-xs font-bold text-slate-600 bg-slate-100 px-2 rounded-md">
                                                            {item.qty}
                                                        </span>
                                                    ))}
                                                    {bill.labourCharge > 0 && (
                                                        <span className="text-xs font-bold text-slate-400 mt-1">-</span>
                                                    )}
                                                    {bill.labourList && bill.labourList.map((l, i) => (
                                                        <span key={`l-qty-${i}`} className="text-xs font-bold text-slate-400 mt-1">-</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${bill.paymentMethod === 'Cash' ? 'bg-emerald-100 text-emerald-700' :
                                                    bill.paymentMethod === 'UPI' ? 'bg-blue-100 text-blue-700' :
                                                        bill.paymentMethod === 'Bank Transfer' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-slate-100 text-slate-700'
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
                                                        onClick={() => handleViewBill(bill)}
                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="View PDF"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
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
                                <User size={16} /> Customer Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Village</label>
                                    <input
                                        type="text"
                                        value={customerVillage}
                                        onChange={(e) => setCustomerVillage(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Bill Date</label>
                                    <input
                                        type="date"
                                        value={billDate}
                                        onChange={(e) => setBillDate(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                                    />
                                </div>
                                <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-4 mt-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 cursor-pointer">
                                        <input type="checkbox" checked={isFreeService} onChange={(e) => setIsFreeService(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                                        Free Service
                                    </label>
                                    {isFreeService && (
                                        <select
                                            value={serviceNumber}
                                            onChange={(e) => setServiceNumber(e.target.value)}
                                            className="h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 outline-none bg-white flex-1"
                                        >
                                            <option value="">-- Select Service No. --</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => <option key={n} value={n}>Service {n}</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Add Items Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-visible">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                                <Layers size={16} /> Add Spares to Bill
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

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                                        <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-1.5">Discount (%)</label>
                                        <input
                                            type="number"
                                            min="0" max="100"
                                            value={selectedSpareDiscount}
                                            onChange={(e) => setSelectedSpareDiscount(e.target.value)}
                                            className="w-full h-11 px-4 rounded-xl border-2 border-emerald-100 font-mono font-bold text-emerald-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-emerald-50 focus:bg-white transition-all"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <button
                                            onClick={handleAddItemToBill}
                                            disabled={!selectedSpareId}
                                            className="w-full h-11 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                        >
                                            <Plus size={14} /> Add Item
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Add Labour Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-visible">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                                <Plus size={16} /> Add Labour to Bill
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Amount (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={labourAmount}
                                        onChange={(e) => setLabourAmount(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                                        placeholder="e.g. 500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Remark</label>
                                    <input
                                        type="text"
                                        value={labourRemark}
                                        onChange={(e) => setLabourRemark(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"
                                        placeholder="e.g. Engine Oil Change"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-1.5">Discount (%)</label>
                                    <input
                                        type="number"
                                        min="0" max="100"
                                        value={labourDiscount}
                                        onChange={(e) => setLabourDiscount(e.target.value)}
                                        className="w-full h-11 px-4 rounded-xl border-2 border-emerald-100 font-mono font-bold text-emerald-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-emerald-50 focus:bg-white transition-all"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <button
                                        onClick={() => {
                                            if (!labourAmount || isNaN(labourAmount) || labourAmount <= 0) return alert("Please enter a valid amount");
                                            if (!labourRemark.trim()) return alert("Please enter a remark");
                                            setLabourList([...labourList, { amount: Number(labourAmount), remark: labourRemark, discount: Number(labourDiscount) || 0 }]);
                                            setLabourAmount('');
                                            setLabourRemark('');
                                            setLabourDiscount('');
                                        }}
                                        disabled={!labourAmount || !labourRemark.trim()}
                                        className="w-full h-11 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> Add Labour
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Bill Summary & Checkout */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 p-6 sticky top-6">
                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-800 mb-6 flex items-center gap-2">
                                <IndianRupee className="text-emerald-500" /> Bill Summary
                            </h3>

                            <div className="min-h-[150px] max-h-[300px] overflow-y-auto pr-2 mb-6 space-y-3">
                                {billItems.length === 0 && labourList.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase py-8 border-2 border-dashed border-slate-100 rounded-xl">
                                        No items added
                                    </div>
                                ) : (
                                    <>
                                        {billItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-bold text-slate-800 leading-tight">{item.name} {item.discount > 0 && <span className="text-[10px] text-emerald-600 ml-1">(-{item.discount}%)</span>}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                                                        {item.qty} x ₹{item.sellingPrice}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 ml-3">
                                                    <span className="text-sm font-mono font-black text-slate-800">
                                                        ₹{((item.qty * item.sellingPrice) * (1 - (item.discount || 0) / 100)).toLocaleString()}
                                                    </span>
                                                    <button
                                                        onClick={() => handleRemoveItemFromBill(idx)}
                                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {labourList.map((labour, idx) => (
                                            <div key={`labour-${idx}`} className="flex justify-between items-start p-3 bg-blue-50 rounded-xl border border-blue-100 group">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-bold text-blue-800 leading-tight">Labour: {labour.remark} {labour.discount > 0 && <span className="text-[10px] text-emerald-600 ml-1">(-{labour.discount}%)</span>}</h4>
                                                </div>
                                                <div className="flex flex-col items-end gap-2 ml-3">
                                                    <span className={`text-sm font-mono font-black ${(isFreeService && serviceNumber) ? 'text-emerald-500 line-through' : 'text-blue-800'}`}>
                                                        ₹{(labour.amount * (1 - (labour.discount || 0) / 100)).toLocaleString()}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            const newList = [...labourList];
                                                            newList.splice(idx, 1);
                                                            setLabourList(newList);
                                                        }}
                                                        className="text-blue-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>

                            <div className="border-t border-slate-100 pt-5 space-y-4">
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
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleCreateBill}
                                    disabled={submitting || billItems.length === 0 || !customerName.trim()}
                                    className={`w-full h-14 mt-2 ${t.primary} text-white rounded-xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-500/30 hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-2`}
                                >
                                    {submitting ? 'Processing...' : <><CheckCircle2 size={18} /> Generate Bill</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {viewPdfDataUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100">
                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Bill Preview</h3>
                            <button onClick={() => setViewPdfDataUrl(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 p-0 rounded-b-2xl overflow-hidden">
                            <iframe src={viewPdfDataUrl} className="w-full h-full border-none" title="PDF Preview"></iframe>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpareBilling;
