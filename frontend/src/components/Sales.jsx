import { useState, useEffect } from 'react';
import { 
  // Stats & Layout
  ArrowUpRight, ArrowDownRight, DollarSign, ShoppingBag, CreditCard, 
  Activity, MoreHorizontal, Search, Calendar, 
  Plus, ChevronDown, Check, FileText, Download,
  ArrowLeft, Save, User, Home, Hash, Truck, ChevronRight, CheckCircle2,
  
  // Modal & Form Icons
  X, Trash2, Eye, Clock, MapPin, AlertCircle, Lock, ArrowDown, ShieldCheck, Mail, Edit2, Zap, Tag, Layers, ClipboardCheck, Fingerprint,
  
  // New Icons
  Printer, Car, ScrollText, Landmark, UserCheck, Calculator, Share2
} from 'lucide-react';

// --- CONFIGURATION —— uses env var in production, relative /api in dev (Vite proxy) ---
const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';


// ==========================================
// 1. COMPONENT: ACTION MODAL
// ==========================================
const ActionModal = ({ customer, onClose, onNavigate, theme }) => {
  if (!customer) return null;

  const isChallanDone = customer.pipeline.challan;
  const isAgreementDone = customer.pipeline.agreement;
  const isAgreementLocked = !isChallanDone;

  const steps = [
      { id: 'created', label: 'Profile Created', date: new Date(customer.createdAt).toLocaleDateString() },
      { id: 'challan', label: 'Vehicle Challan', date: isChallanDone ? 'Completed' : '-' },
      { id: 'agreement', label: 'Rental Agreement', date: isAgreementDone ? 'Completed' : '-' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
        {/* LEFT SIDEBAR */}
        <div className="w-full md:w-[320px] bg-slate-50 border-r border-slate-100 p-8 flex flex-col relative shrink-0">
            <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
            <div className="relative z-10 flex justify-between items-start mb-6">
                <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-[10px] font-mono font-bold text-slate-500 shadow-sm">{customer.id}</span>
                <div className={`h-2 w-2 rounded-full ${isAgreementDone ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
            </div>
            <div className="relative z-10 flex flex-col items-center text-center mb-8">
                <div className="relative mb-4 group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-white rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500"></div>
                    <div className={`relative h-24 w-24 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-lg border border-slate-100`}>
                        <User className="h-10 w-10 opacity-50" />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">{customer.name}</h2>
                <div className="flex items-center gap-1.5 mt-1 text-slate-500">
                    <Mail className="h-3 w-3" />
                    <span className="text-xs font-medium">{customer.email || 'No Email'}</span>
                </div>
            </div>
            <div className="relative z-10 space-y-4 mt-auto bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><MapPin className="h-4 w-4" /></div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">Location</p>
                        <p className="text-xs font-semibold text-slate-700 leading-snug">{customer.address}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 flex flex-col bg-white min-h-[500px]">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 bg-white sticky top-0 z-20">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">Workflow Pipeline</h3>
                    <p className="text-xs text-slate-500 mt-1">Complete the documentation steps in order.</p>
                </div>
                <button onClick={onClose} className="group p-2 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                    <X className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                </button>
            </div>

            <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
                <div className="flex items-center justify-between relative max-w-lg mx-auto">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-10 rounded-full"></div>
                    <div className={`absolute left-0 top-1/2 h-0.5 ${theme.bg} -z-10 rounded-full transition-all duration-700 ease-in-out`} style={{ width: isAgreementDone ? '100%' : isChallanDone ? '50%' : '0%' }}></div>
                    {steps.map((step, i) => {
                        const isDone = customer.pipeline[step.id];
                        return (
                            <div key={step.id} className="flex flex-col items-center gap-2 group cursor-default">
                                <div className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${isDone ? `${theme.primary} border-transparent text-white ` : 'bg-white border-slate-200 text-slate-300'}`}>
                                    {isDone ? <Check className="h-4 w-4" /> : <span className="text-[10px] font-bold">{i+1}</span>}
                                </div>
                                <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDone ? 'text-slate-800' : 'text-slate-400'}`}>{step.label}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex-1 p-8 overflow-y-auto relative space-y-6">
                
                {/* BUTTON: CHALLAN */}
                <button onClick={() => onNavigate(isChallanDone ? 'view-challan' : 'challan')} className={`w-full group text-left relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ease-out flex items-start gap-5 p-5 ${isChallanDone ? 'bg-white border-emerald-100 hover:border-emerald-300 shadow-sm' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40 hover:border-emerald-400 hover:shadow-emerald-100 hover:-translate-y-1'}`}>
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm ${isChallanDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                        {isChallanDone ? <Eye className="h-6 w-6" /> : <Truck className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className={`text-sm font-bold ${isChallanDone ? 'text-slate-800' : 'text-slate-800'}`}>{isChallanDone ? 'View Challan' : 'Vehicle Challan'}</h4>
                            {isChallanDone ? <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><CheckCircle2 className="h-3 w-3" /> COMPLETED</span> : <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-emerald-500 px-2 py-1 rounded shadow-sm shadow-emerald-200">START NOW <ArrowDownRight className="h-3 w-3" /></span>}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[90%]">{isChallanDone ? 'Review generated document and edit if necessary.' : 'Generate the vehicle delivery challan. Includes engine number, chassis number, and checklist.'}</p>
                    </div>
                </button>

                {/* BUTTON: AGREEMENT */}
                <button 
                    onClick={() => !isAgreementLocked && onNavigate(isAgreementDone ? 'view-agreement' : 'agreement')} 
                    disabled={isAgreementLocked} 
                    className={`w-full group text-left relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ease-out flex items-start gap-5 p-5 ${isAgreementLocked ? 'bg-slate-50/50 border-slate-100 opacity-60 cursor-not-allowed grayscale-[0.8]' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40 hover:border-violet-400 hover:shadow-violet-100 hover:-translate-y-1'}`}
                >
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm ${isAgreementLocked ? 'bg-slate-100 text-slate-300' : isAgreementDone ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600'}`}>
                        {isAgreementLocked ? <Lock className="h-5 w-5" /> : isAgreementDone ? <Check className="h-6 w-6" /> : <ScrollText className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className={`text-sm font-bold ${isAgreementLocked ? 'text-slate-400' : 'text-slate-800'}`}>{isAgreementDone ? 'View Agreement' : 'Rental Agreement'}</h4>
                            {isAgreementLocked && <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded"><Lock className="h-3 w-3" /> LOCKED</span>}
                            {!isAgreementLocked && isAgreementDone && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><CheckCircle2 className="h-3 w-3" /> COMPLETED</span>}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed max-w-[90%]">{isAgreementLocked ? 'Complete the Challan step to unlock the legal rental agreement generation.' : 'Generate and sign the legal rental contract details including loan and payment info.'}</p>
                    </div>
                </button>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <button className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                <div className="flex gap-3"><button onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">Close</button></div>
            </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. COMPONENT: VIEW CHALLAN (COMPACT)
// ==========================================
const ViewChallan = ({ theme, customer, onBack, onEdit }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/challan/${customer.originalId}`, { headers: { 'Authorization': token } });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };
    fetchData();
  }, [customer]);

  if (loading) return <div className="h-full flex items-center justify-center text-slate-400 font-bold animate-pulse text-sm">Accessing Database...</div>;
  if (!data) return <div className="h-full flex items-center justify-center text-rose-500 font-bold text-sm">Error loading challan data.</div>;

  const GridItem = ({ label, value, icon: Icon }) => (
    <div className="flex flex-col border-r border-slate-100 last:border-0 px-4 py-3">
        <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            {Icon && <Icon className="h-3 w-3" />} {label}
        </span>
        <span className="text-sm font-bold text-slate-700 font-mono truncate select-all">
            {value || <span className="text-rose-400 text-[10px] italic">MISSING</span>}
        </span>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300 flex flex-col h-full bg-[#f8fafc]">
        {/* --- ACTION BAR --- */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
             <div className="flex items-center gap-3">
                 <button onClick={onBack} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-colors">
                     <ArrowLeft className="h-4 w-4" />
                 </button>
                 <div className="h-6 w-px bg-slate-200 mx-1"></div>
                 <h1 className="text-sm font-bold text-slate-700">Delivery Challan</h1>
             </div>
             <div className="flex items-center gap-3">
                <button onClick={() => window.print()} className="px-3 py-2 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-2">
                   <Printer className="h-3.5 w-3.5" /> Print
                </button>
                <button onClick={() => onEdit(data)} className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 ${theme.primary}`}>
                   <Edit2 className="h-3.5 w-3.5" /> Edit Data
                </button>
             </div>
        </div>

        {/* --- SCROLLABLE CONTENT --- */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-stretch border-b border-slate-200">
                    <div className="p-6 flex-1 bg-gradient-to-br from-slate-50 to-white">
                        <div className="flex items-center gap-3 mb-2">
                             <div className={`p-2 rounded-lg ${theme.light || 'bg-blue-50'} ${theme.text || 'text-blue-600'}`}>
                                <Car className="h-5 w-5" />
                             </div>
                             <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">{data.details.model}</h2>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                             <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 font-bold">{data.details.make}</span>
                             <span>•</span>
                             <span>{data.details.color}</span>
                        </div>
                    </div>
                    <div className="flex md:w-[320px] divide-x divide-slate-100 border-t md:border-t-0 md:border-l border-slate-200">
                        <div className="flex-1 p-4 flex flex-col justify-center bg-slate-50/50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Hash className="h-3 w-3" /> Challan No</span>
                            <span className="text-lg font-mono font-bold text-slate-800">{data.details.challanNo}</span>
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-center bg-slate-50/50">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Date</span>
                            <span className="text-sm font-bold text-slate-800">{new Date(data.details.challanDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50/50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Vehicle Specifications</h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">{data.details.dto}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-200 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <GridItem label="Engine No" value={data.engine.engineNo} />
                    <GridItem label="Frame / Chassis" value={data.engine.frameNo} />
                    <GridItem label="Cylinder No" value={data.engine.cylinderNo} />
                    <GridItem label="Motor No" value={data.engine.motorNo} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-200 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-slate-50/30">
                    <GridItem label="Key No" value={data.registration.keyNo} />
                    <GridItem label="Battery No" value={data.registration.batteryNo} />
                    <GridItem label="Product No" value={data.registration.productNo} />
                    <GridItem label="Book No" value={data.registration.bookNo} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                    <div className="md:col-span-5 p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                             <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs border border-indigo-100">
                                {customer.name.charAt(0)}
                             </div>
                             <div>
                                <p className="text-xs font-bold text-slate-900">{customer.name}</p>
                                <p className="text-[10px] text-slate-500">{customer.id}</p>
                             </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <div className="p-2.5 rounded border border-slate-100 bg-slate-50">
                                 <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Aadhar Number</span>
                                 <span className="block text-xs font-mono font-bold text-slate-700">{data.ids.aadhar || '-'}</span>
                             </div>
                             <div className="p-2.5 rounded border border-slate-100 bg-slate-50">
                                 <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">PAN Number</span>
                                 <span className="block text-xs font-mono font-bold text-slate-700">{data.ids.pan || '-'}</span>
                             </div>
                        </div>
                    </div>

                    <div className="md:col-span-7 p-6">
                          <div className="flex items-center justify-between mb-4">
                             <h4 className="text-xs font-extrabold text-slate-700 uppercase flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Inspection Checklist
                             </h4>
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${data.checklist?.length >= 4 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                {data.checklist?.length || 0} items verified
                             </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {data.checklist && data.checklist.length > 0 ? (
                                data.checklist.map(item => (
                                    <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
                                        <CheckCircle2 className="h-3 w-3" /> {item}
                                    </span>
                                ))
                            ) : (
                                <div className="w-full py-2 border-2 border-dashed border-slate-100 rounded-lg flex items-center justify-center gap-2 text-slate-400">
                                    <AlertCircle className="h-4 w-4" /> <span className="text-xs font-bold">No checklist items recorded</span>
                                </div>
                            )}
                          </div>
                    </div>
                </div>

                <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-[10px] font-medium text-slate-400">System generated challan. Valid for 30 days.</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-500">{data.details.dto} Region</span>
                      </div>
                </div>
            </div>
        </div>
    </div>
  );
};

// ==========================================
// 3. COMPONENT: VIEW AGREEMENT (READ-ONLY)
// ==========================================
const ViewAgreement = ({ theme, customer, onBack, onEdit }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
   
    useEffect(() => {
      const fetchData = async () => {
          try {
              const token = localStorage.getItem('token');
              const res = await fetch(`${API_URL}/agreement/${customer.originalId}`, { headers: { 'Authorization': token } });
              if (res.ok) {
                  const json = await res.json();
                  setData(json);
              }
          } catch (e) { console.error(e); } 
          finally { setLoading(false); }
      };
      fetchData();
    }, [customer]);
   
    if (loading) return <div className="h-full flex items-center justify-center text-slate-400 font-bold animate-pulse text-sm">Loading Agreement...</div>;
    if (!data) return <div className="h-full flex items-center justify-center text-rose-500 font-bold text-sm">Agreement not found.</div>;
   
    // Reusable Read-only Field Component
    const Field = ({ label, value }) => (
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
            <span className="block text-sm font-bold text-slate-700 font-mono truncate">{value || '-'}</span>
        </div>
    );

    const Section = ({ title, icon: Icon, children }) => (
        <div className="mb-8">
            <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                {Icon && <Icon className={`h-4 w-4 ${theme.text}`} />}
                {title}
            </h3>
            {children}
        </div>
    );
   
    return (
      <div className="animate-in fade-in duration-300 flex flex-col h-full bg-[#f8fafc]">
          {/* HEADER */}
          <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
               <div className="flex items-center gap-3">
                   <button onClick={onBack} className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-center transition-colors">
                       <ArrowLeft className="h-4 w-4" />
                   </button>
                   <div className="h-6 w-px bg-slate-200 mx-1"></div>
                   <h1 className="text-sm font-bold text-slate-700">View Agreement</h1>
               </div>
               <div className="flex items-center gap-3">
                  <button className="px-3 py-2 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-2"><Download className="h-3.5 w-3.5" /> Download</button>
                  <button className="px-3 py-2 rounded-lg text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-2"><Share2 className="h-3.5 w-3.5" /> Share</button>
                  <button onClick={() => onEdit(data)} className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2 ${theme.primary}`}>
                     <Edit2 className="h-3.5 w-3.5" /> Edit Agreement
                  </button>
               </div>
          </div>
   
          {/* CONTENT */}
          <div className="flex-1 overflow-y-auto p-4 md:p-10">
              <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-100">
                  <div className="mb-6">
                      <p className="text-sm text-slate-500">Customer Name : <span className="font-bold text-slate-800">{customer.name}</span></p>
                  </div>
   
                  <Section title="Agreement ID">
                     <div className="bg-slate-100 rounded-lg p-3 border border-slate-200 max-w-sm">
                        <span className="text-sm font-mono font-bold text-slate-600">{data.agreementId || 'N/A'}</span>
                     </div>
                  </Section>
   
                  <Section title="Model Details" icon={Car}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Field label="Model" value={data.model?.name} />
                          <Field label="Ex-Showroom" value={data.model?.exShowroom} />
                          <Field label="Insurance" value={data.model?.insurance} />
                          <Field label="RTO" value={data.model?.rto} />
                          <Field label="Permit" value={data.model?.permit} />
                          <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                              <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">On Road Price</span>
                              <span className="block text-sm font-bold text-indigo-700 font-mono">{data.model?.onRoadPrice}</span>
                          </div>
                      </div>
                  </Section>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Section title="Loan Details" icon={Landmark}>
                        <div className="grid grid-cols-1 gap-4">
                            <Field label="Bank Name" value={data.loan?.bankName} />
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Loan Amount" value={data.loan?.amount} />
                                <Field label="Processing Fee" value={data.loan?.processingFee} />
                            </div>
                        </div>
                    </Section>

                    <Section title="DTO Details" icon={MapPin}>
                        <div className="grid grid-cols-1 gap-4">
                             <div className="grid grid-cols-2 gap-4">
                                <Field label="DTO Place" value={data.dto?.place} />
                                <Field label="DTO Registration" value={data.dto?.registration} />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <Field label="DTO Online Payment" value={data.dto?.onlinePayment} />
                                <Field label="DTO Total" value={data.dto?.total} />
                             </div>
                        </div>
                    </Section>
                  </div>

                  <Section title="Broker & DSE Details" icon={UserCheck}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-4">
                            <Field label="Broker Name" value={data.broker?.name} />
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Broker Phone" value={data.broker?.phone} />
                                <Field label="Broker Amount" value={data.broker?.amount} />
                            </div>
                         </div>
                         <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <Field label="DSE Name" value={data.dse?.name} />
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Commission" value={data.dse?.commission} />
                                <Field label="Net Profit" value={data.dse?.netProfit} />
                            </div>
                         </div>
                      </div>
                  </Section>

                  <Section title="Payment Details" icon={Calculator}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field label="Customer Down Payment" value={data.payment?.downPayment} />
                            <Field label="Customer Paid Amount" value={data.payment?.paidAmount} />
                            <Field label="Payment Type" value={data.payment?.type} />
                            <Field label="Payment Date" value={data.payment?.date ? new Date(data.payment.date).toLocaleDateString() : '-'} />
                            <Field label="Dues" value={data.payment?.dues} />
                            <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                                <span className="block text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Net Dues Remaining</span>
                                <span className="block text-sm font-bold text-emerald-800 font-mono">{data.payment?.netDues}</span>
                            </div>
                       </div>
                  </Section>

                  {/* Profit Section (Read Only from image context) */}
                  <Section title="Financial Summary" icon={DollarSign}>
                        <div className="bg-slate-900 text-white p-5 rounded-xl flex items-center justify-between">
                           <div>
                               <p className="text-xs font-medium text-slate-400">Final Net Profit</p>
                               <p className="text-2xl font-bold">{data.dse?.finalNetProfit || '0.00'}</p>
                           </div>
                           <div className="text-right">
                                <p className="text-xs font-medium text-slate-400">Other Remarks</p>
                                <p className="text-sm font-medium">{data.other?.remark || 'No remarks'}</p>
                           </div>
                        </div>
                  </Section>

              </div>
          </div>
      </div>
    );
};

// ==========================================
// 4. COMPONENT: AGREEMENT FORM (Create & Edit)
// ==========================================
const AgreementForm = ({ theme, onBack, customer, onSuccess, initialData }) => {
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState(initialData || {
      agreementId: '',
      model: { name: 'RE COMPACT CNG', exShowroom: '250490', insurance: '12300', rto: '18000', permit: '5500', onRoadPrice: '286290.00' },
      loan: { bankName: '', amount: '', processingFee: '' },
      dto: { place: 'PATNA', registration: '', onlinePayment: '', permit: '', total: '0.00' },
      broker: { name: '', phone: '', village: '', amount: '' },
      payment: { downPayment: '', paidAmount: '', type: 'CASH', date: '', dues: '0.00', netDues: '0.00' },
      other: { amount: '', remark: '' },
      dse: { name: '', commission: '', netProfit: '-262790.00', tds: '0.00', finalNetProfit: '-262790.00' },
      magadh: { margin: '262790.00', paymentDate: '' }
    });

    const [stocks, setStocks] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                // 1. Fetch inventory models
                const invRes = await fetch(`${API_URL}/inventory`, { headers: { 'Authorization': token } });
                if (invRes.ok) {
                    const invData = await invRes.json();
                    setStocks(invData);

                    // 2. If creating new, fetch challan to auto-fill model
                    if (!initialData && customer?.originalId) {
                        const challanRes = await fetch(`${API_URL}/challan/${customer.originalId}`, { headers: { 'Authorization': token } });
                        if (challanRes.ok) {
                            const challanData = await challanRes.json();
                            if (challanData.details?.model) {
                                handleDeepChange('model', 'name', challanData.details.model);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching data for agreement:", error);
            }
        };

        fetchData();
    }, [customer, initialData]);
   
    const handleDeepChange = (section, field, value) => {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [field]: value }
      }));
    };
    
    // Simple state change for root level
    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };
   
    const handleSubmit = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        let url = `${API_URL}/agreement`;
        let method = 'POST';
        let payload = { ...formData, customerId: customer.originalId };
   
        if (initialData && initialData._id) {
            url = `${API_URL}/agreement/${initialData._id}`;
            method = 'PUT';
            payload = formData;
        }
   
        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json', 'Authorization': token },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) { onSuccess(); } 
        else { const err = await res.json(); alert(`Failed: ${err.message}`); }
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };

    // Reusable Input Field
    const Input = ({ label, value, onChange, type="text", prefix }) => (
        <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{label}</label>
            <div className="relative">
                {prefix && <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">{prefix}</span>}
                <input 
                    type={type} 
                    value={value} 
                    onChange={e => onChange(e.target.value)} 
                    className={`w-full ${prefix ? 'pl-7' : 'px-3'} py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all`} 
                />
            </div>
        </div>
    );
   
    return (
      <div className="animate-in zoom-in-95 duration-300 flex flex-col pb-8 h-full">
        {/* Action Bar */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-4">
              <button onClick={onBack} className="group flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                 <div className="p-1.5 rounded-lg bg-white border border-gray-200 group-hover:bg-gray-50 transition-colors"><ArrowLeft className="h-3.5 w-3.5" /></div>
                 <span>Cancel</span>
              </button>
              <div className="h-4 w-px bg-gray-300"></div>
              <span className="text-xs font-bold text-slate-700">{initialData ? 'Editing' : 'Creating'} Agreement for: <span className="text-slate-900">{customer?.name}</span></span>
          </div>
          <button onClick={handleSubmit} disabled={loading} className={`px-6 py-2 rounded-lg text-xs font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 ${theme.primary} ${loading ? 'opacity-50' : ''}`}>
             {loading ? 'Processing...' : <><Save className="h-3.5 w-3.5" /> {initialData ? 'Update Agreement' : 'Save Agreement'}</>}
          </button>
        </div>
   
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row flex-1 min-h-0">
           <div className={`w-full md:w-1/5 ${theme.primary} relative p-6 flex flex-col justify-between overflow-hidden shrink-0`}>
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              <div className="relative z-10 text-white">
                  <div className="flex items-center justify-between mb-6">
                     <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg"><ScrollText className="h-5 w-5" /></div>
                  </div>
                  <h1 className="text-xl font-bold tracking-tight mb-2">Agreement</h1>
                  <p className="text-blue-50/90 text-xs font-medium leading-relaxed">Enter financial, broker, and vehicle details to generate the legal contract.</p>
              </div>
           </div>
   
           <div className="flex-1 bg-slate-50/50 overflow-y-auto">
              <form className="p-6 md:p-8 space-y-8" onSubmit={e => e.preventDefault()}>
                  
                  {/* SECTION 1: Agreement & Model */}
                  <div>
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-4 flex items-center gap-2"><Car className="h-4 w-4 text-slate-400" /> Agreement & Model Details</h3>
                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="md:col-span-3">
                              <Input label="Agreement ID" value={formData.agreementId} onChange={v => handleChange('agreementId', v)} />
                          </div>
                          <div className="md:col-span-3 h-px bg-slate-100 my-1"></div>
                          <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Model</label><select value={formData.model.name} onChange={e => handleDeepChange('model', 'name', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-transparent focus:ring-1 ${theme.ring}`}><option value="">Select Model</option>{stocks.map(s => <option key={s._id} value={s.modelName}>{s.modelName}</option>)}</select></div>
                          <Input label="Ex-Showroom" value={formData.model.exShowroom} onChange={v => handleDeepChange('model', 'exShowroom', v)} />
                          <Input label="Insurance" value={formData.model.insurance} onChange={v => handleDeepChange('model', 'insurance', v)} />
                          <Input label="RTO" value={formData.model.rto} onChange={v => handleDeepChange('model', 'rto', v)} />
                          <Input label="Permit" value={formData.model.permit} onChange={v => handleDeepChange('model', 'permit', v)} />
                          <Input label="On Road Price" value={formData.model.onRoadPrice} onChange={v => handleDeepChange('model', 'onRoadPrice', v)} />
                      </div>
                  </div>

                  {/* SECTION 2: Loan & DTO */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-4 flex items-center gap-2"><Landmark className="h-4 w-4 text-slate-400" /> Loan Details</h3>
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                            <Input label="Bank Name" value={formData.loan.bankName} onChange={v => handleDeepChange('loan', 'bankName', v)} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Loan Amount" value={formData.loan.amount} onChange={v => handleDeepChange('loan', 'amount', v)} />
                                <Input label="Bank Processing Fee" value={formData.loan.processingFee} onChange={v => handleDeepChange('loan', 'processingFee', v)} />
                            </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> DTO Details</h3>
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">DTO Place</label><select value={formData.dto.place} onChange={e => handleDeepChange('dto', 'place', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-transparent focus:ring-1 ${theme.ring}`}><option>PATNA</option><option>MUZAFFARPUR</option><option>SARAN</option></select></div>
                                <Input label="DTO Registration" value={formData.dto.registration} onChange={v => handleDeepChange('dto', 'registration', v)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="DTO Permit" value={formData.dto.permit} onChange={v => handleDeepChange('dto', 'permit', v)} />
                                <Input label="DTO Total" value={formData.dto.total} onChange={v => handleDeepChange('dto', 'total', v)} />
                            </div>
                            <Input label="DTO Online Payment" value={formData.dto.onlinePayment} onChange={v => handleDeepChange('dto', 'onlinePayment', v)} />
                        </div>
                      </div>
                  </div>

                  {/* SECTION 3: Broker & Other */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-4 flex items-center gap-2"><UserCheck className="h-4 w-4 text-slate-400" /> Broker Details</h3>
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                            <Input label="Broker Name" value={formData.broker.name} onChange={v => handleDeepChange('broker', 'name', v)} />
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Broker Phone" value={formData.broker.phone} onChange={v => handleDeepChange('broker', 'phone', v)} />
                                <Input label="Broker Village" value={formData.broker.village} onChange={v => handleDeepChange('broker', 'village', v)} />
                            </div>
                            <Input label="Broker Amount" value={formData.broker.amount} onChange={v => handleDeepChange('broker', 'amount', v)} />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-4 flex items-center gap-2"><Tag className="h-4 w-4 text-slate-400" /> Other</h3>
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                            <Input label="Other Amount" value={formData.other.amount} onChange={v => handleDeepChange('other', 'amount', v)} />
                            <Input label="Other Remark" value={formData.other.remark} onChange={v => handleDeepChange('other', 'remark', v)} />
                        </div>
                      </div>
                  </div>

                  {/* SECTION 4: Payment */}
                  <div>
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-4 flex items-center gap-2"><Calculator className="h-4 w-4 text-slate-400" /> Payment</h3>
                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5">
                          <Input label="Customer Down Payment" value={formData.payment.downPayment} onChange={v => handleDeepChange('payment', 'downPayment', v)} />
                          <Input label="Customer Paid Amount" value={formData.payment.paidAmount} onChange={v => handleDeepChange('payment', 'paidAmount', v)} />
                          <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Payment Type</label><select value={formData.payment.type} onChange={e => handleDeepChange('payment', 'type', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-transparent focus:ring-1 ${theme.ring}`}><option>CASH</option><option>ONLINE</option><option>CHEQUE</option></select></div>
                          <Input label="Payment Date" type="date" value={formData.payment.date} onChange={v => handleDeepChange('payment', 'date', v)} />
                          <Input label="Dues" value={formData.payment.dues} onChange={v => handleDeepChange('payment', 'dues', v)} />
                          <Input label="Net Dues Remaining" value={formData.payment.netDues} onChange={v => handleDeepChange('payment', 'netDues', v)} />
                      </div>
                  </div>

                  {/* SECTION 5: DSE Details */}
                  <div>
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-4 flex items-center gap-2"><User className="h-4 w-4 text-slate-400" /> DSE Details</h3>
                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="md:col-span-3">
                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">DSE</label>
                            <select value={formData.dse.name} onChange={e => handleDeepChange('dse', 'name', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-transparent focus:ring-1 ${theme.ring}`}><option value="">SELECT DSE</option><option value="Ashok Sah">Ashok Sah</option></select>
                          </div>
                          <Input label="Commission" value={formData.dse.commission} onChange={v => handleDeepChange('dse', 'commission', v)} />
                          <Input label="Net Profit" value={formData.dse.netProfit} onChange={v => handleDeepChange('dse', 'netProfit', v)} />
                          <div className="md:row-span-2">
                             <Input label="Magadh Margin" value={formData.magadh.margin} onChange={v => handleDeepChange('magadh', 'margin', v)} />
                          </div>
                          <Input label="TDS (5%)" value={formData.dse.tds} onChange={v => handleDeepChange('dse', 'tds', v)} />
                          <Input label="Final Net Profit" value={formData.dse.finalNetProfit} onChange={v => handleDeepChange('dse', 'finalNetProfit', v)} />
                          <Input label="Magadh Payment Date" type="date" value={formData.magadh.paymentDate} onChange={v => handleDeepChange('magadh', 'paymentDate', v)} />
                      </div>
                  </div>

              </form>
           </div>
        </div>
      </div>
    );
  };

// ==========================================
// 5. SUB-COMPONENT: ADD RECORD FORM
// ==========================================
const AddRecord = ({ theme, onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    personal: { title: 'Mr.', firstName: '', lastName: '', fatherName: '', mobile: '', email: '' },
    address: { village: '', district: '', postOffice: '', policeStation: '', pincode: '' }
  });

  const handleChange = (section, field, value) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(formData)
      });
      if (res.ok) onSuccess(); 
      else {
          const err = await res.json();
          alert(`Error: ${err.message}`);
      }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  return (
    <div className="animate-in zoom-in-95 duration-300 flex flex-col pb-8 h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <button onClick={onBack} className="group flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
          <div className="p-1.5 rounded-lg bg-white border border-gray-200 group-hover:bg-gray-50 transition-colors"><ArrowLeft className="h-3.5 w-3.5" /></div>
          <span>Cancel</span>
        </button>
        <button onClick={handleSubmit} disabled={loading} className={`px-6 py-2 rounded-lg text-xs font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 ${theme.primary} ${loading ? 'opacity-50' : ''}`}>
            {loading ? 'Saving...' : <><Save className="h-3.5 w-3.5" /> Save Record</>}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row flex-1 min-h-0">
         <div className={`w-full md:w-1/4 ${theme.primary} relative p-8 flex flex-col justify-between overflow-hidden shrink-0`}>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10 text-white">
                <div className="flex items-center justify-between mb-6"><div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg"><User className="h-5 w-5" /></div></div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">New Customer</h1>
                <p className="text-blue-50/90 text-xs font-medium leading-relaxed">Create a new profile to start the documentation pipeline.</p>
            </div>
            {/* Stepper Steps (Visual Only) */}
            <div className="relative z-10 space-y-4">
               <div className="flex items-center gap-3 opacity-100"><div className="w-6 h-6 rounded-full bg-white text-emerald-600 flex items-center justify-center font-bold text-[10px] shadow-sm">1</div><span className="text-white text-xs font-bold">Profile Details</span></div>
               <div className="flex items-center gap-3 opacity-60"><div className="w-6 h-6 rounded-full border border-white/40 flex items-center justify-center font-bold text-[10px] text-white">2</div><span className="text-white text-xs font-medium">Challan</span></div>
               <div className="flex items-center gap-3 opacity-60"><div className="w-6 h-6 rounded-full border border-white/40 flex items-center justify-center font-bold text-[10px] text-white">3</div><span className="text-white text-xs font-medium">Agreement</span></div>
            </div>
         </div>

         <div className="flex-1 bg-slate-50/50 overflow-y-auto">
            <form className="p-6 md:p-8 space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative">
                   <div className="absolute top-5 right-5"><div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded border border-gray-200"><Hash className="h-3 w-3 text-slate-400" /><span className="text-[10px] font-mono font-bold text-slate-600">ID: AUTO</span></div></div>
                   <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User className={`h-3 w-3 ${theme.text}`} /> Personal Identity</h3>
                   <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-12 md:col-span-3"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Title</label><select onChange={e => handleChange('personal', 'title', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-transparent focus:ring-1 ${theme.ring} transition-all`}><option>Mr.</option><option>Ms.</option></select></div>
                      <div className="col-span-12 md:col-span-4"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">First Name</label><input type="text" onChange={e => handleChange('personal', 'firstName', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all`} /></div>
                      <div className="col-span-12 md:col-span-5"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Last Name</label><input type="text" onChange={e => handleChange('personal', 'lastName', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all`} /></div>
                      <div className="col-span-12 md:col-span-6"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Father's Name</label><input type="text" onChange={e => handleChange('personal', 'fatherName', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all`} /></div>
                      <div className="col-span-12 md:col-span-6"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Mobile</label><input type="text" onChange={e => handleChange('personal', 'mobile', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all`} /></div>
                   </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                   <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Home className={`h-3 w-3 ${theme.text}`} /> Residence Info</h3>
                   <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-12 md:col-span-6"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Village / Building</label><input type="text" onChange={e => handleChange('address', 'village', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all`} /></div>
                      <div className="col-span-12 md:col-span-6"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">District</label><input type="text" onChange={e => handleChange('address', 'district', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all`} /></div>
                      <div className="col-span-12 md:col-span-4"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Post Office</label><input type="text" onChange={e => handleChange('address', 'postOffice', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all`} /></div>
                      <div className="col-span-12 md:col-span-4"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Police Station</label><input type="text" onChange={e => handleChange('address', 'policeStation', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all`} /></div>
                      <div className="col-span-12 md:col-span-4"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Pincode</label><input type="text" onChange={e => handleChange('address', 'pincode', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all`} /></div>
                   </div>
                </div>
            </form>
         </div>
      </div>
    </div>
  );
};

// ==========================================
// 6. COMPONENT: CHALLAN FORM (Create & Edit)
// ==========================================
// ==========================================
// 6. COMPONENT: CHALLAN FORM (Create & Edit)
// ==========================================
// ==========================================
// 6. COMPONENT: CHALLAN FORM (Create & Edit)
// ==========================================
const ChallanForm = ({ theme, onBack, customer, onSuccess, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [availableColors, setAvailableColors] = useState([]); 
  
  // Initialize State
  const [formData, setFormData] = useState(initialData || {
    details: { 
        challanNo: '', 
        challanDate: new Date().toISOString().split('T')[0], 
        model: '', 
        dto: '', 
        make: 'RAJHANS', 
        color: '' 
    },
    registration: { productNo: '', bookNo: '', keyNo: '', batteryNo: '' },
    engine: { frameNo: '', engineNo: '', cylinderNo: '', motorNo: '' },
    ids: { aadhar: '', pan: '' },
    checklist: []
  });

  // Full Checklist
  const checklistItems = [
     "Reverse Mirror", "Ignition Lock", "Steering Lock", "Remote (Central Lock)", 
     "Remote (Music System)", "Stepney Cover", "Wheels Cap", "Driver Money Box/Bag", 
     "Tools Kit", "Battery Clamp", "Looking Glass", "Mat", "Fire Extinguisher", 
     "Luggage Carrier", "Camera", "Fan", "Cabin Light", "Jack", "Form 22", "Wiper Motor"
  ];

  // Fetch stocks on mount
  useEffect(() => {
    const fetchStocks = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/inventory`, { headers: { 'Authorization': token } });
            if (res.ok) {
                const data = await res.json();
                setStocks(data);
                // Set initial model if not set and stocks exist (Only in Create Mode)
                if (!initialData && !formData.details.model && data.length > 0) {
                    handleModelChange(data[0].modelName, data);
                } else if (initialData && initialData.details.model) {
                    const selectedStock = data.find(s => s.modelName === initialData.details.model);
                    if (selectedStock && selectedStock.colors) {
                        setAvailableColors(selectedStock.colors);
                    }
                }
            }
        } catch (e) { console.error("Failed to fetch stocks", e); }
    };
    fetchStocks();
  }, []);

  // UPDATED: Forces Uppercase on all text inputs
  const handleDeepChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { 
          ...prev[section], 
          [field]: typeof value === 'string' ? value.toUpperCase() : value 
      }
    }));
  };

  const handleModelChange = (modelName, currentStocks = stocks) => {
      const selectedStock = currentStocks.find(s => s.modelName === modelName);
      const colors = selectedStock ? selectedStock.colors : [];
      setAvailableColors(colors);

      setFormData(prev => ({
          ...prev,
          details: { 
              ...prev.details, 
              model: modelName,
              color: colors.length > 0 ? colors[0] : '' 
          }
      }));
  }

  const handleChecklist = (item) => {
    setFormData(prev => {
        const list = prev.checklist.includes(item) 
            ? prev.checklist.filter(i => i !== item)
            : [...prev.checklist, item];
        return { ...prev, checklist: list };
    });
  };

  const isFormValid = () => {
      const details = formData.details;
      if (!details.challanDate || !details.model || !details.dto || !details.make || !details.color) return false;
      
      const reg = formData.registration;
      if (!reg.productNo || !reg.bookNo || !reg.keyNo || !reg.batteryNo) return false;

      const eng = formData.engine;
      if (!eng.frameNo || !eng.engineNo || !eng.cylinderNo || !eng.motorNo) return false;
      
      return true;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
        alert("All fields are mandatory (except Checklist). Please fill in all details.");
        return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/challan`;
      let method = 'POST';
      let payload = { ...formData, customerId: customer.originalId }; 

      if (initialData && initialData._id) {
          url = `${API_URL}/challan/${initialData._id}`;
          method = 'PUT';
          payload = formData;
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': token },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) { onSuccess(); } 
      else { const err = await res.json(); alert(`Failed: ${err.message}`); }
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  return (
    <div className="animate-in zoom-in-95 duration-300 flex flex-col pb-8 h-full">
      {/* Action Bar */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="group flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
            <div className="p-1.5 rounded-lg bg-white border border-gray-200 group-hover:bg-gray-50 transition-colors"><ArrowLeft className="h-3.5 w-3.5" /></div>
            <span>Cancel</span>
            </button>
            <div className="h-4 w-px bg-gray-300"></div>
            <span className="text-xs font-bold text-slate-700">{initialData ? 'Editing' : 'Creating'} Challan for: <span className="text-slate-900">{customer?.name}</span></span>
        </div>
        <button 
            onClick={handleSubmit} 
            disabled={loading}
            className={`px-6 py-2 rounded-lg text-xs font-bold text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center gap-2 ${theme.primary} ${loading ? 'opacity-50' : ''}`}
        >
           {loading ? 'Processing...' : <><Save className="h-3.5 w-3.5" /> {initialData ? 'Update' : 'Save'} Challan</>}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row flex-1 min-h-0">
         
         {/* Left Side: Illustration / Info */}
         <div className={`w-full md:w-1/4 ${theme.primary} relative p-8 flex flex-col justify-between overflow-hidden shrink-0`}>
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10 text-white">
                <div className="flex items-center justify-between mb-6">
                   <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg"><Truck className="h-5 w-5" /></div>
                </div>
                <h1 className="text-2xl font-bold tracking-tight mb-2">{initialData ? 'Edit Details' : 'Generate Challan'}</h1>
                <p className="text-blue-50/90 text-xs font-medium leading-relaxed">{initialData ? 'Update vehicle information.' : 'Enter vehicle details. Challan number will be generated automatically.'}</p>
            </div>
         </div>

         {/* Right Side: Form */}
         <div className="flex-1 bg-slate-50/50 overflow-y-auto">
            <form className="p-6 md:p-8 space-y-6" onSubmit={e => e.preventDefault()}>
                
                {/* 1. Basic Details */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                   <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><FileText className={`h-3 w-3 ${theme.text}`} /> Basic Details</h3>
                   <div className="grid grid-cols-12 gap-4">
                      
                      {/* Auto-Generated Challan No */}
                      <div className="col-span-12 md:col-span-4">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Challan No</label>
                          <input 
                            type="text" 
                            value={initialData ? formData.details.challanNo : "Auto-generated (1001+)"} 
                            readOnly
                            className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 focus:outline-none cursor-not-allowed uppercase" 
                          />
                      </div>

                      <div className="col-span-12 md:col-span-4"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Challan Date</label><input type="date" value={formData.details.challanDate ? new Date(formData.details.challanDate).toISOString().split('T')[0] : ''} onChange={e => handleDeepChange('details', 'challanDate', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-slate-600 focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all uppercase`} /></div>
                      
                      {/* Dynamic Model Select */}
                      <div className="col-span-12 md:col-span-4">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Model</label>
                          <select 
                            value={formData.details.model} 
                            onChange={e => handleModelChange(e.target.value)} 
                            className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-transparent focus:ring-1 ${theme.ring} uppercase`}
                          >
                            <option value="">Select Model</option>
                            {stocks.map(s => <option key={s._id} value={s.modelName}>{s.modelName}</option>)}
                          </select>
                      </div>

                      {/* DTO Select or Type (Updated Options) */}
                      <div className="col-span-12 md:col-span-4">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">DTO</label>
                          <input 
                              list="dto-options"
                              value={formData.details.dto} 
                              onChange={e => handleDeepChange('details', 'dto', e.target.value)} 
                              className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-transparent focus:ring-1 ${theme.ring} uppercase`}
                              placeholder="Select DTO"
                          />
                          <datalist id="dto-options">
                              <option value="PATNA" />
                              <option value="SARAN" />
                              <option value="SONEPUR" />
                          </datalist>
                      </div>

                      <div className="col-span-12 md:col-span-4"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Make / ONE</label><input type="text" value={formData.details.make} onChange={e => handleDeepChange('details', 'make', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all uppercase`} /></div>
                      
                      {/* Dynamic Color Select (Single Selection) */}
                      <div className="col-span-12 md:col-span-4">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Color</label>
                          {availableColors.length > 0 ? (
                              <select 
                                  value={formData.details.color} 
                                  onChange={e => handleDeepChange('details', 'color', e.target.value)} 
                                  className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:border-transparent focus:ring-1 ${theme.ring} uppercase`}
                              >
                                  <option value="">Select Color</option>
                                  {availableColors.map((c, i) => (
                                      <option key={i} value={c}>{c}</option>
                                  ))}
                              </select>
                          ) : (
                              <input 
                                  type="text" 
                                  value={formData.details.color} 
                                  onChange={e => handleDeepChange('details', 'color', e.target.value)} 
                                  className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all uppercase`} 
                                  placeholder="Type Color"
                              />
                          )}
                      </div>
                   </div>
                </div>

                {/* 2. Registration Details */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                   <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Hash className={`h-3 w-3 ${theme.text}`} /> Registration Details</h3>
                   <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-6 md:col-span-3"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Product No</label><input type="text" value={formData.registration.productNo} onChange={e => handleDeepChange('registration', 'productNo', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all uppercase`} /></div>
                      <div className="col-span-6 md:col-span-3"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Book No</label><input type="text" value={formData.registration.bookNo} onChange={e => handleDeepChange('registration', 'bookNo', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all uppercase`} /></div>
                      <div className="col-span-6 md:col-span-3"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Key No</label><input type="text" value={formData.registration.keyNo} onChange={e => handleDeepChange('registration', 'keyNo', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all uppercase`} /></div>
                      <div className="col-span-6 md:col-span-3"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Battery No</label><input type="text" value={formData.registration.batteryNo} onChange={e => handleDeepChange('registration', 'batteryNo', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all uppercase`} /></div>
                   </div>
                </div>

                {/* 3. Middle Section: Engine & ID side-by-side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Engine & Frame */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity className={`h-3 w-3 ${theme.text}`} /> Engine & Frame</h3>
                        <div className="space-y-4">
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Frame No</label><input type="text" value={formData.engine.frameNo} onChange={e => handleDeepChange('engine', 'frameNo', e.target.value)} className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all uppercase`} /></div>
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Engine No</label><input type="text" value={formData.engine.engineNo} onChange={e => handleDeepChange('engine', 'engineNo', e.target.value)} className={`w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all uppercase`} /></div>
                            <div className="flex gap-4">
                                <div className="flex-1"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Cylinder No</label><input type="text" value={formData.engine.cylinderNo} onChange={e => handleDeepChange('engine', 'cylinderNo', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all uppercase`} /></div>
                                <div className="flex-1"><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Motor No</label><input type="text" value={formData.engine.motorNo} onChange={e => handleDeepChange('engine', 'motorNo', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all uppercase`} /></div>
                            </div>
                        </div>
                    </div>

                    {/* ID Proof */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><User className={`h-3 w-3 ${theme.text}`} /> ID Proof</h3>
                        <div className="space-y-4">
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Aadhar Number</label><input type="text" value={formData.ids.aadhar} onChange={e => handleDeepChange('ids', 'aadhar', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all uppercase`} /></div>
                            <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">PAN Number</label><input type="text" value={formData.ids.pan} onChange={e => handleDeepChange('ids', 'pan', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:border-transparent focus:ring-1 ${theme.ring} outline-none transition-all uppercase`} /></div>
                        </div>
                    </div>
                </div>

                {/* 4. Modern Horizontal Checklist */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <CheckCircle2 className={`h-4 w-4 ${theme.text}`} /> Delivery Checklist
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {checklistItems.map((item) => (
                            <label 
                                key={item} 
                                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 group
                                    ${formData.checklist.includes(item) 
                                        ? `bg-emerald-50 border-emerald-200 shadow-sm` 
                                        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
                                    }
                                `}
                            >
                                <div className="relative flex items-center">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.checklist.includes(item)}
                                        onChange={() => handleChecklist(item)}
                                        className="peer sr-only" 
                                    />
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all 
                                        ${formData.checklist.includes(item) 
                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                            : 'bg-white border-slate-300 text-transparent group-hover:border-slate-400'
                                        }`}
                                    >
                                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                                    </div>
                                </div>
                                <span className={`text-xs font-bold leading-tight ${formData.checklist.includes(item) ? 'text-emerald-700' : 'text-slate-600'}`}>
                                    {item}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

            </form>
         </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. SUB-COMPONENT: STATUS BADGE
// ==========================================
const StatusPipeline = ({ status, theme }) => {
   const isAllComplete = status.created && status.challan && status.agreement;
   
   if (isAllComplete) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm transition-all animate-in zoom-in">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="text-[11px] font-bold tracking-tight">Verified</span>
        </div>
      );
   }

   const steps = [{ id: 'created', label: 'Created' }, { id: 'challan', label: 'Challan' }, { id: 'agreement', label: 'Agreement' }];
   
   return (
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-full border border-gray-100 shadow-sm">
         {steps.map((step, i) => {
            const isDone = status[step.id];
            const isActive = !isDone && (i === 0 || status[steps[i-1].id]);

            return (
               <div key={step.id} className="flex items-center group relative cursor-help">
                  <div className={`
                    w-2.5 h-2.5 rounded-full transition-all duration-300
                    ${isDone 
                        ? 'bg-emerald-500' 
                        : isActive 
                            ? 'bg-white border-2 border-amber-400' 
                            : 'bg-gray-100'}
                  `}></div>
                  {i < steps.length - 1 && (
                      <div className={`w-3 h-0.5 mx-0.5 rounded-full ${status[steps[i+1].id] ? 'bg-emerald-500' : 'bg-gray-100'}`}></div>
                  )}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-slate-800 text-white text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
                      {step.label}: {isDone ? 'Done' : 'Pending'}
                  </div>
               </div>
            )
         })}
      </div>
   );
};

// ==========================================
// 8. MAIN COMPONENT: SALES
// ==========================================
const Sales = ({ theme }) => {
  const [view, setView] = useState('list');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null); 
  const [activeCustomerForAction, setActiveCustomerForAction] = useState(null);
  const [editingChallanData, setEditingChallanData] = useState(null);
  const [editingAgreementData, setEditingAgreementData] = useState(null);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token'); 
      if (!token) { console.log('No token found'); setLoading(false); return; }

      const res = await fetch(`${API_URL}/customers`, {
        headers: { 'Authorization': token }
      });
      const data = await res.json();
      
      if(Array.isArray(data)) {
        const mappedData = data.map(c => ({
            originalId: c._id,
            id: c.generatedId,
            name: `${c.personal.firstName} ${c.personal.lastName}`,
            email: c.personal.email,
            address: `${c.address.village}, ${c.address.district}`,
            pincode: c.address.pincode,
            createdAt: c.createdAt,
            pipeline: c.pipeline
        }));
        setCustomers(mappedData);
      }
    } catch (err) {
      console.error("Failed to load customers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetchCustomers();
    setView('list');
    setActiveCustomerForAction(null);
    setEditingChallanData(null);
    setEditingAgreementData(null);
  };

  const getGradients = () => {
    if (theme.primary.includes('emerald')) return ['from-emerald-500 to-teal-600', 'text-emerald-600 bg-emerald-50'];
    if (theme.primary.includes('blue')) return ['from-blue-500 to-indigo-600', 'text-blue-600 bg-blue-50'];
    if (theme.primary.includes('violet')) return ['from-violet-500 to-fuchsia-600', 'text-violet-600 bg-violet-50'];
    if (theme.primary.includes('amber')) return ['from-amber-400 to-orange-500', 'text-amber-600 bg-amber-50'];
    if (theme.primary.includes('rose')) return ['from-rose-500 to-pink-600', 'text-rose-600 bg-rose-50'];
    return ['from-slate-700 to-slate-900', 'text-slate-600 bg-slate-50'];
  };
  const [brightGradient, themeAccent] = getGradients();

  const stats = [
    { label: 'Total Customers', value: customers.length, change: '+2.5%', trend: 'up', icon: DollarSign, style: 'solid', bg: `bg-gradient-to-br ${brightGradient} text-white` },
    { label: 'Pending Challan', value: customers.filter(c => !c.pipeline.challan).length, change: '+12.5%', trend: 'up', icon: ShoppingBag, style: 'dark', bg: 'bg-slate-900 text-white' },
    { label: 'Pending Agreement', value: customers.filter(c => c.pipeline.challan && !c.pipeline.agreement).length, change: '-4.0%', trend: 'down', icon: Activity, style: 'light', bg: 'bg-white text-slate-800 border border-gray-200' },
    { label: 'Completed', value: customers.filter(c => c.pipeline.agreement).length, change: '+8.2%', trend: 'up', icon: CreditCard, style: 'light', bg: 'bg-white text-slate-800 border border-gray-200' },
  ];

  const handleWorkflowAction = (actionType, customer) => {
      setSelectedCustomer(null);
      setActiveCustomerForAction(customer);
      
      if (actionType === 'challan') {
          setEditingChallanData(null);
          setView('add-challan');
      }
      if (actionType === 'view-challan') {
          setView('view-challan');
      }
      if (actionType === 'agreement') {
          setEditingAgreementData(null);
          setView('add-agreement');
      }
      if (actionType === 'view-agreement') {
          setView('view-agreement');
      }
  };

  const handleEditChallan = (data) => {
      setEditingChallanData(data);
      setView('add-challan');
  };

  const handleEditAgreement = (data) => {
      setEditingAgreementData(data);
      setView('add-agreement');
  };

  if (view === 'add') return <AddRecord theme={theme} onBack={() => setView('list')} onSuccess={handleRefresh} />;
  
  if (view === 'view-challan') {
      return <ViewChallan theme={theme} customer={activeCustomerForAction} onBack={() => { setView('list'); setActiveCustomerForAction(null); }} onEdit={handleEditChallan} />;
  }

  if (view === 'add-challan') {
      return <ChallanForm theme={theme} customer={activeCustomerForAction} onBack={() => { setView('list'); setActiveCustomerForAction(null); }} onSuccess={handleRefresh} initialData={editingChallanData} />;
  }

  if (view === 'view-agreement') {
      return <ViewAgreement theme={theme} customer={activeCustomerForAction} onBack={() => { setView('list'); setActiveCustomerForAction(null); }} onEdit={handleEditAgreement} />;
  }

  if (view === 'add-agreement') {
      return <AgreementForm theme={theme} customer={activeCustomerForAction} onBack={() => { setView('list'); setActiveCustomerForAction(null); }} onSuccess={handleRefresh} initialData={editingAgreementData} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-20 relative">
      {selectedCustomer && <ActionModal customer={selectedCustomer} theme={theme} onClose={() => setSelectedCustomer(null)} onNavigate={(action) => handleWorkflowAction(action, selectedCustomer)} />}
      
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Management</h1><p className="text-sm text-slate-500 mt-1">Manage profiles and document pipelines.</p></div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-xs font-bold text-slate-600 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"><Calendar className="h-3.5 w-3.5 text-gray-400" /><span>Filter Date</span><ChevronDown className="h-3.5 w-3.5 text-gray-300" /></button>
           <button className={`flex items-center gap-2 px-3 py-2 text-xs font-bold text-white rounded-lg shadow-md shadow-gray-200 hover:-translate-y-0.5 transition-all ${theme.primary}`}><Download className="h-3.5 w-3.5" /><span>Export</span></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className={`relative p-5 rounded-xl shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-300 ${stat.bg} ${stat.border || ''}`}>
              {stat.style === 'solid' && (<><div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl -mr-8 -mt-8"></div><div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div></>)}
              <div className="relative z-10"><div className="flex justify-between items-start mb-4"><div className={`p-2.5 rounded-lg shadow-sm backdrop-blur-sm ${stat.style === 'solid' ? 'bg-white/20 text-white' : stat.style === 'dark' ? 'bg-slate-800 text-white border border-slate-700' : `${themeAccent}`}`}><stat.icon className="h-5 w-5" /></div></div><h3 className="text-2xl font-extrabold tracking-tight mb-0.5">{stat.value}</h3><p className={`text-xs font-bold uppercase tracking-wide opacity-70`}>{stat.label}</p></div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-4 flex-1"><h2 className="text-base font-bold text-slate-800">Records</h2><div className="h-5 w-px bg-gray-200 hidden md:block"></div><div className="relative w-full max-w-xs group"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 group-focus-within:text-slate-600 transition-colors" /><input type="text" placeholder="Search..." className={`w-full pl-9 pr-3 py-2 bg-gray-50 border border-transparent rounded-lg text-xs font-medium placeholder-gray-400 focus:bg-white focus:border-gray-200 focus:shadow-sm outline-none transition-all ${theme.ring}`} /></div></div>
           <button onClick={() => setView('add')} className={`flex items-center gap-2 px-4 py-2 text-xs font-bold text-white rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all ${theme.primary}`}><Plus className="h-3.5 w-3.5" /><span>Add Record</span></button>
        </div>

        <div className="w-full">
           <table className="w-full text-left border-collapse">
             <thead><tr className="border-b border-gray-200 bg-gray-50/60"><th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-24">ID</th><th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer</th><th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Details</th><th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Pipeline</th><th className="px-6 py-4 w-12"></th></tr></thead>
             <tbody className="divide-y divide-gray-100">
                 {loading ? (
                   <tr><td colSpan="5" className="p-8 text-center text-slate-400 text-xs font-bold">Loading records...</td></tr>
                 ) : customers.length === 0 ? (
                   <tr><td colSpan="5" className="p-8 text-center text-slate-400 text-xs font-bold">No records found. Add a new customer.</td></tr>
                 ) : customers.map((c, i) => (
                   <tr key={i} onClick={() => setSelectedCustomer(c)} className="group hover:bg-gray-50/50 transition-colors relative cursor-pointer">
                      <td className="px-6 py-5 align-middle"><span className="text-xs font-bold text-slate-600 font-mono group-hover:text-slate-900 transition-colors">{c.id}</span></td>
                      <td className="px-6 py-5 align-middle"><div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-full ${theme.light || 'bg-slate-100'} flex items-center justify-center text-slate-500`}><User className="h-5 w-5" /></div><div><p className="text-xs font-bold text-slate-800">{c.name}</p><p className="text-[10px] font-medium text-gray-400">{c.email}</p></div></div></td>
                      <td className="px-6 py-5 align-middle"><div className="flex flex-col"><span className="text-xs font-medium text-slate-700 truncate max-w-[150px]">{c.address}</span><span className="text-[10px] text-gray-400 font-mono">{c.pincode}</span></div></td>
                      <td className="px-6 py-5 align-middle"><div className="flex justify-center"><StatusPipeline status={c.pipeline} theme={theme} /></div></td>
                      <td className="px-6 py-5 align-middle text-right"><button className="p-2 hover:bg-white hover:shadow-md rounded-lg text-gray-300 hover:text-slate-600 transition-all opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></button></td>
                   </tr>
                 ))}
             </tbody>
           </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30 rounded-b-xl">
            <span className="text-[10px] font-medium text-gray-500">Showing 1-10 of {customers.length}</span>
            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] scrollbar-hide pb-1">
               <button className="min-w-[32px] h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all shrink-0 bg-white border border-gray-200 shadow-sm text-slate-900">1</button>
               <button className="min-w-[32px] h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-slate-700 shrink-0"><ChevronRight className="h-3 w-3" /></button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sales;