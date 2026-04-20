import React, { useState, useMemo } from 'react';
import { 
    Phone, Calendar, User, Clock, CheckCircle2, 
    AlertCircle, Search, ArrowRight, MoreHorizontal, Filter
} from 'lucide-react';
import { useEnquiries } from '../hooks/useEnquiries';

const Announcement = ({ theme }) => {
    // 1. Fetch data from 'Announcements' sheet
    const { data, loading, refresh, closeEnquiry } = useEnquiries('Announcements');
    const [selectedSalesman, setSelectedSalesman] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // 2. Process Data: Group by Salesman & Status
    const { grouped, salesmen, totalPending } = useMemo(() => {
        const groups = { 'All': [] };
        const salesCounts = {};

        data.forEach(row => {
            // Filter by search
            if (searchTerm && !row.Name.toLowerCase().includes(searchTerm.toLowerCase()) && !row.Phone.includes(searchTerm)) return;

            const sm = row.Salesman || 'Unassigned';
            
            // Add to All
            groups['All'].push(row);
            
            // Add to specific salesman
            if (!groups[sm]) groups[sm] = [];
            groups[sm].push(row);

            // Count
            salesCounts[sm] = (salesCounts[sm] || 0) + 1;
        });

        // Sort rows by "Date Recorded" or "Expected Date" (Priority)
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => new Date(a['Date Recorded']) - new Date(b['Date Recorded']));
        });

        const sortedSalesmen = Object.keys(salesCounts).sort((a, b) => salesCounts[b] - salesCounts[a]);

        return { grouped: groups, salesmen: sortedSalesmen, totalPending: data.length };
    }, [data, searchTerm]);

    const activeList = grouped[selectedSalesman] || [];

    // 3. Handlers
    const handleClose = async (phone) => {
        if(!window.confirm("Mark this announcement as done/closed?")) return;
        await closeEnquiry(phone); // Uses the same logic to move to 'Closed'
        refresh();
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Announcements & Follow-ups</h1>
                    <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold ${theme.light} ${theme.text}`}>
                            {totalPending} Pending
                        </span>
                        calls remaining across all teams.
                    </p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Find customer..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
                
                {/* LEFT: Salesman List */}
                <div className="w-full md:w-64 flex-shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sales Team</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        <button 
                            onClick={() => setSelectedSalesman('All')}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${selectedSalesman === 'All' ? `${theme.light} ${theme.text} font-bold` : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <span>All Pending</span>
                            <span className="bg-white px-2 py-0.5 rounded shadow-sm text-xs border border-slate-100">{grouped['All']?.length || 0}</span>
                        </button>
                        {salesmen.map(sm => (
                            <button 
                                key={sm}
                                onClick={() => setSelectedSalesman(sm)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all ${selectedSalesman === sm ? `${theme.light} ${theme.text} font-bold` : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${selectedSalesman === sm ? theme.primary.replace('bg-', 'bg-') : 'bg-slate-300'}`}></div>
                                    <span className="truncate max-w-[120px]">{sm}</span>
                                </div>
                                <span className="text-xs text-slate-400">{grouped[sm]?.length}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Task List */}
                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-slate-400" />
                            Call List: <span className={theme.text}>{selectedSalesman}</span>
                        </h3>
                        <span className="text-xs text-slate-400">Sorted by Priority</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0">
                        {loading ? (
                            <div className="h-full flex items-center justify-center text-slate-400">Loading...</div>
                        ) : activeList.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <CheckCircle2 className="h-12 w-12 mb-3 opacity-20" />
                                <p className="text-sm font-medium">All caught up! No pending calls.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 z-10 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-3 border-b border-slate-100">Customer</th>
                                        <th className="px-6 py-3 border-b border-slate-100">Status Context</th>
                                        <th className="px-6 py-3 border-b border-slate-100">Last Interaction</th>
                                        <th className="px-6 py-3 border-b border-slate-100 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {activeList.map((row, idx) => {
                                        const lastMsg = row['Message'] || row['Message-1'] || "No notes";
                                        const isHot = row['Model Nature'] === 'Hot';
                                        
                                        return (
                                            <tr key={idx} className="group hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${isHot ? 'bg-rose-500' : 'bg-slate-300 group-hover:bg-slate-400'}`}>
                                                            {row.Name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-sm">{row.Name}</div>
                                                            <div className="text-xs text-slate-500 font-mono mt-0.5">{row.Phone}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs font-bold text-slate-700">{row.Model || 'Unknown Interest'}</span>
                                                        <span className={`inline-flex w-fit items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${isHot ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                                                            {row['Model Nature'] || 'New Lead'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="max-w-[200px]">
                                                        <p className="text-xs text-slate-600 truncate italic">"{lastMsg}"</p>
                                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(row['Date Recorded']).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleClose(row.Phone)}
                                                            className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition-all"
                                                            title="Mark as Done"
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </button>
                                                        <a 
                                                            href={`tel:${row.Phone}`}
                                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm hover:shadow hover:-translate-y-0.5 transition-all ${theme.primary}`}
                                                        >
                                                            <Phone className="h-3.5 w-3.5" /> Call
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Announcement;