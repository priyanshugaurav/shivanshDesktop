import { useState, useEffect, useRef } from 'react';
import { Search, User, FileText, Download, Printer, ChevronRight, Loader2, ArrowLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = (import.meta.env.VITE_API_URL || '') + '/api';

const Invoice = ({ theme }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [invoiceData, setInvoiceData] = useState(null);
    const [fetchingInvoice, setFetchingInvoice] = useState(false);
    const [hpName, setHpName] = useState('Lok Suvidha Finance Ltd.');
    const invoiceRef = useRef(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await fetch(`${API_URL}/customers`, {
                headers: { 'Authorization': token }
            });
            const data = await res.json();
            
            if (Array.isArray(data)) {
                const mappedData = data.map(c => ({
                    originalId: c._id,
                    id: c.generatedId,
                    name: `${c.personal.firstName} ${c.personal.lastName}`,
                    mobile: c.personal.mobile,
                    address: `${c.address.village}, ${c.address.district}, ${c.address.pincode}`,
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

    const fetchInvoiceData = async (customer) => {
        setFetchingInvoice(true);
        setSelectedCustomer(customer);
        try {
            const token = localStorage.getItem('token');
            
            // Fetch Challan and Agreement
            const [challanRes, agreementRes] = await Promise.all([
                fetch(`${API_URL}/challan/${customer.originalId}`, { headers: { 'Authorization': token } }),
                fetch(`${API_URL}/agreement/${customer.originalId}`, { headers: { 'Authorization': token } })
            ]);

            let challan = null;
            let agreement = null;

            if (challanRes.ok) challan = await challanRes.json();
            if (agreementRes.ok) agreement = await agreementRes.json();

            setInvoiceData({ customer, challan, agreement });
            // Reset H.P. Name to default (user can edit it in the UI)
            setHpName('Lok Suvidha Finance Ltd.');
        } catch (err) {
            console.error("Failed to fetch invoice data", err);
        } finally {
            setFetchingInvoice(false);
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [isDownloading, setIsDownloading] = useState(false);

    const downloadPDF = async () => {
        if (!invoiceRef.current || isDownloading) return;
        
        setIsDownloading(true);
        try {
            const element = invoiceRef.current;
            
            // Wait a bit for any layout shifts
            await new Promise(resolve => setTimeout(resolve, 500));

            const canvas = await html2canvas(element, {
                scale: 2, 
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: true,
                onclone: (clonedDoc) => {
                    // Aggressively remove oklch from all style tags in the clone
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
            pdf.save(`Invoice_${selectedCustomer.name.replace(/\s+/g, '_')}.pdf`);
        } catch (err) {
            console.error("PDF Generation Error Details:", err);
            alert(`PDF Generation Failed: ${err.message || 'Unknown error'}. You can still use the "Print" button and choose "Save as PDF" in your browser.`);
        } finally {
            setIsDownloading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    const numberToWords = (num) => {
        if (num === 0) return 'Rupees Zero Only';
        
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

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] gap-6 animate-in fade-in duration-500">
            {/* LEFT PANEL: CUSTOMER LIST */}
            <div className="w-full lg:w-[350px] bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-sm font-bold text-slate-800 mb-3">Select Customer</h3>
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 group-focus-within:text-slate-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 ${theme.ring} outline-none transition-all`}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                            <Loader2 className="h-6 w-6 animate-spin mb-2" />
                            <span className="text-xs font-medium">Loading customers...</span>
                        </div>
                    ) : filteredCustomers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 p-6 text-center">
                            <User className="h-8 w-8 mb-2 opacity-20" />
                            <span className="text-xs font-medium">No customers found</span>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filteredCustomers.map((customer) => (
                                <button
                                    key={customer.originalId}
                                    onClick={() => fetchInvoiceData(customer)}
                                    className={`w-full text-left p-4 hover:bg-gray-50 transition-all flex items-center justify-between group ${selectedCustomer?.originalId === customer.originalId ? `${theme.light} border-l-4 border-${theme.primary.replace('bg-', '')}` : ''}`}
                                >
                                    <div>
                                        <p className={`text-xs font-bold transition-colors ${selectedCustomer?.originalId === customer.originalId ? theme.text : 'text-slate-800'}`}>
                                            {customer.name}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{customer.id}</p>
                                    </div>
                                    <ChevronRight className={`h-4 w-4 text-gray-300 group-hover:translate-x-0.5 transition-transform ${selectedCustomer?.originalId === customer.originalId ? theme.text : ''}`} />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: INVOICE PREVIEW */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden relative">
                {selectedCustomer ? (
                    <>
                        {/* ACTION BAR */}
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded-lg ${theme.light} ${theme.text} flex items-center justify-center`}>
                                    <FileText className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold text-slate-800">Invoice Preview</h2>
                                    <p className="text-[10px] text-gray-500 font-medium">Customer: {selectedCustomer.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-[11px]">
                                    <label className="font-semibold text-slate-500 whitespace-nowrap">H.P. Name:</label>
                                    <input
                                        type="text"
                                        value={hpName}
                                        onChange={(e) => setHpName(e.target.value)}
                                        className="px-2 py-1 text-[11px] font-bold text-slate-800 bg-white border border-gray-200 rounded-md w-[180px] focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
                                        placeholder="Finance company name"
                                    />
                                </div>
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
                                    className={`flex items-center gap-2 px-4 py-1.5 text-[11px] font-bold text-white rounded-lg shadow-sm hover:shadow-md transition-all ${isDownloading ? 'bg-gray-400 cursor-not-allowed' : theme.primary}`}
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
                            {fetchingInvoice ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Loader2 className="h-8 w-8 animate-spin mb-3" />
                                    <span className="text-sm font-medium tracking-wide">Fetching invoice data...</span>
                                </div>
                            ) : (
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
                                                <p className="text-[11px] font-bold">Invoice No. SA /26-27/{invoiceData?.agreement?.agreementId || '1001'}</p>
                                            </div>
                                            <div className="mt-auto pt-4 border-t-2 border-black -mx-2 px-2" style={{ borderColor: '#000000' }}>
                                                <p className="text-[11px] font-bold">State Code:- BIHAR-10</p>
                                            </div>
                                        </div>

                                        <div className="w-[160px] p-2 flex flex-col justify-between">
                                            <div>
                                                <p className="text-[11px] font-bold">Dated :- {new Date().toLocaleDateString('en-GB')}</p>
                                            </div>
                                            <div className="mt-auto pt-4 border-t-2 border-black -mx-2 px-2" style={{ borderColor: '#000000' }}>
                                                <p className="text-[11px] font-bold">Mode/Terms of Payment</p>
                                                <p className="text-[10px] italic font-bold">Cash/Chq/Neft,RTGS</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* BILLING & SHIPPING SECTION */}
                                    <div className="flex border-x-2 border-b-2 border-black font-bold" style={{ borderColor: '#000000' }}>
                                        <div className="w-[360px] p-2 border-r-2 border-black" style={{ borderColor: '#000000' }}>
                                            <p className="text-[10px] border-b border-black mb-1 pb-0.5" style={{ borderColor: '#000000' }}>BILLED TO</p>
                                            <h2 className="text-sm font-black uppercase">{selectedCustomer.name}</h2>
                                            <p className="text-[11px] leading-tight mt-1">{selectedCustomer.address}</p>
                                            <div className="mt-2 text-[11px] space-y-0.5">
                                                <div className="flex"><span className="w-20">State</span><span className="w-4">:</span><span>BIHAR</span></div>
                                                <div className="flex"><span className="w-20">AADHAR No.</span><span className="w-4">:</span><span>{invoiceData?.challan?.ids?.aadhar || '-'}</span></div>
                                                <div className="flex"><span className="w-20">PAN/IT No</span><span className="w-4">:</span><span>{invoiceData?.challan?.ids?.pan || '-'}</span></div>
                                                <div className="flex"><span className="w-20">GSTIN</span><span className="w-4">:</span><span>-</span></div>
                                                <div className="flex"><span className="w-20">Place of Supply</span><span className="w-4">:</span><span>Patna ( Bihar )</span></div>
                                            </div>
                                        </div>
                                        <div className="w-[360px] p-2">
                                            <p className="text-[10px] border-b border-black mb-1 pb-0.5" style={{ borderColor: '#000000' }}>SHIP TO</p>
                                            <h2 className="text-sm font-black uppercase">{selectedCustomer.name}</h2>
                                            <p className="text-[11px] leading-tight mt-1">{selectedCustomer.address}</p>
                                            <div className="mt-2 text-[11px] space-y-0.5">
                                                <div className="flex"><span className="w-20">State</span><span className="w-4">:</span><span>BIHAR</span></div>
                                                <div className="flex"><span className="w-20">AADHAR No.</span><span className="w-4">:</span><span>{invoiceData?.challan?.ids?.aadhar || '-'}</span></div>
                                                <div className="flex"><span className="w-20">PAN/IT No</span><span className="w-4">:</span><span>{invoiceData?.challan?.ids?.pan || '-'}</span></div>
                                                <div className="flex"><span className="w-20">GSTIN</span><span className="w-4">:</span><span>-</span></div>
                                                <div className="flex"><span className="w-20">Place of Supply</span><span className="w-4">:</span><span>Patna ( Bihar )</span></div>
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
                                                        <p className="font-black text-[12px] uppercase">{invoiceData?.agreement?.model?.name || 'E-RICKSHAW RAJHANS SUPER FLEXI'} {invoiceData?.challan?.details?.variant}</p>
                                                        <div className="mt-4 space-y-1 font-bold text-[10px] uppercase">
                                                            <p>BATTERY : {invoiceData?.challan?.registration?.batteryNo || '-'}</p>
                                                            <p>CHARGER : {invoiceData?.challan?.registration?.chargerNo || '-'}</p>
                                                            <p>CHASSIS NO : {invoiceData?.challan?.engine?.frameNo || '-'}</p>
                                                            <p>MOTOR NO : {invoiceData?.challan?.engine?.motorNo || '-'}</p>
                                                            <p>COLOUR : {invoiceData?.challan?.details?.color || '-'}</p>
                                                        </div>
                                                    </td>
                                                    <td className="border-r-2 border-black text-center pt-3" style={{ borderColor: '#000000' }}>87039010</td>
                                                    <td className="border-r-2 border-black text-center pt-3" style={{ borderColor: '#000000' }}>1 Pcs</td>
                                                    <td className="border-r-2 border-black text-right pt-3 px-2" style={{ borderColor: '#000000' }}>{parseFloat(invoiceData?.agreement?.model?.onRoadPrice || 185000).toFixed(2)}</td>
                                                    <td className="text-right pt-3 px-2 font-black">{parseFloat(invoiceData?.agreement?.model?.onRoadPrice || 185000).toFixed(2)}</td>
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
                                                        <td style={{ width: '100px', textAlign: 'right', padding: '8px 8px', verticalAlign: 'middle' }}>{parseFloat(invoiceData?.agreement?.model?.onRoadPrice || 185000).toFixed(2)}</td>
                                                    </tr>
                                                    <tr style={{ borderBottom: '1px solid #000000', fontWeight: 'bold', fontSize: '11px' }}>
                                                        <td style={{ borderRight: '2px solid #000000' }}></td>
                                                        <td style={{ borderRight: '2px solid #000000' }}></td>
                                                        <td style={{ borderRight: '2px solid #000000', textAlign: 'right', padding: '8px 16px', verticalAlign: 'middle' }}>CGST</td>
                                                        <td colSpan="2" style={{ borderRight: '2px solid #000000', textAlign: 'center', padding: '8px 16px', verticalAlign: 'middle' }}>2.5 %</td>
                                                        <td style={{ textAlign: 'right', padding: '8px 8px', verticalAlign: 'middle' }}>{(parseFloat(invoiceData?.agreement?.model?.onRoadPrice || 185000) * 0.025).toFixed(2)}</td>
                                                    </tr>
                                                    <tr style={{ borderBottom: '1px solid #000000', fontWeight: 'bold', fontSize: '11px' }}>
                                                        <td style={{ borderRight: '2px solid #000000' }}></td>
                                                        <td style={{ borderRight: '2px solid #000000' }}></td>
                                                        <td style={{ borderRight: '2px solid #000000', textAlign: 'right', padding: '8px 16px', verticalAlign: 'middle' }}>SGST</td>
                                                        <td colSpan="2" style={{ borderRight: '2px solid #000000', textAlign: 'center', padding: '8px 16px', verticalAlign: 'middle' }}>2.5 %</td>
                                                        <td style={{ textAlign: 'right', padding: '8px 8px', verticalAlign: 'middle' }}>{(parseFloat(invoiceData?.agreement?.model?.onRoadPrice || 185000) * 0.025).toFixed(2)}</td>
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
                                                        <td style={{ textAlign: 'right', padding: '10px 8px', verticalAlign: 'middle' }}>₹ {(parseFloat(invoiceData?.agreement?.model?.onRoadPrice || 185000) * 1.05).toFixed(2)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* AMOUNT IN WORDS */}
                                    <div style={{ border: '2px solid #000000', borderTop: 'none', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold', fontStyle: 'italic' }}>
                                        Amount (in words):- {numberToWords(Math.round(parseFloat(invoiceData?.agreement?.model?.onRoadPrice || 185000) * 1.05))}
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
                                                <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>87039010</td>
                                                <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>{parseFloat(invoiceData?.agreement?.model?.onRoadPrice || 185000).toFixed(2)}</td>
                                                <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>2.5 %</td>
                                                <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>{(parseFloat(invoiceData?.agreement?.model?.onRoadPrice || 185000) * 0.025).toFixed(2)}</td>
                                                <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>2.5 %</td>
                                                <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>{(parseFloat(invoiceData?.agreement?.model?.onRoadPrice || 185000) * 0.025).toFixed(2)}</td>
                                                <td style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle' }}>-</td>
                                                <td style={{ borderBottom: '1px solid #000000', padding: '10px 6px', verticalAlign: 'middle', fontWeight: '900' }}>{(parseFloat(invoiceData?.agreement?.model?.onRoadPrice || 185000) * 0.05).toFixed(2)}</td>
                                            </tr>
                                        </tbody>
                                    </table>

                                    {/* TAX AMOUNT IN WORDS + COMPANY BANK HEADER */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '2px solid #000000', borderTop: 'none', padding: '10px 12px', fontSize: '11px', fontWeight: 'bold' }}>
                                        <div style={{ fontStyle: 'italic', fontWeight: 'normal' }}>
                                            Tax Amt (in words) :- <span style={{ fontWeight: 'bold', textDecoration: 'underline' }}> {numberToWords(Math.round(parseFloat(invoiceData?.agreement?.model?.onRoadPrice || 185000) * 0.05))} </span>
                                        </div>
                                        <div style={{ textTransform: 'uppercase' }}>COMPANY'S BANK DETAILS</div>
                                    </div>

                                    {/* BOTTOM INFO: FINANCE & BANK - Using table for perfect PDF alignment */}
                                    <table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0, borderLeft: '2px solid #000000', borderRight: '2px solid #000000', borderBottom: '2px solid #000000', fontSize: '11px', fontWeight: 'bold' }}>
                                        <tbody>
                                            <tr>
                                                <td style={{ width: '58%', padding: '6px 8px', borderRight: '2px solid #000000', borderBottom: '2px solid #000000', verticalAlign: 'top' }}>
                                                    H.P.Name&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;{hpName}
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
                                                    Finance Amount&nbsp;&nbsp;:&nbsp;&nbsp;&nbsp;Rs.{invoiceData?.agreement?.loan?.amount || '1,60,000.00'}
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
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12 text-center">
                        <div className={`h-20 w-20 rounded-3xl ${theme.light} flex items-center justify-center mb-6 shadow-sm`}>
                            <FileText className={`h-10 w-10 ${theme.text} opacity-40`} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 mb-2">No Customer Selected</h2>
                        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                            Please select a customer from the left sidebar to generate and preview their tax invoice.
                        </p>
                    </div>
                )}
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
