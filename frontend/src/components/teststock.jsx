import React, { useState } from 'react';
import { 
    Search, Zap, Battery, SlidersHorizontal, 
    ArrowUpRight, Box, Cpu, Activity, 
    LayoutGrid, List, Filter
} from 'lucide-react';

const MinimalStockLedger = () => {
    // UX State
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [batteryFilter, setBatteryFilter] = useState('all'); // 'all' | 'lead' | 'lithium'
    const [searchTerm, setSearchTerm] = useState('');

    // Data
    const stockData = [
        { id: "01", name: "Rajhans Star", type: "Passenger", lead48: "1,24,690", lead60: "1,36,912", lith48: "1,30,675", lith60: "1,42,897", motor: "1200W High Torque", chassis: "Industrial Tubular", controller: "Smart 24-Tube" },
        { id: "02", name: "Rajhans Super", type: "Passenger", lead48: "1,26,564", lead60: "1,39,285", lith48: "1,30,554", lith60: "1,42,776", motor: "1000W BLDC", chassis: "Reinforced Alloy", controller: "Vector Logic" },
        { id: "03", name: "Rajhans Super Delux", type: "Premium", lead48: "1,31,253", lead60: "1,43,973", lith48: "1,34,613", lith60: "1,46,835", motor: "1200W Waterproof", chassis: "Stainless Steel", controller: "AI Intelligent" },
        { id: "04", name: "Rajhans Plus", type: "Passenger", lead48: "1,38,130", lead60: "1,48,079", lith48: "1,49,995", lith60: "1,59,445", motor: "1200W Smart", chassis: "Digital Monocoque", controller: "Cloud Integrated" },
        { id: "06", name: "Rajhans Yodha", type: "Utility", lead48: "1,32,198", lead60: "1,44,273", lith48: "1,38,183", lith60: "1,50,258", motor: "1500W Peak", chassis: "13-Leaf Spring", controller: "Heavy MOSFET" }
    ];

    const filteredData = stockData.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-8 selection:bg-black selection:text-white">
            
            {/* --- HEADER CONTROLS --- */}
            <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-black mb-2">Fleet Inventory</h1>
                    <p className="text-gray-500 text-sm font-medium">Jan 2026 Price List • Jagadhri Gate</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    {/* Search */}
                    <div className="relative group px-2">
                        <Search className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2 group-focus-within:text-black transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Filter..." 
                            className="pl-8 py-2 text-sm bg-transparent outline-none w-32 focus:w-48 transition-all placeholder:text-gray-300 font-medium"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div className="w-px h-6 bg-gray-100 mx-2"></div>

                    {/* View Toggles */}
                    <div className="flex gap-1 bg-gray-100/50 p-1 rounded-xl">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <List size={16} />
                        </button>
                    </div>

                    {/* Battery Filter */}
                    <button 
                        onClick={() => setBatteryFilter(prev => prev === 'all' ? 'lithium' : prev === 'lithium' ? 'lead' : 'all')}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
                    >
                        <Filter size={12} />
                        {batteryFilter === 'all' ? 'All Batteries' : batteryFilter === 'lithium' ? 'Lithium Only' : 'Lead Acid Only'}
                    </button>
                </div>
            </header>

            {/* --- DATA DISPLAY --- */}
            <main className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {viewMode === 'grid' ? (
                    // GRID VIEW
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredData.map((item) => (
                            <SmartCard key={item.id} data={item} batteryFilter={batteryFilter} />
                        ))}
                    </div>
                ) : (
                    // TABLE VIEW
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-bold">
                                <tr>
                                    <th className="p-6">Model</th>
                                    <th className="p-6">Type</th>
                                    <th className="p-6">Motor Spec</th>
                                    <th className="p-6 text-right">Starting Price (Lead)</th>
                                    <th className="p-6 text-right">Top Price (Lithium)</th>
                                    <th className="p-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700">
                                {filteredData.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group cursor-default">
                                        <td className="p-6 text-black font-bold">{item.name}</td>
                                        <td className="p-6"><span className="px-2 py-1 rounded-md bg-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-500">{item.type}</span></td>
                                        <td className="p-6 text-gray-500">{item.motor}</td>
                                        <td className="p-6 text-right font-mono text-gray-900">₹{item.lead48}</td>
                                        <td className="p-6 text-right font-mono text-blue-600">₹{item.lith60}</td>
                                        <td className="p-6 text-right">
                                            <button className="p-2 rounded-full hover:bg-black hover:text-white transition-all text-gray-300">
                                                <ArrowUpRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

// --- COMPONENT: THE SMART CARD ---
// This is the core "better data showing" component
const SmartCard = ({ data, batteryFilter }) => {
    return (
        <div className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all hover:-translate-y-1 group flex flex-col h-full">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">{data.type} Fleet</span>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">{data.name}</h3>
                </div>
                <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-colors">
                    <Box size={18} />
                </div>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <SpecPill icon={<Cpu size={14}/>} label="Motor" value={data.motor} />
                <SpecPill icon={<Activity size={14}/>} label="Chassis" value={data.chassis} />
            </div>

            {/* THE PRICING MATRIX - The Cleanest Way to Compare */}
            <div className="mt-auto bg-gray-50 rounded-2xl p-4 border border-gray-100">
                
                {/* Header Labels */}
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
                    <span>Config</span>
                    <span>48V / 60V</span>
                </div>

                <div className="space-y-2">
                    {/* Lead Acid Row */}
                    {(batteryFilter === 'all' || batteryFilter === 'lead') && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-orange-50 text-orange-500">
                                    <Zap size={14} />
                                </div>
                                <span className="text-xs font-bold text-gray-600">Lead Acid</span>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-gray-900">₹{data.lead48} <span className="text-gray-300 font-light">/</span> ₹{data.lead60}</div>
                            </div>
                        </div>
                    )}

                    {/* Lithium Row */}
                    {(batteryFilter === 'all' || batteryFilter === 'lithium') && (
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                            <div className="flex items-center gap-2 pl-2">
                                <div className="p-1.5 rounded-md bg-blue-50 text-blue-500">
                                    <Battery size={14} />
                                </div>
                                <span className="text-xs font-bold text-gray-600">Lithium</span>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-gray-900">₹{data.lith48} <span className="text-gray-300 font-light">/</span> ₹{data.lith60}</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Micro-component for specs
const SpecPill = ({ icon, label, value }) => (
    <div className="bg-white border border-gray-100 p-3 rounded-xl">
        <div className="flex items-center gap-2 text-gray-400 mb-1">
            {icon}
            <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-xs font-bold text-gray-700 truncate" title={value}>{value}</p>
    </div>
);

export default MinimalStockLedger;