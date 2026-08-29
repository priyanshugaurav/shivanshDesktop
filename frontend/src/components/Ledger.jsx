import React, { useState } from 'react';
import { BookOpen, FileText } from 'lucide-react';
import LegacyLedger from './LegacyLedger';
import JournalEntry from './JournalEntry';

const Ledger = ({ theme }) => {
  const [activeTab, setActiveTab] = useState('cash_book'); // 'cash_book' or 'journal'

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300">
      {/* Top Level Navigation Tabs */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0 z-10">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2 mb-4">
          <BookOpen className={`h-6 w-6 ${theme?.text || 'text-emerald-600'}`} />
          Accounting & Finance
        </h1>
        
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          <button 
            onClick={() => setActiveTab('cash_book')}
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'cash_book' 
                ? 'bg-white shadow-sm text-slate-800' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen className="h-4 w-4" /> Cash Book (Legacy)
          </button>
          <button 
            onClick={() => setActiveTab('journal')}
            className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'journal' 
                ? 'bg-white shadow-sm text-slate-800' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="h-4 w-4" /> Journal Entry (Double-Entry)
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50">
        <div className="p-6 h-full">
            {activeTab === 'cash_book' && <LegacyLedger theme={theme} />}
            {activeTab === 'journal' && <JournalEntry theme={theme} />}
        </div>
      </div>
    </div>
  );
};

export default Ledger;
