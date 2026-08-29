import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Plus, Trash2, IndianRupee, Search, RefreshCw, AlertCircle, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const JournalEntry = ({ theme }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    transactionType: 'Journal Adjustment',
    description: '',
    partyName: '',
    paymentMode: 'N/A',
    referenceNo: '',
  });

  const [lines, setLines] = useState([
    { id: 1, accountName: '', accountType: 'Asset', debit: '', credit: '', narration: '' },
    { id: 2, accountName: '', accountType: 'Asset', debit: '', credit: '', narration: '' }
  ]);

  const transactionTypes = [
    'Vehicle Purchase', 'Vehicle Sale', 'Customer Advance', 'Customer Payment',
    'Customer Refund', 'Supplier Payment', 'Spare Parts Purchase', 'Spare Parts Sale',
    'Accessories', 'Service/Repair', 'Salary', 'Rent', 'Electricity', 'Fuel',
    'Transportation', 'Insurance', 'RTO/Registration', 'Loan Received',
    'Loan Repayment', 'Interest', 'Bank Charges', 'Tax/GST Payment',
    'Other Income', 'Other Expense', 'Journal Adjustment', 'Contra'
  ];

  const accountTypes = ['Asset', 'Liability', 'Income', 'Expense', 'Equity'];

  // Auth Header Helper
  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: token } };
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/journal`, getAuthHeader());
      setEntries(res.data);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const totalDebit = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleAddLine = () => {
    setLines([...lines, { id: Date.now(), accountName: '', accountType: 'Asset', debit: '', credit: '', narration: '' }]);
  };

  const handleRemoveLine = (id) => {
    if (lines.length <= 2) return; // Minimum 2 lines required
    setLines(lines.filter(l => l.id !== id));
  };

  const handleLineChange = (id, field, value) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        const updatedLine = { ...line, [field]: value };
        // If entering debit, clear credit and vice versa
        if (field === 'debit' && value !== '') updatedLine.credit = '';
        if (field === 'credit' && value !== '') updatedLine.debit = '';
        return updatedLine;
      }
      return line;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!formData.description) return alert("Description is required");
    if (!isBalanced) return alert("Journal entry is not balanced. Total Debits must equal Total Credits.");
    if (totalDebit === 0) return alert("Total amount cannot be zero.");
    
    const invalidLines = lines.some(l => !l.accountName || (!l.debit && !l.credit));
    if (invalidLines) return alert("All lines must have an account name and an amount.");

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        lines: lines.map(({ accountName, accountType, debit, credit, narration }) => ({
          accountName,
          accountType,
          debit: Number(debit || 0),
          credit: Number(credit || 0),
          narration
        })),
        totalAmount: totalDebit
      };

      await axios.post(`${API_URL}/journal`, payload, getAuthHeader());
      
      setShowModal(false);
      // Reset Form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        transactionType: 'Journal Adjustment',
        description: '',
        partyName: '',
        paymentMode: 'N/A',
        referenceNo: '',
      });
      setLines([
        { id: 1, accountName: '', accountType: 'Asset', debit: '', credit: '', narration: '' },
        { id: 2, accountName: '', accountType: 'Asset', debit: '', credit: '', narration: '' }
      ]);
      
      fetchEntries();
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEntry = async (id) => {
    const reason = prompt("Enter reason for cancelling this voucher:");
    if (!reason) return;
    
    try {
      await axios.put(`${API_URL}/journal/${id}/cancel`, { cancelledReason: reason }, getAuthHeader());
      fetchEntries();
    } catch (error) {
      alert('Error cancelling entry');
    }
  };

  const filteredEntries = entries.filter(e => 
    e.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.transactionType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Journal Entries
          </h2>
          <p className="text-sm text-slate-500 mt-1">Double-entry accounting records (Vouchers)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search vouchers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 w-64"
            />
          </div>
          <button onClick={fetchEntries} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors" title="Refresh">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setShowModal(true)} className={`px-4 py-2 rounded-lg text-sm font-bold text-white shadow-md transition-all flex items-center gap-2 ${theme?.primary || 'bg-blue-600'}`}>
            <Plus className="h-4 w-4" /> New Entry
          </button>
        </div>
      </div>

      {/* Entries List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 font-bold">Voucher No</th>
                <th className="px-6 py-4 font-bold">Date</th>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Description / Details</th>
                <th className="px-6 py-4 font-bold text-right">Amount</th>
                <th className="px-6 py-4 font-bold text-center">Status</th>
                <th className="px-6 py-4 font-bold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">Loading entries...</td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
                      <p className="font-medium">No journal entries found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <React.Fragment key={entry._id}>
                    <tr className={`hover:bg-slate-50/50 transition-colors group ${entry.status === 'Cancelled' ? 'opacity-50 bg-slate-50' : ''}`}>
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-slate-700">{entry.voucherNo}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {new Date(entry.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wide">
                          {entry.transactionType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-800 font-semibold">{entry.description}</div>
                        {entry.partyName && <div className="text-xs text-slate-500 mt-0.5">Party: {entry.partyName}</div>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-bold text-slate-800">₹{entry.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {entry.status === 'Posted' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-md">
                            <CheckCircle2 className="h-3 w-3" /> Posted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-bold bg-rose-50 px-2 py-1 rounded-md">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {entry.status === 'Posted' && (
                          <button 
                            onClick={() => handleCancelEntry(entry._id)}
                            className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                    {/* Render Lines underneath */}
                    <tr className={`${entry.status === 'Cancelled' ? 'opacity-50' : ''} bg-slate-50/30`}>
                      <td colSpan="7" className="px-6 py-3 border-b border-slate-100">
                        <div className="pl-12 pr-6">
                          <table className="w-full text-xs text-slate-600">
                            <tbody>
                              {entry.lines.map((line, idx) => (
                                <tr key={idx} className="border-b border-dashed border-slate-200 last:border-0">
                                  <td className="py-1.5 w-1/3">
                                    <span className="font-semibold text-slate-700">{line.accountName}</span>
                                    <span className="text-[9px] text-slate-400 ml-2 uppercase">({line.accountType})</span>
                                  </td>
                                  <td className="py-1.5 w-1/3 text-slate-500 italic">{line.narration}</td>
                                  <td className="py-1.5 text-right w-1/6 font-mono text-emerald-600">
                                    {line.debit > 0 ? `₹${line.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Dr)` : ''}
                                  </td>
                                  <td className="py-1.5 text-right w-1/6 font-mono text-rose-600">
                                    {line.credit > 0 ? `₹${line.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Cr)` : ''}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {entry.cancelledReason && (
                            <div className="mt-2 text-xs text-rose-600 font-medium bg-rose-50 p-2 rounded">
                              Cancelled Reason: {entry.cancelledReason}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Journal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-8">
            <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${theme?.light || 'bg-slate-50'}`}>
              <h2 className={`text-lg font-bold flex items-center gap-2 ${theme?.text || 'text-slate-800'}`}>
                <FileText className="h-5 w-5" /> New Journal Entry
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              
              {/* Top Meta Data */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Transaction Type</label>
                  <select value={formData.transactionType} onChange={e => setFormData({...formData, transactionType: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {transactionTypes.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Description / Memo</label>
                  <input type="text" placeholder="General description for this voucher..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Party Name (Optional)</label>
                  <input type="text" placeholder="Customer / Supplier" value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Mode</label>
                  <select value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['N/A', 'Cash', 'Bank', 'UPI', 'Cheque', 'Bank Transfer'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Reference / Invoice No</label>
                  <input type="text" placeholder="Ref No..." value={formData.referenceNo} onChange={e => setFormData({...formData, referenceNo: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Journal Lines */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-slate-700">Accounting Entries</h3>
                  <button type="button" onClick={handleAddLine} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Add Line
                  </button>
                </div>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2 font-bold text-slate-500 text-xs w-1/3">Account Name</th>
                        <th className="px-4 py-2 font-bold text-slate-500 text-xs w-1/6">Type</th>
                        <th className="px-4 py-2 font-bold text-slate-500 text-xs">Narration</th>
                        <th className="px-4 py-2 font-bold text-slate-500 text-xs w-32 text-right text-emerald-600">Debit (Dr)</th>
                        <th className="px-4 py-2 font-bold text-slate-500 text-xs w-32 text-right text-rose-600">Credit (Cr)</th>
                        <th className="px-4 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lines.map((line, idx) => (
                        <tr key={line.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2">
                            <input 
                              type="text" 
                              placeholder="e.g. Cash, Sales"
                              value={line.accountName}
                              onChange={e => handleLineChange(line.id, 'accountName', e.target.value)}
                              className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 rounded text-sm font-semibold outline-none transition-colors"
                              required
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select 
                              value={line.accountType}
                              onChange={e => handleLineChange(line.id, 'accountType', e.target.value)}
                              className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 rounded text-xs outline-none transition-colors"
                            >
                              {accountTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input 
                              type="text" 
                              placeholder="Line detail..."
                              value={line.narration}
                              onChange={e => handleLineChange(line.id, 'narration', e.target.value)}
                              className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 rounded text-xs outline-none transition-colors"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              value={line.debit}
                              onChange={e => handleLineChange(line.id, 'debit', e.target.value)}
                              className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 rounded text-sm text-right font-mono font-bold text-emerald-600 outline-none transition-colors"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              value={line.credit}
                              onChange={e => handleLineChange(line.id, 'credit', e.target.value)}
                              className="w-full px-2 py-1.5 bg-transparent border border-transparent hover:border-slate-200 focus:border-blue-500 rounded text-sm text-right font-mono font-bold text-rose-600 outline-none transition-colors"
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button 
                              type="button"
                              onClick={() => handleRemoveLine(line.id)}
                              disabled={lines.length <= 2}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/80 border-t border-slate-200 font-bold">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right text-slate-600">Total:</td>
                        <td className={`px-4 py-3 text-right font-mono ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                {!isBalanced && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Difference: <strong>₹{Math.abs(totalDebit - totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>. Journal entry must balance before saving.</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} disabled={isSubmitting} className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <div className="flex-1"></div>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !isBalanced || totalDebit === 0} 
                  className={`px-8 py-2 rounded-lg text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${theme?.primary || 'bg-blue-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Posting...
                    </>
                  ) : (
                    'Post Journal Entry'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntry;
