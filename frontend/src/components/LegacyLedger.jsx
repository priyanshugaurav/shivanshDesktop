import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Plus, Trash2, ArrowUpRight, ArrowDownRight, IndianRupee, Search, RefreshCw, AlertCircle, Users, ArrowLeft, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const Ledger = ({ theme }) => {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeView, setActiveView] = useState('all'); // 'all', 'parties', 'partyDetail'
  const [selectedParty, setSelectedParty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'General',
    type: 'Credit',
    amount: '',
    partyName: '',
    paymentMethod: 'Cash'
  });

  const categories = ['General', 'Sales', 'Expense', 'Payroll', 'Asset', 'Liability'];

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/ledger`, { headers: { 'Authorization': token } });
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to fetch ledger:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/customers`, { headers: { 'Authorization': token } });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  useEffect(() => {
    fetchLedger();
    fetchCustomers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || isNaN(formData.amount)) {
      alert('Please fill out description and valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/ledger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          description: '',
          category: 'General',
          type: 'Credit',
          amount: '',
          partyName: '',
          paymentMethod: 'Cash'
        });
        fetchLedger();
      } else {
        const error = await res.json();
        alert(`Error: ${error.message || 'Failed to add entry'}`);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry? This may affect the accuracy of past running balances.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/ledger/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        fetchLedger();
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const currentBalance = transactions.length > 0 ? transactions[0].balance : 0;
  const totalCredits = transactions.filter(t => t.type === 'Credit').reduce((acc, curr) => acc + curr.amount, 0);
  const totalDebits = transactions.filter(t => t.type === 'Debit').reduce((acc, curr) => acc + curr.amount, 0);

  const transactionsWithBalance = useMemo(() => {
    const sortedAsc = [...transactions].reverse();
    let runningBalance = 0;
    const computed = sortedAsc.map(tx => {
      if (tx.type === 'Credit') runningBalance += tx.amount;
      if (tx.type === 'Debit') runningBalance -= tx.amount;
      return { ...tx, computedBalance: runningBalance };
    });
    return computed.reverse();
  }, [transactions]);

  const partiesData = useMemo(() => {
    const parties = {};
    transactions.forEach(tx => {
      const pName = (tx.partyName || '').trim() || 'Unspecified / Manual';
      if (!parties[pName]) {
        parties[pName] = { name: pName, totalCredit: 0, totalDebit: 0, count: 0 };
      }
      if (tx.type === 'Credit') parties[pName].totalCredit += tx.amount;
      if (tx.type === 'Debit') parties[pName].totalDebit += tx.amount;
      parties[pName].count += 1;
    });
    return Object.values(parties).map(p => ({
      ...p,
      balance: p.totalCredit - p.totalDebit
    })).sort((a, b) => b.balance - a.balance);
  }, [transactions]);

  const partySpecificTransactions = useMemo(() => {
    if (!selectedParty) return [];
    const pNameMatches = (tx) => {
      if (selectedParty === 'Unspecified / Manual') return !(tx.partyName || '').trim();
      return (tx.partyName || '').trim() === selectedParty;
    };
    const txs = transactions.filter(pNameMatches);
    const sortedAsc = [...txs].reverse(); 
    let runningBalance = 0;
    const computed = sortedAsc.map(tx => {
      if (tx.type === 'Credit') runningBalance += tx.amount;
      if (tx.type === 'Debit') runningBalance -= tx.amount;
      return { ...tx, partyRunningBalance: runningBalance };
    });
    return computed.reverse();
  }, [transactions, selectedParty]);

  const dateFilter = (t) => {
    if (!startDate && !endDate) return true;
    const txDate = new Date(t.date).getTime();
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() + 86400000 : Infinity; // add 1 day to include end date fully
    return txDate >= start && txDate <= end;
  };

  const filteredTransactions = transactionsWithBalance.filter(t => 
    dateFilter(t) &&
    (t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (t.partyName && t.partyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (t.paymentMethod && t.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredPartyTransactions = partySpecificTransactions.filter(t => 
    dateFilter(t) &&
    (t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (t.paymentMethod && t.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredParties = partiesData.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const dataToRender = activeView === 'partyDetail' ? filteredPartyTransactions : filteredTransactions;

  const displayCredits = dataToRender.filter(t => t.type === 'Credit').reduce((acc, curr) => acc + curr.amount, 0);
  const displayDebits = dataToRender.filter(t => t.type === 'Debit').reduce((acc, curr) => acc + curr.amount, 0);
  const displayBalance = dataToRender.length > 0 
    ? (activeView === 'partyDetail' ? dataToRender[0].partyRunningBalance : dataToRender[0].computedBalance)
    : 0;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Top Accent Line
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, doc.internal.pageSize.width, 6, "F");

    // Company Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("RAJIV TRADERS", 14, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("Official Ledger & Account Statement", 14, 28);
    
    // Statement Title (Right aligned)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("STATEMENT OF ACCOUNT", doc.internal.pageSize.width - 14, 22, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`, doc.internal.pageSize.width - 14, 28, { align: "right" });

    // Divider Line
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(14, 35, doc.internal.pageSize.width - 14, 35);

    // Info Box
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(14, 40, doc.internal.pageSize.width - 28, 25, 3, 3, "F");

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); // slate-600
    
    // Column 1
    doc.setFont("helvetica", "bold");
    doc.text("Account Name:", 20, 48);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(activeView === 'partyDetail' && selectedParty ? selectedParty : "All Transactions (Global)", 52, 48);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("Period:", 20, 56);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    const dateText = (startDate || endDate) ? `${startDate || 'Start'} to ${endDate || 'End'}` : "All Time";
    doc.text(dateText, 52, 56);

    // Column 2 (Summary Math)
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("Total Received:", doc.internal.pageSize.width - 80, 48);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text(`Rs. ${displayCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, doc.internal.pageSize.width - 45, 48);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("Total Paid:", doc.internal.pageSize.width - 80, 54);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(`Rs. ${displayDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, doc.internal.pageSize.width - 45, 54);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Net Balance:", doc.internal.pageSize.width - 80, 60);
    doc.text(`Rs. ${displayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, doc.internal.pageSize.width - 45, 60);

    // Table
    const tableColumn = ["Date", "Description", "Ref/Method", "Credit (In)", "Debit (Out)", "Balance"];
    const tableRows = [];

    const chronologicalData = [...dataToRender].reverse();

    chronologicalData.forEach(tx => {
      const txData = [
        new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        tx.description,
        tx.paymentMethod || 'Cash',
        tx.type === 'Credit' ? tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '',
        tx.type === 'Debit' ? tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '',
        (activeView === 'partyDetail' ? tx.partyRunningBalance : tx.computedBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })
      ];
      tableRows.push(txData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 75,
      styles: { fontSize: 9, font: "helvetica", cellPadding: 4 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        3: { halign: 'right', textColor: [5, 150, 105] }, 
        4: { halign: 'right', textColor: [225, 29, 72] }, 
        5: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] }
      },
      margin: { top: 75 }
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.setFont("helvetica", "normal");
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14, doc.internal.pageSize.height - 15, doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 15);
      
      doc.text("Rajiv Traders - Official Record", 14, doc.internal.pageSize.height - 8);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 8);
    }

    doc.save(`Rajiv_Traders_Ledger_${new Date().getTime()}.pdf`);
  };

  const handleExportExcel = () => {
    const wsData = dataToRender.map(tx => ({
      Date: new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      "Party / Account": tx.partyName || '-',
      Description: tx.description,
      Category: tx.category,
      Method: tx.paymentMethod || 'Cash',
      "Credit (In)": tx.type === 'Credit' ? tx.amount : 0,
      "Debit (Out)": tx.type === 'Debit' ? tx.amount : 0,
      Balance: activeView === 'partyDetail' ? tx.partyRunningBalance : tx.computedBalance
    }));
    
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `Ledger_Report_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className={`h-6 w-6 ${theme.text}`} />
            Ledger Book
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage all incoming and outgoing business transactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchLedger} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm transition-colors" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowModal(true)} className={`px-4 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 ${theme.primary}`}>
            <Plus className="h-4 w-4" /> Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Credits (In)</p>
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-1"><IndianRupee className="h-5 w-5" />{displayCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Debits (Out)</p>
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-1"><IndianRupee className="h-5 w-5" />{displayDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border shadow-sm flex items-center gap-4 ${displayBalance >= 0 ? 'bg-slate-900 border-slate-800' : 'bg-rose-600 border-rose-700'}`}>
          <div className="h-12 w-12 rounded-xl bg-white/10 text-white flex items-center justify-center">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-white/70 uppercase">{activeView === 'partyDetail' ? 'Net Balance' : 'Current Balance'}</p>
            <h3 className="text-2xl font-bold text-white flex items-center gap-1"><IndianRupee className="h-5 w-5" />{displayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      {activeView !== 'partyDetail' && (
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveView('all')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeView === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <BookOpen className="h-4 w-4" /> All Transactions
          </button>
          <button 
            onClick={() => setActiveView('parties')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${activeView === 'parties' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users className="h-4 w-4" /> Parties & Accounts
          </button>
        </div>
      )}

      {activeView === 'partyDetail' && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-xl">
           <div className="flex items-center gap-4">
             <button onClick={() => { setActiveView('parties'); setSelectedParty(null); }} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
               <ArrowLeft className="h-4 w-4" />
             </button>
             <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Party Ledger</p>
               <h2 className="text-lg font-bold text-slate-800">{selectedParty}</h2>
             </div>
           </div>
        </div>
      )}

      {/* Parties Grid View */}
      {activeView === 'parties' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParties.map(p => (
            <div 
              key={p.name} 
              onClick={() => { setSelectedParty(p.name); setActiveView('partyDetail'); }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-slate-800 truncate">{p.name}</h3>
                    <p className="text-xs font-medium text-slate-500">{p.count} Transactions</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Received</p>
                    <p className="text-sm font-bold text-emerald-600">₹{p.totalCredit.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Paid</p>
                    <p className="text-sm font-bold text-rose-600">₹{p.totalDebit.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
              <div className={`rounded-xl p-3 flex items-center justify-between ${p.balance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                <span className="text-xs font-bold uppercase">Net Balance</span>
                <span className="font-bold">₹{p.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          ))}
          {filteredParties.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">No parties found matching your search.</div>
          )}
        </div>
      )}

      {/* Main Table Area for All Transactions & Party Details */}
      {(activeView === 'all' || activeView === 'partyDetail') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search description or category..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="w-full sm:w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-600" 
                title="Start Date"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className="w-full sm:w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-600" 
                title="End Date"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <button onClick={handleExportExcel} className="flex-1 lg:flex-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2">
              <Download className="h-4 w-4" /> Excel
            </button>
            <button onClick={handleExportPDF} className="flex-1 lg:flex-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" /> PDF
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Party / Account</th>
                <th className="px-6 py-4 font-bold">Description</th>
                <th className="px-6 py-4 font-bold">Category</th>
                <th className="px-6 py-4 font-bold">Method</th>
                <th className="px-6 py-4 font-bold text-right text-emerald-500">Credit (In)</th>
                <th className="px-6 py-4 font-bold text-right text-rose-500">Debit (Out)</th>
                <th className="px-6 py-4 font-bold text-right">Balance</th>
                <th className="px-6 py-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-slate-400 font-medium">Loading transactions...</td>
                </tr>
              ) : dataToRender.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                      <p className="font-medium">No transactions found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                dataToRender.map((tx) => (
                  <tr key={tx._id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={(e) => {
                    if (e.target.closest('button')) return;
                    setFormData({
                      ...formData,
                      partyName: tx.partyName || ''
                    });
                    setShowModal(true);
                  }}>
                    <td className="px-6 py-4 text-slate-600 font-medium">{new Date(tx.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4 text-slate-800 font-semibold">{tx.partyName || '-'}</td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{tx.description}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide">
                        {tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {tx.paymentMethod || 'Cash'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                      {tx.type === 'Credit' ? tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                      {tx.type === 'Debit' ? tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                      {activeView === 'partyDetail' 
                        ? tx.partyRunningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                        : tx.computedBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(tx._id); }} 
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all opacity-0 group-hover:opacity-100"
                        title="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
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

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${theme.light}`}>
              <h2 className={`text-lg font-bold ${theme.text}`}>Add Transaction</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button type="button" onClick={() => setFormData({...formData, type: 'Credit'})} className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${formData.type === 'Credit' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Credit (+)</button>
                    <button type="button" onClick={() => setFormData({...formData, type: 'Debit'})} className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${formData.type === 'Debit' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}>Debit (-)</button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Amount</label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200" required />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Party / Account Name</label>
                <input 
                  type="text" 
                  list="customers-list" 
                  placeholder="Select customer or enter custom name..." 
                  value={formData.partyName} 
                  onChange={e => setFormData({...formData, partyName: e.target.value})} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200" 
                />
                <datalist id="customers-list">
                  {partiesData.map(p => (
                    p.name !== 'Unspecified / Manual' && <option key={`party-${p.name}`} value={p.name} />
                  ))}
                  {customers.map(c => {
                    const fullName = `${c.personal?.firstName || ''} ${c.personal?.lastName || ''}`.trim();
                    return <option key={c._id} value={fullName} />;
                  })}
                </datalist>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Method</label>
                <select 
                  value={formData.paymentMethod} 
                  onChange={e => setFormData({...formData, paymentMethod: e.target.value})} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                  <option value="Cheque">Cheque</option>
                  <option value="VEHICLE IN">VEHICLE IN</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description</label>
                <input type="text" placeholder="e.g., Showroom Rent, Customer Payment..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200" required />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200">
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} disabled={isSubmitting} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 ${theme.primary} disabled:opacity-70 disabled:cursor-not-allowed`}>
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledger;
