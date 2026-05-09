import { useState, useRef, useEffect } from 'react';
import { FileText, Download, Printer, Loader2, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const Invoice = ({ theme }) => {
    const invoiceRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);
    
    // --- Form State ---
    const [metaMode, setMetaMode] = useState('manual'); // 'manual' | 'auto'
    const [loadingAutoMeta, setLoadingAutoMeta] = useState(false);

    const [formData, setFormData] = useState({
        // Invoice Meta
        invoiceNo: 'SA /26-27/1001',
        date: new Date().toISOString().split('T')[0],
        paymentMode: 'Cash/Chq/Neft,RTGS',
        
        // Customer Info (Personal)
        customerName: '',
        addressLine1: 'ROAD PATNA',
        addressLine2: 'PATNA, 800023',
        state: 'BIHAR',
        
        // IDs
        aadharNo: '',
        panNo: '',
        gstin: '-',
        placeOfSupply: 'Patna ( Bihar )',
        
        // Vehicle (Model)
        modelName: 'E-RICKSHAW RAJHANS SUPER FLEXI LITHIUM ION',
        
        // Numbers
        batteryNo: '',
        chargerNo: '',
        chassisNo: '',
        motorNo: '',
        color: 'BLUE',
        
        // Pricing
        hsnSac: '87039010',
        qty: '1 Pcs',
        rate: '185000.00',
        cgstPercent: '2.5',
        sgstPercent: '2.5',
        
        // Finance
        hpName: 'Lok Suvidha Finance Ltd.',
        financeAmount: '1,60,000.00'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAutoMeta = async () => {
        if (metaMode !== 'auto') return;
        setLoadingAutoMeta(true);
        try {
            const token = localStorage.getItem('token');
            // Fetch agreements to get the latest agreement ID / invoice no
            const res = await fetch(`${API_URL}/agreements/registration-queue`, {
                headers: { 'Authorization': token }
            });
            if (res.ok) {
                const agreements = await res.json();
                let nextNo = 1001;
                if (agreements && agreements.length > 0) {
                    // Find highest agreement ID
                    const maxId = Math.max(...agreements.map(a => parseInt(a.agreementId) || 0));
                    if (maxId > 0) nextNo = maxId + 1;
                }
                setFormData(prev => ({
                    ...prev,
                    invoiceNo: `SA /26-27/${nextNo}`,
                    date: new Date().toISOString().split('T')[0]
                }));
            }
        } catch (error) {
            console.error("Failed to fetch auto meta", error);
        } finally {
            setLoadingAutoMeta(false);
        }
    };

    useEffect(() => {
        if (metaMode === 'auto') {
            handleAutoMeta();
        }
    }, [metaMode]);

    // --- Helpers ---
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount || 0);
    };

    const numberToWords = (num) => {
        if (!num || isNaN(num) || num === 0) return 'Rupees Zero Only';
        
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const inWords = (n) => {
            if ((n = n.toString()).length > 9) return 'overflow';
            let n_arr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n_arr) return ''; 
            let str = '';
            str += (parseInt(n_arr[1]) !== 0) ? (a[Number(n_arr[1])] || b[n_arr[1][0]] + ' ' + a[n_arr[1][1]]) + 'Crore ' : '';
            str += (parseInt(n_arr[2]) !== 0) ? (a[Number(n_arr[2])] || b[n_arr[2][0]] + ' ' + a[n_arr[2][1]]) + 'Lakh ' : '';
            str += (parseInt(n_arr[3]) !== 0) ? (a[Number(n_arr[3])] || b[n_arr[3][0]] + ' ' + a[n_arr[3][1]]) + 'Thousand ' : '';
            str += (parseInt(n_arr[4]) !== 0) ? (a[Number(n_arr[4])] || b[n_arr[4][0]] + ' ' + a[n_arr[4][1]]) + 'Hundred ' : '';
            str += (parseInt(n_arr[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) : '';
            return str;
        };

        const [whole, decimal] = num.toString().split('.');
        let res = 'Rupees ' + inWords(parseInt(whole)) + ' Only';
        
        if (decimal && parseInt(decimal) > 0) {
            res = 'Rupees ' + inWords(parseInt(whole)) + ' and ' + inWords(parseInt(decimal.padEnd(2, '0').slice(0, 2))) + ' Paisa Only';
        }
        
        return res.replace(/\s+/g, ' ').trim();
    };

    const downloadPDF = async () => {
        if (!invoiceRef.current || isDownloading) return;
        
        setIsDownloading(true);
        try {
            const element = invoiceRef.current;
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(element, {
                scale: 2, 
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                onclone: (clonedDoc) => {
                    const styles = clonedDoc.querySelectorAll('style');
                    styles.forEach(style => {
                        if (style.innerHTML.includes('oklch')) {
                            style.innerHTML = style.innerHTML.replace(/oklch\([^)]+\)/g, '#333333');
                        }
                    });
                    
                    const clonedElement = clonedDoc.querySelector('.invoice-container');
                    if (clonedElement) {
                        clonedElement.style.boxShadow = 'none';
                        clonedElement.style.margin = '0';
                        clonedElement.style.padding = '40px';
                        clonedElement.style.width = '800px';
                        clonedElement.style.backgroundColor = '#ffffff';
                    }
                }
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Invoice_${formData.customerName.replace(/\s+/g, '_') || 'Draft'}.pdf`);
        } catch (err) {
            console.error("PDF Generation Error Details:", err);
            alert(`PDF Generation Failed: ${err.message || 'Unknown error'}.`);
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // --- Calculations ---
    const rateValue = parseFloat(formData.rate) || 0;
    const cgstValue = rateValue * (parseFloat(formData.cgstPercent) / 100) || 0;
    const sgstValue = rateValue * (parseFloat(formData.sgstPercent) / 100) || 0;
    const totalTaxValue = cgstValue + sgstValue;
    const totalInvoiceValue = rateValue + totalTaxValue;

    // Format Date for preview
    const previewDate = formData.date ? new Date(formData.date).toLocaleDateString('en-GB') : '';

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 animate-in fade-in duration-500">
            {/* LEFT PANEL: ENTRY FORM */}
            <div className="w-full lg:w-[450px] bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">Invoice Details</h3>
                    <div className="flex gap-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">Manual Entry</span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                    
                    {/* Invoice Meta */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Invoice Meta</h4>
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                                <button 
                                    onClick={() => setMetaMode('manual')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${metaMode === 'manual' ? 'bg-white shadow-sm text-slate-800' : 'text-gray-500 hover:text-slate-700'}`}
                                >
                                    Manual
                                </button>
                                <button 
                                    onClick={() => setMetaMode('auto')}
                                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${metaMode === 'auto' ? 'bg-white shadow-sm text-slate-800' : 'text-gray-500 hover:text-slate-700'}`}
                                >
                                    {loadingAutoMeta && <Loader2 className="w-3 h-3 animate-spin" />}
                                    Auto
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">Invoice No.</label>
                                <input type="text" name="invoiceNo" value={formData.invoiceNo} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">Date</label>
                                <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">Payment Mode</label>
                                <input type="text" name="paymentMode" value={formData.paymentMode} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-gray-100 pb-2">Personal Details</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">Customer Name</label>
                                <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} placeholder="e.g. VISHAL KUMAR" className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Address Line 1</label>
                                    <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="e.g. ROAD PATNA" className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Address Line 2</label>
                                    <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="e.g. PATNA, 800023" className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">State</label>
                                <input type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* IDs */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-gray-100 pb-2">ID Numbers</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">Aadhar No.</label>
                                <input type="text" name="aadharNo" value={formData.aadharNo} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">PAN / IT No.</label>
                                <input type="text" name="panNo" value={formData.panNo} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">GSTIN</label>
                                <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">Place of Supply</label>
                                <input type="text" name="placeOfSupply" value={formData.placeOfSupply} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Vehicle & Numbers */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-gray-100 pb-2">Vehicle & Numbers</h4>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">Model Name & Variant</label>
                                <input type="text" name="modelName" value={formData.modelName} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Battery No.</label>
                                    <input type="text" name="batteryNo" value={formData.batteryNo} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Charger No.</label>
                                    <input type="text" name="chargerNo" value={formData.chargerNo} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Chassis No.</label>
                                    <input type="text" name="chassisNo" value={formData.chassisNo} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Motor No.</label>
                                    <input type="text" name="motorNo" value={formData.motorNo} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1">Color</label>
                                    <input type="text" name="color" value={formData.color} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-gray-100 pb-2">Pricing (Manual)</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">Rate (Taxable Value)</label>
                                <input type="number" name="rate" value={formData.rate} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">HSN/SAC</label>
                                <input type="text" name="hsnSac" value={formData.hsnSac} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">CGST (%)</label>
                                <input type="number" step="0.1" name="cgstPercent" value={formData.cgstPercent} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">SGST (%)</label>
                                <input type="number" step="0.1" name="sgstPercent" value={formData.sgstPercent} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Finance */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-gray-100 pb-2">Finance</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">H.P. Name</label>
                                <input type="text" name="hpName" value={formData.hpName} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-gray-500 mb-1">Finance Amount</label>
                                <input type="text" name="financeAmount" value={formData.financeAmount} onChange={handleChange} className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* RIGHT PANEL: INVOICE PREVIEW */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden relative">
                {/* ACTION BAR */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg ${theme?.light || 'bg-blue-50'} ${theme?.text || 'text-blue-600'} flex items-center justify-center`}>
                            <FileText className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">Live Preview</h2>
                            <p className="text-[10px] text-gray-500 font-medium">Updates as you type</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Printer className="h-3.5 w-3.5" />
                            <span>Print</span>
                        </button>
                        <button
                            onClick={downloadPDF}
                            disabled={isDownloading}
                            className={`flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold text-white rounded-lg shadow-sm hover:shadow-md transition-all ${isDownloading ? 'bg-gray-400 cursor-not-allowed' : (theme?.primary || 'bg-blue-600')}`}
                        >
                            {isDownloading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Download className="h-3.5 w-3.5" />
                            )}
                            <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
                        </button>
                    </div>
                </div>

                {/* PREVIEW CONTENT */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 print:bg-white print:p-0">
                    <div 
                        ref={invoiceRef}
                        className="mx-auto bg-white p-[40px] font-serif text-[#333] invoice-container"
                        style={{ width: '800px', minHeight: '1120px', backgroundColor: '#ffffff', color: '#333333' }}
                    >
                        {/* TAX INVOICE HEADER */}
                        <div className="text-center border-2 border-black py-1 font-bold text-lg mb-0 uppercase tracking-widest" style={{ borderColor: '#000000' }}>
                            TAX INVOICE
                        </div>

                        {/* TOP SECTION: COMPANY & INVOICE INFO */}
                        <div className="flex border-x-2 border-b-2 border-black" style={{ borderColor: '#000000' }}>
                            <div className="w-[400px] p-2 border-r-2 border-black" style={{ borderColor: '#000000' }}>
                                <h1 className="font-black text-xl leading-tight uppercase">SHIVANSH AUTO ENTERPRISES</h1>
                                <p className="text-[11px] leading-tight font-bold mt-1">NEW BELDARICHAK,</p>
                                <p className="text-[11px] leading-tight font-bold">PUNPUN-PARSA MAIN ROAD,</p>
                                <p className="text-[11px] leading-tight font-bold">MAUJA RAMPUR, CHIHUT,</p>
                                <p className="text-[11px] leading-tight font-bold uppercase">PATNA-804453 ( BIHAR )</p>
                                
                                <div className="mt-4 grid grid-cols-12 text-[11px] font-bold">
                                    <div className="col-span-3">GSTIN:</div>
                                    <div className="col-span-9">10BRHPK3120L1Z7</div>
                                    <div className="col-span-3">PAN:</div>
                                    <div className="col-span-9">BRHPK3120L</div>
                                    <div className="col-span-3">Cont No.</div>
                                    <div className="col-span-9">9304258184</div>
                                    <div className="col-span-3">E-Mail:</div>
                                    <div className="col-span-9 underline" style={{ color: '#2563eb' }}>shivanshautoenterprises@gmail.com</div>
                                </div>
                            </div>
                            
                            <div className="w-[160px] p-2 border-r-2 border-black flex flex-col justify-between" style={{ borderColor: '#000000' }}>
                                <div>
                                    <p className="text-[11px] font-bold">Invoice No. {formData.invoiceNo}</p>
                                </div>
                                <div className="mt-auto pt-4 border-t-2 border-black -mx-2 px-2" style={{ borderColor: '#000000' }}>
                                    <p className="text-[11px] font-bold">State Code:- BIHAR-10</p>
                                </div>
                            </div>

                            <div className="w-[160px] p-2 flex flex-col justify-between">
                                <div>
                                    <p className="text-[11px] font-bold">Dated :- {previewDate}</p>
                                </div>
                                <div className="mt-auto pt-4 border-t-2 border-black -mx-2 px-2" style={{ borderColor: '#000000' }}>
                                    <p className="text-[11px] font-bold">Mode/Terms of Payment</p>
                                    <p className="text-[10px] italic font-bold">{formData.paymentMode}</p>
                                </div>
                            </div>
                        </div>

                        {/* BILLING & SHIPPING SECTION */}
                        <div className="flex border-x-2 border-b-2 border-black font-bold" style={{ borderColor: '#000000' }}>
                            <div className="w-[360px] p-2 border-r-2 border-black" style={{ borderColor: '#000000' }}>
                                <p className="text-[10px] border-b border-black mb-1 pb-0.5" style={{ borderColor: '#000000' }}>BILLED TO</p>
                                <h2 className="text-sm font-black uppercase">{formData.customerName || '-'}</h2>
                                <p className="text-[11px] leading-tight mt-1">{formData.addressLine1}</p>
                                <p className="text-[11px] leading-tight">{formData.addressLine2}</p>
                                <div className="mt-2 text-[11px] space-y-0.5">
                                    <div className="flex"><span className="w-20">State</span><span className="w-4">:</span><span>{formData.state}</span></div>
                                    <div className="flex"><span className="w-20">AADHAR No.</span><span className="w-4">:</span><span>{formData.aadharNo || '-'}</span></div>
                                    <div className="flex"><span className="w-20">PAN/IT No</span><span className="w-4">:</span><span>{formData.panNo || '-'}</span></div>
                                    <div className="flex"><span className="w-20">GSTIN</span><span className="w-4">:</span><span>{formData.gstin || '-'}</span></div>
                                    <div className="flex"><span className="w-20">Place of Supply</span><span className="w-4">:</span><span>{formData.placeOfSupply}</span></div>
                                </div>
                            </div>
                            <div className="w-[360px] p-2">
                                <p className="text-[10px] border-b border-black mb-1 pb-0.5" style={{ borderColor: '#000000' }}>SHIP TO</p>
                                <h2 className="text-sm font-black uppercase">{formData.customerName || '-'}</h2>
                                <p className="text-[11px] leading-tight mt-1">{formData.addressLine1}</p>
                                <p className="text-[11px] leading-tight">{formData.addressLine2}</p>
                                <div className="mt-2 text-[11px] space-y-0.5">
                                    <div className="flex"><span className="w-20">State</span><span className="w-4">:</span><span>{formData.state}</span></div>
                                    <div className="flex"><span className="w-20">AADHAR No.</span><span className="w-4">:</span><span>{formData.aadharNo || '-'}</span></div>
                                    <div className="flex"><span className="w-20">PAN/IT No</span><span className="w-4">:</span><span>{formData.panNo || '-'}</span></div>
                                    <div className="flex"><span className="w-20">GSTIN</span><span className="w-4">:</span><span>{formData.gstin || '-'}</span></div>
                                    <div className="flex"><span className="w-20">Place of Supply</span><span className="w-4">:</span><span>{formData.placeOfSupply}</span></div>
                                </div>
                            </div>
                        </div>

                        {/* PRODUCTS TABLE */}
                        <div className="border-x-2 border-black min-h-[350px] relative overflow-hidden" style={{ borderColor: '#000000' }}>
                            <table className="w-full border-collapse" style={{ tableLayout: 'fixed', borderSpacing: 0 }}>
                                <thead>
                                    <tr className="border-b-2 border-black text-[11px] font-bold text-center" style={{ borderColor: '#000000' }}>
                                        <th className="border-r-2 border-black py-2" style={{ width: '60px', borderColor: '#000000' }}>Sl No.</th>
                                        <th className="border-r-2 border-black py-2" style={{ width: '300px', borderColor: '#000000' }}>Particulars</th>
                                        <th className="border-r-2 border-black py-2" style={{ width: '100px', borderColor: '#000000' }}>HSN/SAC</th>
                                        <th className="border-r-2 border-black py-2" style={{ width: '60px', borderColor: '#000000' }}>QTY</th>
                                        <th className="border-r-2 border-black py-2" style={{ width: '100px', borderColor: '#000000' }}>RATE</th>
                                        <th className="py-2" style={{ width: '100px' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="text-[11px] font-bold align-top">
                                        <td className="border-r-2 border-black text-center pt-3 italic h-[280px]" style={{ borderColor: '#000000' }}>01.</td>
                                        <td className="border-r-2 border-black p-3" style={{ borderColor: '#000000' }}>
                                            <p className="font-black text-[12px] uppercase">{formData.modelName}</p>
                                            <div className="mt-4 space-y-1 font-bold text-[10px] uppercase">
                                                <p>BATTERY : {formData.batteryNo || '-'}</p>
                                                <p>CHARGER : {formData.chargerNo || '-'}</p>
                                                <p>CHASSIS NO : {formData.chassisNo || '-'}</p>
                                                <p>MOTOR NO : {formData.motorNo || '-'}</p>
                                                <p>COLOUR : {formData.color || '-'}</p>
                                            </div>
                                        </td>
                                        <td className="border-r-2 border-black text-center pt-3" style={{ borderColor: '#000000' }}>{formData.hsnSac}</td>
                                        <td className="border-r-2 border-black text-center pt-3" style={{ borderColor: '#000000' }}>{formData.qty}</td>
                                        <td className="border-r-2 border-black text-right pt-3 px-2" style={{ borderColor: '#000000' }}>{formatCurrency(rateValue)}</td>
                                        <td className="text-right pt-3 px-2 font-black">{formatCurrency(rateValue)}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* TOTALS SECTION */}
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, borderTop: '2px solid #000000', backgroundColor: '#ffffff' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0, tableLayout: 'fixed' }}>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid #000000', fontWeight: 'bold', fontSize: '11px' }}>
                                            <td style={{ width: '60px', borderRight: '2px solid #000000' }}></td>
                                            <td style={{ width: '300px', borderRight: '2px solid #000000' }}></td>
                                            <td style={{ width: '100px', borderRight: '2px solid #000000' }}></td>
                                            <td colSpan="2" style={{ width: '160px', borderRight: '2px solid #000000', textAlign: 'right', padding: '8px 16px', verticalAlign: 'middle' }}>Taxable Value</td>
                                            <td style={{ width: '100px', textAlign: 'right', padding: '8px 8px', verticalAlign: 'middle' }}>{formatCurrency(rateValue)}</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #000000', fontWeight: 'bold', fontSize: '11px' }}>
                                            <td style={{ borderRight: '2px solid #000000' }}></td>
                                            <td style={{ borderRight: '2px solid #000000' }}></td>
                                            <td style={{ borderRight: '2px solid #000000', textAlign: 'right', padding: '8px 16px', verticalAlign: 'middle' }}>CGST</td>
                                            <td colSpan="2" style={{ borderRight: '2px solid #000000', textAlign: 'center', padding: '8px 16px', verticalAlign: 'middle' }}>{formData.cgstPercent} %</td>
                                            <td style={{ textAlign: 'right', padding: '8px 8px', verticalAlign: 'middle' }}>{formatCurrency(cgstValue)}</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #000000', fontWeight: 'bold', fontSize: '11px' }}>
                                            <td style={{ borderRight: '2px solid #000000' }}></td>
                                            <td style={{ borderRight: '2px solid #000000' }}></td>
                                            <td style={{ borderRight: '2px solid #000000', textAlign: 'right', padding: '8px 16px', verticalAlign: 'middle' }}>SGST</td>
                                            <td colSpan="2" style={{ borderRight: '2px solid #000000', textAlign: 'center', padding: '8px 16px', verticalAlign: 'middle' }}>{formData.sgstPercent} %</td>
                                            <td style={{ textAlign: 'right', padding: '8px 8px', verticalAlign: 'middle' }}>{formatCurrency(sgstValue)}</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #000000', fontWeight: 'bold', fontSize: '11px' }}>
                                            <td style={{ borderRight: '2px solid #000000' }}></td>
                                            <td style={{ borderRight: '2px solid #000000' }}></td>
                                            <td style={{ borderRight: '2px solid #000000' }}></td>
                                            <td colSpan="2" style={{ borderRight: '2px solid #000000', textAlign: 'right', padding: '8px 16px', verticalAlign: 'middle' }}>R/Off</td>
                                            <td style={{ textAlign: 'right', padding: '8px 8px', verticalAlign: 'middle' }}>0.00</td>
                                        </tr>
                                        <tr style={{ fontWeight: '900', fontSize: '13px', textTransform: 'uppercase' }}>
                                            <td style={{ borderRight: '2px solid #000000' }}></td>
                                            <td style={{ borderRight: '2px solid #000000' }}></td>
                                            <td style={{ borderRight: '2px solid #000000' }}></td>
                                            <td colSpan="2" style={{ borderRight: '2px solid #000000', textAlign: 'right', padding: '10px 16px', verticalAlign: 'middle' }}>TOTAL</td>
                                            <td style={{ textAlign: 'right', padding: '10px 8px', verticalAlign: 'middle' }}>₹ {formatCurrency(totalInvoiceValue)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* AMOUNT IN WORDS */}
                        <div style={{ border: '2px solid #000000', borderTop: 'none', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', fontStyle: 'italic' }}>
                            Amount (in words):- {numberToWords(Math.round(totalInvoiceValue))}
                        </div>

                        {/* TAX SUMMARY TABLE */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0, fontSize: '10px', fontWeight: 'bold', textAlign: 'center', borderLeft: '2px solid #000000', borderRight: '2px solid #000000' }}>
                            <thead>
                                <tr>
                                    <th rowSpan="2" style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '8px 6px', width: '90px', verticalAlign: 'middle' }}>HSN/SAC</th>
                                    <th rowSpan="2" style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '8px 6px', width: '100px', verticalAlign: 'middle' }}>Taxable Value</th>
                                    <th colSpan="2" style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '6px', verticalAlign: 'middle' }}>CGST</th>
                                    <th colSpan="2" style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '6px', verticalAlign: 'middle' }}>SGST</th>
                                    <th colSpan="2" style={{ borderBottom: '1px solid #000000', padding: '6px', verticalAlign: 'middle' }}>Total Tax</th>
                                </tr>
                                <tr>
                                    <th style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '6px', fontWeight: 'normal', fontStyle: 'italic' }}>Rate</th>
                                    <th style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '6px', fontWeight: 'normal', fontStyle: 'italic' }}>Amount</th>
                                    <th style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '6px', fontWeight: 'normal', fontStyle: 'italic' }}>Rate</th>
                                    <th style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '6px', fontWeight: 'normal', fontStyle: 'italic' }}>Amount</th>
                                    <th style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '6px', fontWeight: 'normal', fontStyle: 'italic' }}>Rate</th>
                                    <th style={{ borderBottom: '1px solid #000000', padding: '6px', fontWeight: 'normal', fontStyle: 'italic' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>{formData.hsnSac}</td>
                                    <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>{formatCurrency(rateValue)}</td>
                                    <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>{formData.cgstPercent} %</td>
                                    <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>{formatCurrency(cgstValue)}</td>
                                    <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>{formData.sgstPercent} %</td>
                                    <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>{formatCurrency(sgstValue)}</td>
                                    <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>-</td>
                                    <td style={{ borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle', fontWeight: '900' }}>{formatCurrency(totalTaxValue)}</td>
                                </tr>
                            </tbody>
                        </table>

                        {/* TAX AMOUNT IN WORDS + COMPANY BANK HEADER */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '2px solid #000000', borderTop: 'none', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold' }}>
                            <div style={{ fontStyle: 'italic', fontWeight: 'normal' }}>
                                Tax Amt (in words) :- <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}> {numberToWords(Math.round(totalTaxValue))} </span>
                            </div>
                            <div style={{ textTransform: 'uppercase' }}>COMPANY'S BANK DETAILS</div>
                        </div>

                        {/* BOTTOM INFO: FINANCE & BANK */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0, borderLeft: '2px solid #000000', borderRight: '2px solid #000000', borderBottom: '2px solid #000000', fontSize: '11px', fontWeight: 'bold' }}>
                            <tbody>
                                <tr>
                                    <td style={{ width: '58%', padding: '6px 8px', borderRight: '2px solid #000000', borderBottom: '2px solid #000000', verticalAlign: 'top' }}>
                                        H.P.Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;{formData.hpName}
                                    </td>
                                    <td rowSpan="2" style={{ width: '42%', padding: '0', verticalAlign: 'top', borderBottom: '2px solid #000000' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0 }}>
                                            <tbody>
                                                <tr><td style={{ padding: '4px 8px', borderBottom: '1px solid #e5e7eb', width: '45%' }}>Bank Name :</td><td style={{ padding: '4px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: '900', textTransform: 'uppercase' }}>IDFC FIRST BANK</td></tr>
                                                <tr><td style={{ padding: '4px 8px', borderBottom: '1px solid #e5e7eb' }}>Account No. :</td><td style={{ padding: '4px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: '900', textTransform: 'uppercase' }}>52502199281</td></tr>
                                                <tr><td style={{ padding: '4px 8px', borderBottom: '1px solid #e5e7eb' }}>IFS Code :</td><td style={{ padding: '4px 8px', borderBottom: '1px solid #e5e7eb', fontWeight: '900', textTransform: 'uppercase' }}>IDFB0060283</td></tr>
                                                <tr><td style={{ padding: '4px 8px' }}>Branch Name</td><td style={{ padding: '4px 8px', fontWeight: '900', textTransform: 'uppercase' }}>Exhibition Road</td></tr>
                                            </tbody>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '6px 8px', borderRight: '2px solid #000000', borderBottom: '2px solid #000000', verticalAlign: 'top' }}>
                                        Finance Amount&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;Rs.{formData.financeAmount}
                                    </td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '8px', borderRight: '2px solid #000000', verticalAlign: 'top', fontStyle: 'italic' }}>
                                        <p style={{ fontSize: '10px', textDecoration: 'underline', marginBottom: '8px' }}>Declaration</p>
                                        <p style={{ fontSize: '9px', lineHeight: '1.3', fontWeight: 'normal' }}>we declare that this invoice shows the actual price of the services described and that all particulars are true and correct.</p>
                                    </td>
                                    <td style={{ padding: '12px 8px', verticalAlign: 'top', textAlign: 'center' }}>
                                        <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '20px' }}>for SHIVANSH AUTO ENTERPRISES</p>
                                        <div style={{ width: '120px', height: '30px', margin: '0 auto', borderBottom: '1px dashed #999' }}></div>
                                        <p style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', marginTop: '8px' }}>Authorised Signatory</p>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        {/* FOOTER */}
                        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <p>SUBJECT TO PATNA JURISDICTION</p>
                            <p style={{ fontWeight: 'normal', fontStyle: 'italic', marginTop: '4px' }}>This is a Computer Generated Invoice</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .invoice-container, .invoice-container * {
                        visibility: visible;
                    }
                    .invoice-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        box-shadow: none !important;
                        border: none;
                    }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
};

export default Invoice;
