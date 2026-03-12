import React from 'react';
import { CheckCircle, Archive, Search } from 'lucide-react';

const ClosedEnquiry = ({ theme }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Header */}
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Closed Enquiries</h1>
                    <p className="text-xs text-slate-500 mt-1">History of resolved and archived conversations.</p>
                </div>
                
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search archives..." 
                        className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-gray-400 transition-colors shadow-sm"
                    />
                </div>
            </div>

            {/* Placeholder Content */}
            <div className={`w-full h-64 border-2 border-dashed ${theme.border} bg-gray-50/50 rounded-xl flex flex-col items-center justify-center text-center p-8`}>
                <div className={`h-12 w-12 rounded-full ${theme.light} flex items-center justify-center mb-3`}>
                    <CheckCircle className={`h-6 w-6 ${theme.text}`} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Archive Empty</h3>
                <p className="text-xs text-gray-500 max-w-sm mt-1">
                    Waiting for data logic. I can add a table here with Date Resolved, Resolution Notes, and Customer Name.
                </p>
            </div>
        </div>
    );
};

export default ClosedEnquiry;