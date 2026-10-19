const fs = require('fs');
const path = './frontend/src/components/SpareBilling.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Imports
content = content.replace(
    /import \{([^}]+)\} from 'lucide-react';/,
    (match, p1) => `import { ${p1.trim()}, Eye } from 'lucide-react';`
);

// 2. State
content = content.replace(
    /const \[customerPhone, setCustomerPhone\] = useState\(''\);/,
    `const [customerPhone, setCustomerPhone] = useState('');\n    const [customerVillage, setCustomerVillage] = useState('');\n    const [viewPdfDataUrl, setViewPdfDataUrl] = useState(null);`
);

// 3. handleCreateBill
content = content.replace(
    /customerPhone,\n                items: billItems,/,
    `customerPhone,\n                customerVillage,\n                items: billItems,`
);
content = content.replace(
    /setCustomerPhone\(''\);/,
    `setCustomerPhone('');\n            setCustomerVillage('');`
);

// 4. PDF Generation Logic
// We need to extract the PDF logic to a helper function.
// Replace `const handlePrintBill = (bill) => { ... }` with `const generatePdf = (bill) => { ... return doc; }; const handlePrintBill = (bill) => { const doc = generatePdf(bill); ... }; const handleViewBill = (bill) => { ... }`
content = content.replace(
    /const handlePrintBill = \(bill\) => \{/,
    `const generatePdf = (bill) => {`
);

// We need to find the save part of handlePrintBill to return the doc instead
// and create the new functions.
content = content.replace(
    /const fileName = \`Invoice_\$\{bill\.customerName\.replace\(\/\\s\+\/g, '_'\)\}_\$\{new Date\(\)\.getTime\(\)\}\.pdf\`;\n        doc\.save\(fileName\);\n    \};/,
    `return doc;\n    };\n\n    const handlePrintBill = (bill) => {\n        const doc = generatePdf(bill);\n        const fileName = \`Invoice_\$\{bill.customerName.replace(/\\s+/g, '_')\}_\$\{new Date().getTime()\}.pdf\`;\n        doc.save(fileName);\n    };\n\n    const handleViewBill = (bill) => {\n        const doc = generatePdf(bill);\n        setViewPdfDataUrl(doc.output('datauristring'));\n    };`
);

// Add Village to PDF
content = content.replace(
    /if \(bill\.customerPhone\) \{\n            doc\.text\(\`Phone: \$\{bill\.customerPhone\}\`, 14, 61\);\n        \}/,
    `let yOffset = 61;\n        if (bill.customerPhone) {\n            doc.text(\`Phone: \$\{bill.customerPhone\}\`, 14, yOffset);\n            yOffset += 5;\n        }\n        if (bill.customerVillage) {\n            doc.text(\`Village: \$\{bill.customerVillage\}\`, 14, yOffset);\n        }`
);

// 5. Dashboard Table Columns
content = content.replace(
    /<th className="py-4 px-6 text-\[10px\] font-black uppercase tracking-widest text-slate-400">Items Billed<\/th>/,
    `<th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Items Billed</th>\n                                        <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Qty</th>`
);

// 6. Dashboard Table Row
content = content.replace(
    /<td className="py-4 px-6">\n                                                <div className="flex flex-col gap-0\.5">\n                                                    \{bill\.items\.map\(\(item, idx\) => \(\n                                                        <span key=\{idx\} className="text-xs font-semibold text-slate-600">\n                                                            \{item\.qty\}x \{item\.name\}\n                                                        <\/span>\n                                                    \)\)\}\n                                                    \{bill\.labourCharge > 0 && \(\n                                                        <span className="text-xs font-bold text-slate-500 mt-1">\n                                                            \+ Labour: ₹\{bill\.labourCharge\} \(\{bill\.labourRemark \|\| 'No remark'\}\)\n                                                        <\/span>\n                                                    \)\}\n                                                    \{bill\.labourList && bill\.labourList\.map\(\(l, i\) => \(\n                                                        <span key=\{\`l-\$\{i\}\`\} className="text-xs font-bold text-slate-500 mt-1">\n                                                            \+ Labour: ₹\{l\.amount\} \(\{l\.remark\}\)\n                                                        <\/span>\n                                                    \)\)\}\n                                                <\/div>\n                                            <\/td>/,
    `<td className="py-4 px-6">\n                                                <div className="flex flex-col gap-0.5">\n                                                    {bill.items.map((item, idx) => (\n                                                        <span key={idx} className="text-xs font-semibold text-slate-600">\n                                                            {item.name}\n                                                        </span>\n                                                    ))}\n                                                    {bill.labourCharge > 0 && (\n                                                        <span className="text-xs font-bold text-slate-500 mt-1">\n                                                            + Labour: ₹{bill.labourCharge} ({bill.labourRemark || 'No remark'})\n                                                        </span>\n                                                    )}\n                                                    {bill.labourList && bill.labourList.map((l, i) => (\n                                                        <span key={\`l-\${i}\`} className="text-xs font-bold text-slate-500 mt-1">\n                                                            + Labour: ₹{l.amount} ({l.remark})\n                                                        </span>\n                                                    ))}\n                                                </div>\n                                            </td>\n                                            <td className="py-4 px-6 text-center">\n                                                <div className="flex flex-col gap-0.5 items-center">\n                                                    {bill.items.map((item, idx) => (\n                                                        <span key={idx} className="text-xs font-bold text-slate-600 bg-slate-100 px-2 rounded-md">\n                                                            {item.qty}\n                                                        </span>\n                                                    ))}\n                                                    {bill.labourCharge > 0 && (\n                                                        <span className="text-xs font-bold text-slate-400 mt-1">-</span>\n                                                    )}\n                                                    {bill.labourList && bill.labourList.map((l, i) => (\n                                                        <span key={\`l-qty-\${i}\`} className="text-xs font-bold text-slate-400 mt-1">-</span>\n                                                    ))}\n                                                </div>\n                                            </td>`
);

// 7. Add View button next to Print button
content = content.replace(
    /<button \n                                                        onClick=\{\(\) => handlePrintBill\(bill\)\}\n                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"\n                                                        title="Download PDF"\n                                                    >\n                                                        <Printer size=\{16\} \/>\n                                                    <\/button>/,
    `<button \n                                                        onClick={() => handleViewBill(bill)}\n                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"\n                                                        title="View PDF"\n                                                    >\n                                                        <Eye size={16} />\n                                                    </button>\n                                                    <button \n                                                        onClick={() => handlePrintBill(bill)}\n                                                        className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"\n                                                        title="Download PDF"\n                                                    >\n                                                        <Printer size={16} />\n                                                    </button>`
);

// 8. Add Village to Customer Form
content = content.replace(
    /<div className="grid grid-cols-1 md:grid-cols-2 gap-5">/,
    `<div className="grid grid-cols-1 md:grid-cols-3 gap-5">`
);
content = content.replace(
    /<div>\n                                    <label className="text-\[10px\] font-bold text-slate-500 uppercase block mb-1\.5">Bill Date<\/label>/,
    `<div>\n                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Village</label>\n                                    <input \n                                        type="text" \n                                        value={customerVillage}\n                                        onChange={(e) => setCustomerVillage(e.target.value)}\n                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"\n                                        placeholder="Optional"\n                                    />\n                                </div>\n                                <div>\n                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Bill Date</label>`
);

// 9. Add PDF Modal
content = content.replace(
    /<\/div>\n    \);\n\};\n\nexport default SpareBilling;/,
    `{viewPdfDataUrl && (\n                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">\n                    <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">\n                        <div className="flex justify-between items-center p-4 border-b border-slate-100">\n                            <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Bill Preview</h3>\n                            <button onClick={() => setViewPdfDataUrl(null)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">\n                                <X size={20}/>\n                            </button>\n                        </div>\n                        <div className="flex-1 p-0 rounded-b-2xl overflow-hidden">\n                            <iframe src={viewPdfDataUrl} className="w-full h-full border-none" title="PDF Preview"></iframe>\n                        </div>\n                    </div>\n                </div>\n            )}\n        </div>\n    );\n};\n\nexport default SpareBilling;`
);

fs.writeFileSync(path, content);
console.log('Patched SpareBilling.jsx');
