import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Plus, Trash2, ArrowUpRight, ArrowDownRight, IndianRupee, Search, RefreshCw, AlertCircle, Users, ArrowLeft, Download, FileText, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const LedgerBook = ({ theme }) => {
  const [transactions, setTransactions] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isAddingParty, setIsAddingParty] = useState(false);
  
  const [activeView, setActiveView] = useState('all'); // 'all', 'parties', 'partyDetail'
  const [selectedPartyId, setSelectedPartyId] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    type: 'Credit',
    transactionPurpose: 'Payment Received',
    category: 'Sales',
    amount: '',
    partyId: '',
    paymentMethod: 'Cash'
  });

  const [newPartyData, setNewPartyData] = useState({
    name: '',
    phone: '',
    type: 'Customer',
    openingBalance: 0,
    balanceType: 'Receivable'
  });

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

  const fetchParties = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/parties`, { headers: { 'Authorization': token } });
      if (res.ok) {
        const data = await res.json();
        setParties(data);
      }
    } catch (error) {
      console.error('Failed to fetch parties:', error);
    }
  };

  useEffect(() => {
    fetchLedger();
    fetchParties();
  }, []);

  const handleAddParty = async (e) => {
    e.preventDefault();
    if (!newPartyData.name) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/parties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(newPartyData)
      });
      if (res.ok) {
        const savedParty = await res.json();
        setParties([...parties, savedParty]);
        setFormData({...formData, partyId: savedParty._id});
        setIsAddingParty(false);
        setNewPartyData({ name: '', phone: '', type: 'Customer', openingBalance: 0, balanceType: 'Receivable' });
        alert('Party created successfully!');
      } else {
        const error = await res.json();
        alert(`Error: ${error.message || 'Failed to save party'}`);
      }
    } catch (error) {
      console.error('Failed to save party', error);
      alert('Failed to connect to server. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || isNaN(formData.amount) || !formData.partyId || !formData.paymentMethod) {
      alert('Please fill out all required fields (Amount, Party, Description, Method).');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      
      const party = parties.find(p => p._id === formData.partyId);
      const payload = {
        ...formData,
        partyName: party ? party.name : ''
      };

      const res = await fetch(`${API_URL}/ledger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          description: '',
          type: 'Credit',
          transactionPurpose: 'Payment Received',
          category: 'Sales',
          amount: '',
          partyId: '',
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
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
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

  // -------------------------------------------------------------
  // CALCULATIONS & COMPUTED DATA
  // -------------------------------------------------------------

  // 1. Calculate Liquid Cash (Cash/Bank balances)
  const liquidCash = transactions.reduce((acc, t) => {
    if (['Cash', 'Bank Transfer', 'UPI'].includes(t.paymentMethod)) {
      if (t.transactionPurpose === 'Payment Received') return acc + t.amount;
      if (t.transactionPurpose === 'Payment Made') return acc - t.amount;
    }
    return acc;
  }, 0);

  // 2. Party Balances Map
  const partiesData = useMemo(() => {
    const pMap = {};
    parties.forEach(p => {
      let initBal = Number(p.openingBalance) || 0;
      if (p.balanceType === 'Payable') initBal = -initBal;
      pMap[p._id] = { ...p, balance: initBal, txCount: 0 };
    });

    // We process chronological from oldest to newest to build running balances
    const chronologicalTxs = [...transactions].reverse();
    
    chronologicalTxs.forEach(tx => {
      if (tx.partyId && pMap[tx.partyId._id || tx.partyId]) {
        const pid = tx.partyId._id || tx.partyId;
        
        let effect = 0;
        // For supplier (payable): Credit Bill = we owe MORE (-), Payment Made = we owe LESS (+)
        // For customer (receivable): Credit Invoice = they owe MORE (+), Payment Received = they owe LESS (-)
        if (tx.transactionPurpose === 'Credit Bill') effect = -tx.amount;    // supplier balance goes negative
        else if (tx.transactionPurpose === 'Payment Made') effect = tx.amount; // reduces supplier payable
        else if (tx.transactionPurpose === 'Credit Invoice') effect = tx.amount; // customer owes more
        else if (tx.transactionPurpose === 'Payment Received') effect = -tx.amount; // customer owes less
        
        pMap[pid].balance += effect;
        pMap[pid].txCount += 1;
        tx.partyRunningBalance = pMap[pid].balance;
      }
    });

    return Object.values(pMap).sort((a, b) => b.balance - a.balance);
  }, [transactions, parties]);

  const totalReceivables = partiesData.filter(p => p.balance > 0).reduce((acc, p) => acc + p.balance, 0);
  const totalPayables = partiesData.filter(p => p.balance < 0).reduce((acc, p) => acc + Math.abs(p.balance), 0);

  // 3. View Filtering
  const selectedPartyObj = partiesData.find(p => p._id === selectedPartyId);
  
  const dateFilter = (t) => {
    if (!startDate && !endDate) return true;
    const txDate = new Date(t.date).getTime();
    const start = startDate ? new Date(startDate).getTime() : 0;
    const end = endDate ? new Date(endDate).getTime() + 86400000 : Infinity;
    return txDate >= start && txDate <= end;
  };

  const filteredTransactions = transactions.filter(t => 
    dateFilter(t) &&
    (t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (t.category && t.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (t.partyName && t.partyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
     (t.paymentMethod && t.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const filteredPartyTransactions = filteredTransactions.filter(t => 
    (t.partyId && (t.partyId._id === selectedPartyId || t.partyId === selectedPartyId))
  );

  const filteredParties = partiesData.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.phone && p.phone.includes(searchTerm))
  );

  const dataToRender = activeView === 'partyDetail' ? filteredPartyTransactions : filteredTransactions;

  // -------------------------------------------------------------
  // DYNAMIC FORM OPTIONS
  // -------------------------------------------------------------
  
  // All purposes available under both Credit and Debit
  // Credit (+) = money GOING OUT of business (NEFT, payments to supplier)
  // Debit  (-) = goods/vehicles RECEIVED on credit (liability created)
  const creditPurposes = ['Payment Made', 'Payment Received'];
  const debitPurposes  = ['Credit Bill', 'Credit Invoice'];
  const purposeOptions = formData.type === 'Credit' ? creditPurposes : debitPurposes;
    
  const categoryOptions = formData.type === 'Credit'
    ? ['Supplier Pay', 'Other Payment', 'Capital Out', 'Loan Repayment']
    : ['Inventory Purchase', 'Vehicle Purchase', 'Capital In', 'Loan Disbursement', 'Other Purchase'];

  // Keep form consistent when type changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      transactionPurpose: prev.type === 'Credit' ? 'Payment Received' : 'Payment Made',
      transactionPurpose: prev.type === 'Credit' ? 'Payment Made' : 'Credit Bill',
      category: prev.type === 'Credit' ? 'Supplier Pay' : 'Vehicle Purchase'
    }));
  }, [formData.type]);

  // -------------------------------------------------------------
  // EXPORT FUNCTIONS
  // -------------------------------------------------------------
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, doc.internal.pageSize.width, 6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text("RAJIV TRADERS", 14, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); 
    doc.text("Official Ledger & Account Statement", 14, 28);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text("STATEMENT OF ACCOUNT", doc.internal.pageSize.width - 14, 22, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, doc.internal.pageSize.width - 14, 28, { align: "right" });

    doc.setDrawColor(226, 232, 240); 
    doc.line(14, 35, doc.internal.pageSize.width - 14, 35);

    doc.setFillColor(248, 250, 252); 
    doc.roundedRect(14, 40, doc.internal.pageSize.width - 28, 25, 3, 3, "F");

    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105); 
    
    doc.setFont("helvetica", "bold");
    doc.text("Account Name:", 20, 48);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    doc.text(activeView === 'partyDetail' && selectedPartyObj ? selectedPartyObj.name : "All Transactions (Global)", 52, 48);

    if (activeView === 'partyDetail' && selectedPartyObj) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(71, 85, 105);
        doc.text("Phone:", 20, 54);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(15, 23, 42);
        doc.text(selectedPartyObj.phone || 'N/A', 52, 54);
    }

    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("Period:", 20, 60);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(15, 23, 42);
    const dateText = (startDate || endDate) ? `${startDate || 'Start'} to ${endDate || 'End'}` : "All Time";
    doc.text(dateText, 52, 60);

    const tableColumn = ["Date", "Description", "Purpose", "Credit (In)", "Debit (Out)", "Balance"];
    const tableRows = [];

    const chronologicalData = [...dataToRender].reverse();

    chronologicalData.forEach(tx => {
      const txData = [
        new Date(tx.date).toLocaleDateString('en-GB'),
        tx.description,
        tx.transactionPurpose,
        tx.type === 'Credit' ? tx.amount.toLocaleString('en-IN') : '',
        tx.type === 'Debit' ? tx.amount.toLocaleString('en-IN') : '',
        (activeView === 'partyDetail' && tx.partyRunningBalance !== undefined ? tx.partyRunningBalance : tx.balance).toLocaleString('en-IN')
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
      }
    });

    doc.save(`Ledger_Report_${new Date().getTime()}.pdf`);
  };

  const handleExportExcel = () => {
    const wsData = dataToRender.map(tx => ({
      Date: new Date(tx.date).toLocaleDateString('en-GB'),
      "Party / Account": tx.partyName || '-',
      Description: tx.description,
      Purpose: tx.transactionPurpose,
      Method: tx.paymentMethod || 'Cash',
      "Credit (In)": tx.type === 'Credit' ? tx.amount : 0,
      "Debit (Out)": tx.type === 'Debit' ? tx.amount : 0,
      Balance: activeView === 'partyDetail' && tx.partyRunningBalance !== undefined ? tx.partyRunningBalance : tx.balance
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `Ledger_Report_${new Date().getTime()}.xlsx`);
  };

  // -------------------------------------------------------------
  // RENDER UI
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className={`h-6 w-6 ${theme ? theme.text : 'text-blue-600'}`} />
            Ledger Book
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage all incoming and outgoing business transactions.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { fetchLedger(); fetchParties(); }} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm transition-colors" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowModal(true)} className={`px-4 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 ${theme ? theme.primary : 'bg-blue-600 hover:bg-blue-700'}`}>
            <Plus className="h-4 w-4" /> Add Transaction
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Liquid Cash/Bank</p>
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-1">₹{liquidCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowDownRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Receivables</p>
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-1">₹{totalReceivables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">Total Payables</p>
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-1">₹{totalPayables.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
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

      {activeView === 'partyDetail' && selectedPartyObj && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 p-4 rounded-xl">
           <div className="flex items-center gap-4">
             <button onClick={() => { setActiveView('parties'); setSelectedPartyId(null); }} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
               <ArrowLeft className="h-4 w-4" />
             </button>
             <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Party Statement: {selectedPartyObj.type}</p>
               <h2 className="text-lg font-bold text-slate-800">{selectedPartyObj.name}</h2>
               {selectedPartyObj.phone && <p className="text-sm text-slate-500">{selectedPartyObj.phone}</p>}
             </div>
           </div>
           <div className={`px-4 py-2 rounded-lg font-bold ${selectedPartyObj.balance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
             Balance: ₹{Math.abs(selectedPartyObj.balance).toLocaleString('en-IN', {minimumFractionDigits: 2})} {selectedPartyObj.balance >= 0 ? '(Cr)' : '(Dr)'}
           </div>
        </div>
      )}

      {/* Parties Grid View */}
      {activeView === 'parties' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParties.map(p => (
            <div 
              key={p._id} 
              onClick={() => { setSelectedPartyId(p._id); setActiveView('partyDetail'); }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="font-bold text-slate-800 truncate">{p.name}</h3>
                    <p className="text-xs font-medium text-slate-500">{p.type} • {p.txCount} Txs</p>
                  </div>
                </div>
              </div>
              <div className={`rounded-xl p-3 flex items-center justify-between ${p.balance >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                <span className="text-xs font-bold uppercase">{p.balance >= 0 ? 'Receivable' : 'Payable'}</span>
                <span className="font-bold">₹{Math.abs(p.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          ))}
          {filteredParties.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400">No parties found matching your search.</div>
          )}
        </div>
      )}

      {/* Main Table Area */}
      {(activeView === 'all' || activeView === 'partyDetail') && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search description, party, purpose..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full sm:w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-600" />
              <span className="text-slate-400 text-xs">to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full sm:w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 text-slate-600" />
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
                {activeView === 'all' && <th className="px-6 py-4 font-bold">Party</th>}
                <th className="px-6 py-4 font-bold">Description</th>
                <th className="px-6 py-4 font-bold">Purpose</th>
                <th className="px-6 py-4 font-bold">Method</th>
                <th className="px-6 py-4 font-bold text-right text-emerald-500">Debit (Dr)</th>
                <th className="px-6 py-4 font-bold text-right text-rose-500">Credit (Cr)</th>
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
                  <tr key={tx._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-slate-600 font-medium">{new Date(tx.date).toLocaleDateString('en-GB')}</td>
                    {activeView === 'all' && <td className="px-6 py-4 text-slate-800 font-semibold">{tx.partyId?.name || tx.partyName || '-'}</td>}
                    <td className="px-6 py-4 text-slate-700 font-medium">{tx.description}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${tx.type === 'Debit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {tx.transactionPurpose || tx.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {tx.paymentMethod || 'Cash'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-emerald-600">
                      {tx.type === 'Debit' ? tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-rose-600">
                      {tx.type === 'Credit' ? tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                      {(activeView === 'partyDetail' && tx.partyRunningBalance !== undefined)
                        ? tx.partyRunningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                        : tx.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleDelete(tx._id)} 
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded transition-all opacity-0 group-hover:opacity-100"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${theme ? theme.light : 'bg-slate-50'}`}>
              <h2 className={`text-lg font-bold ${theme ? theme.text : 'text-slate-800'}`}>Add Transaction</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <div className="overflow-y-auto p-6 flex-1">
              {isAddingParty ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Users size={16}/> New Party / Account</h3>
                    <button type="button" onClick={() => setIsAddingParty(false)} className="text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                  </div>
                  <input type="text" placeholder="Party Name *" value={newPartyData.name} onChange={e=>setNewPartyData({...newPartyData, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Phone (Optional)" value={newPartyData.phone} onChange={e=>setNewPartyData({...newPartyData, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                    <select value={newPartyData.type} onChange={e=>setNewPartyData({...newPartyData, type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                      <option>Customer</option>
                      <option>Supplier</option>
                      <option>Financier</option>
                      <option>Expense</option>
                    </select>
                  </div>
                  <button type="button" onClick={handleAddParty} className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-bold shadow-md hover:bg-slate-700 flex items-center justify-center gap-2"><CheckCircle2 size={16}/> Save Party</button>
                </div>
              ) : null}

              <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200" required />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Type</label>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button type="button" onClick={() => setFormData({...formData, type: 'Debit'})} className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${formData.type === 'Debit' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}>Debit (+)</button>
                      <button type="button" onClick={() => setFormData({...formData, type: 'Credit'})} className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${formData.type === 'Credit' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500'}`}>Credit (-)</button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transaction Purpose</label>
                    <select value={formData.transactionPurpose} onChange={e => setFormData({...formData, transactionPurpose: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200" required>
                      {purposeOptions.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Category</label>
                    <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200">
                      {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Party / Account</label>
                    {!isAddingParty && <button type="button" onClick={() => setIsAddingParty(true)} className="text-[10px] font-bold text-blue-500 hover:text-blue-700">+ Add New</button>}
                  </div>
                  <select 
                    value={formData.partyId} 
                    onChange={e => setFormData({...formData, partyId: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200"
                    required
                  >
                    <option value="" disabled>-- Select Party --</option>
                    {parties.map(p => (
                      <option key={p._id} value={p._id}>{p.name} ({p.type})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Amount</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input type="number" step="0.01" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-200" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Method</label>
                    <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200" required>
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Card">Card</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Credit">Credit (No Payment)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description</label>
                  <textarea 
                    placeholder="Vehicle Chassis #, Invoice #, or Note..." 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-200 resize-none h-20" 
                    required 
                  />
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50">
              <button type="button" onClick={() => setShowModal(false)} disabled={isSubmitting} className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">Cancel</button>
              <button type="submit" form="transaction-form" disabled={isSubmitting} className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 ${theme ? theme.primary : 'bg-blue-600'} disabled:opacity-70 disabled:cursor-not-allowed`}>
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerBook;
