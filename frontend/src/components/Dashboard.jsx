import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Home as HomeIcon, // Aliased to avoid conflict with Home component
    BarChart2, Settings, LogOut, Command,
    LifeBuoy, Bell, Search, Check, ChevronDown, Slash,
    MessageSquare, CheckCircle, PieChart, FileText, Package, Users, CreditCard, Truck
} from 'lucide-react';

// --- COMPONENT IMPORTS ---
import Sales from './Sales';
import Enquiry from './Enquiry';
import ClosedEnquiry from './ClosedEnquiry';
import EnquiryStats from './EnquiryStats';
import Stock from './Stock'; 
import SalesAnalytics from './SalesAnalytics';
import Employee from './Employee'; 
import Dues from './Dues';
import AddVehicle from './AddVehicle';
import Expense from './Expense';
import Home from './Home'; // Imported Home Component

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('nexus_activeTab') || 'home');
    const [visitedTabs, setVisitedTabs] = useState([localStorage.getItem('nexus_activeTab') || 'home']);
    const [sidebarSearch, setSidebarSearch] = useState('');
    const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

    // --- THEME STATE ---
    const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('nexus_theme') || 'emerald');

    useEffect(() => {
        localStorage.setItem('nexus_theme', currentTheme);
    }, [currentTheme]);

    useEffect(() => {
        localStorage.setItem('nexus_activeTab', activeTab);
        setVisitedTabs(prev => prev.includes(activeTab) ? prev : [...prev, activeTab]);
    }, [activeTab]);

    const themes = {
        emerald: { label: 'Growth', primary: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'focus:ring-emerald-500/20' },
        blue: { label: 'Ocean', primary: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', ring: 'focus:ring-blue-500/20' },
        violet: { label: 'Royal', primary: 'bg-violet-600', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', ring: 'focus:ring-violet-500/20' },
        amber: { label: 'Energy', primary: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'focus:ring-amber-500/20' },
        rose: { label: 'Passion', primary: 'bg-rose-600', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', ring: 'focus:ring-rose-500/20' },
        slate: { label: 'Dark', primary: 'bg-slate-700', light: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', ring: 'focus:ring-slate-500/20' },
    };

    const t = themes[currentTheme];

    // --- NAVIGATION DATA ---
    const allNavGroups = [
        {
            title: "Management",
            items: [
                { id: 'home', label: 'Home', icon: HomeIcon }, // Using aliased icon
                { id: 'analytics', label: 'Sales Analytics', icon: BarChart2 },
                { id: 'stock', label: 'Stock & Pricing', icon: Package },
                { id: 'sales', label: 'Sales & Orders', icon: FileText },
                { id: 'dues', label: 'Dues & Collections', icon: CreditCard },
                { id: 'add_vehicle', label: 'Add Vehicle/Permit', icon: Truck },
                { id: 'employees', label: 'Staff & Payroll', icon: Users },
                { id: 'expenses', label: 'Expense Manager', icon: CreditCard },
            ]
        },
        {
            title: "Enquiries",
            items: [
                { id: 'enquiry', label: 'Enquiries', icon: MessageSquare },
                { id: 'closed_enquiry', label: 'Closed Enquiries', icon: CheckCircle },
                { id: 'enquiry_stats', label: 'Enquiry Stats', icon: PieChart },
            ]
        },
        {
            title: "System",
            items: [
                { id: 'settings', label: 'Settings', icon: Settings },
                // { id: 'support', label: 'Support', icon: LifeBuoy },
            ]
        }
    ];

    const filteredNavGroups = useMemo(() => {
        if (!sidebarSearch) return allNavGroups;
        return allNavGroups.map(group => ({
            ...group,
            items: group.items.filter(item =>
                item.label.toLowerCase().includes(sidebarSearch.toLowerCase())
            )
        })).filter(group => group.items.length > 0);
    }, [sidebarSearch]);

    // --- CONTENT RENDERING HELPER ---
    const renderContent = () => {
        const validTabs = ['home', 'sales', 'enquiry', 'closed_enquiry', 'enquiry_stats', 'stock', 'analytics', 'employees', 'dues', 'add_vehicle', 'expenses'];
        
        if (!validTabs.includes(activeTab)) {
             return (
                 <div className="w-full h-96 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center p-8 opacity-60">
                     <div className={`h-12 w-12 rounded-xl ${t.light} flex items-center justify-center mb-3`}>
                         <Command className={`h-6 w-6 ${t.text}`} />
                     </div>
                     <h3 className="text-sm font-bold text-slate-900">No {activeTab.replace('_', ' ')} Found</h3>
                     <p className="text-xs text-gray-500 max-w-xs mt-1">
                         This section is currently under development or empty.
                     </p>
                 </div>
             );
        }

        return (
            <>
                {visitedTabs.includes('home') && <div className={activeTab === 'home' ? 'block' : 'hidden'}><Home theme={t} setActiveTab={setActiveTab} /></div>}
                {visitedTabs.includes('sales') && <div className={activeTab === 'sales' ? 'block' : 'hidden'}><Sales theme={t} /></div>}
                {visitedTabs.includes('enquiry') && <div className={activeTab === 'enquiry' ? 'block' : 'hidden'}><Enquiry theme={t} /></div>}
                {visitedTabs.includes('closed_enquiry') && <div className={activeTab === 'closed_enquiry' ? 'block' : 'hidden'}><ClosedEnquiry theme={t} /></div>}
                {visitedTabs.includes('enquiry_stats') && <div className={activeTab === 'enquiry_stats' ? 'block' : 'hidden'}><EnquiryStats theme={t} /></div>}
                {visitedTabs.includes('stock') && <div className={activeTab === 'stock' ? 'block' : 'hidden'}><Stock theme={t} /></div>}
                {visitedTabs.includes('analytics') && <div className={activeTab === 'analytics' ? 'block' : 'hidden'}><SalesAnalytics theme={t} /></div>}
                {visitedTabs.includes('employees') && <div className={activeTab === 'employees' ? 'block' : 'hidden'}><Employee theme={t} /></div>}
                {visitedTabs.includes('dues') && <div className={activeTab === 'dues' ? 'block' : 'hidden'}><Dues theme={t} /></div>}
                {visitedTabs.includes('add_vehicle') && <div className={activeTab === 'add_vehicle' ? 'block' : 'hidden'}><AddVehicle theme={t} /></div>}
                {visitedTabs.includes('expenses') && <div className={activeTab === 'expenses' ? 'block' : 'hidden'}><Expense theme={t} /></div>}
            </>
        );
    };

    return (
        <div className="flex h-screen w-full bg-[#F3F4F6] font-sans text-sm text-slate-800 overflow-hidden selection:bg-gray-200">
            {/* SIDEBAR */}
            <aside className="w-[220px] bg-white border-r border-gray-200 flex flex-col shrink-0 z-30 transition-all duration-300 shadow-sm">
                <div className="h-12 flex items-center px-4 border-b border-gray-100">
                    <div className={`h-6 w-6 rounded-lg flex items-center justify-center text-white shadow-sm ${t.primary} mr-2.5`}>
                        <Command className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-bold text-base tracking-tight text-slate-900">Nexus.</span>
                </div>

                <div className="px-3 pt-3 pb-1">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                        <input
                            type="text"
                            value={sidebarSearch}
                            onChange={(e) => setSidebarSearch(e.target.value)}
                            placeholder="Find module..."
                            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-transparent focus:bg-white focus:border-gray-200 rounded-md text-xs font-medium placeholder-gray-400 outline-none transition-all"
                        />
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 custom-scrollbar">
                    {filteredNavGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="animate-in fade-in duration-300">
                            <h3 className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 opacity-80">
                                {group.title}
                            </h3>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id)}
                                            className={`
                                                w-full flex items-center justify-between px-2.5 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-150 group relative
                                                ${isActive ? `${t.light} ${t.text}` : 'text-slate-500 hover:bg-gray-50 hover:text-slate-900'}
                                            `}
                                        >
                                            <div className="flex items-center gap-2.5 relative z-10">
                                                <Icon className={`h-4 w-4 transition-colors ${isActive ? t.text : 'text-gray-400 group-hover:text-slate-600'}`} />
                                                <span>{item.label}</span>
                                            </div>
                                            {isActive && <div className={`w-1 h-4 rounded-full ${t.primary}`} />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="p-3 border-t border-gray-50 bg-gray-50/30">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* MAIN LAYOUT */}
            <div className="flex-1 flex flex-col h-full relative">
                {/* TOP BAR */}
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center text-xs text-gray-500 font-medium">
                        <span className="hover:text-gray-900 cursor-pointer transition-colors">Dashboard</span>
                        <Slash className="h-3 w-3 mx-2 text-gray-300 -rotate-12" />
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md ${t.light} ${t.text}`}>
                            <span className="capitalize">{activeTab.replace('_', ' ')}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <button className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-md transition-colors" title="Support">
                            <LifeBuoy className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-slate-700 hover:bg-gray-100 rounded-md transition-colors relative">
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                        </button>
                        <div className="h-4 w-px bg-gray-200 mx-1"></div>

                        {/* Theme Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                                className="flex items-center gap-2 px-2 py-1 bg-white border border-gray-200 hover:border-gray-300 rounded-md shadow-sm transition-all"
                            >
                                <div className={`w-3 h-3 rounded-full ${t.primary}`}></div>
                                <span className="text-[11px] font-semibold text-slate-600 capitalize">{currentTheme}</span>
                                <ChevronDown className="h-3 w-3 text-gray-400" />
                            </button>

                            {isThemeMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsThemeMenuOpen(false)}></div>
                                    <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-lg shadow-xl border border-gray-100 p-1.5 z-20 animate-in fade-in zoom-in-95 duration-200">
                                        {Object.entries(themes).map(([key, theme]) => (
                                            <button
                                                key={key}
                                                onClick={() => { setCurrentTheme(key); setIsThemeMenuOpen(false); }}
                                                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${currentTheme === key ? 'bg-gray-50 text-slate-900' : 'text-slate-500 hover:bg-gray-50'}`}
                                            >
                                                <div className={`w-2.5 h-2.5 rounded-full ${theme.primary}`}></div>
                                                {theme.label}
                                                {currentTheme === key && <Check className="h-3 w-3 ml-auto text-slate-900" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="ml-2 h-7 w-7 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center text-white text-[10px] font-bold border-2 border-white shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                            {user?.username?.[0]?.toUpperCase() || 'A'}
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT AREA */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10 scroll-smooth bg-[#FFFFFF]">
                    <div className="max-w-6xl mx-auto">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;