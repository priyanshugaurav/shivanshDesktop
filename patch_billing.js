const fs = require('fs');
const path = './frontend/src/components/SpareBilling.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. State
content = content.replace(
    /const \[submitting, setSubmitting\] = useState\(false\);/,
    `const [submitting, setSubmitting] = useState(false);\n\n    const [isFreeService, setIsFreeService] = useState(false);\n    const [serviceNumber, setServiceNumber] = useState('');\n    const [selectedSpareDiscount, setSelectedSpareDiscount] = useState('');\n    const [labourDiscount, setLabourDiscount] = useState('');`
);

// 2. handleAddItemToBill
content = content.replace(
    /const existingItemIndex = billItems.findIndex\(item => item\.stockId === spare\._id\);/,
    `const existingItemIndex = billItems.findIndex(item => item.stockId === spare._id && (item.discount || 0) === (Number(selectedSpareDiscount) || 0));`
);
content = content.replace(
    /sellingPrice: Number\(selectedSparePrice\)\n                }\n            \]\);/,
    `sellingPrice: Number(selectedSparePrice),\n                    discount: Number(selectedSpareDiscount) || 0\n                }\n            ]);`
);
content = content.replace(
    /setSelectedSpareQty\(1\);/,
    `setSelectedSpareQty(1);\n        setSelectedSpareDiscount('');`
);

// 3. handleCreateBill
content = content.replace(
    /const itemsTotal = billItems\.reduce\(\(sum, item\) => sum \+ \(item\.qty \* item\.sellingPrice\), 0\);\n        const labourTotal = labourList\.reduce\(\(sum, l\) => sum \+ \(Number\(l\.amount\) \|\| 0\), 0\);\n        const totalAmount = itemsTotal \+ labourTotal;/,
    `const itemsTotal = billItems.reduce((sum, item) => sum + (item.qty * item.sellingPrice * (1 - (item.discount || 0)/100)), 0);\n        let labourTotal = 0;\n        if (!(isFreeService && serviceNumber)) {\n            labourTotal = labourList.reduce((sum, l) => sum + ((Number(l.amount) || 0) * (1 - (l.discount || 0)/100)), 0);\n        }\n        const totalAmount = itemsTotal + labourTotal;`
);

content = content.replace(
    /labourList,\n                createdAt: billDate/,
    `labourList,\n                isFreeService,\n                serviceNumber,\n                createdAt: billDate`
);

content = content.replace(
    /setLabourRemark\(''\);\n            setBillDate\(new Date\(\)\.toISOString\(\)\.split\('T'\)\[0\]\);\n            setBillItems\(\[\]\);\n            setSelectedCategory\(''\);/,
    `setLabourRemark('');\n            setLabourDiscount('');\n            setIsFreeService(false);\n            setServiceNumber('');\n            setBillDate(new Date().toISOString().split('T')[0]);\n            setBillItems([]);\n            setSelectedCategory('');\n            setSelectedSpareDiscount('');`
);

// 4. handlePrintBill
content = content.replace(
    /const rowTotal = item\.qty \* item\.sellingPrice;\n            subTotal \+= rowTotal;\n            tableRows\.push\(\[\n                index \+ 1,\n                item\.name,/,
    `const itemDiscount = item.discount || 0;\n            const discountedPrice = item.sellingPrice * (1 - itemDiscount / 100);\n            const rowTotal = item.qty * discountedPrice;\n            subTotal += rowTotal;\n            let description = item.name;\n            if (itemDiscount > 0) description += \` (\${itemDiscount}% Off)\`;\n            tableRows.push([\n                index + 1,\n                description,`
);

content = content.replace(
    /let labourIndex = bill\.items\.length \+ 1;\n        if \(bill\.labourCharge > 0\) {\n            subTotal \+= bill\.labourCharge;\n            tableRows\.push\(\[\n                labourIndex\+\+,\n                \`Labour Charge: \$\{bill\.labourRemark \|\| ''\}\`,\n                "-",\n                "-",\n                \`Rs\. \$\{bill\.labourCharge\.toLocaleString\(\)\}\`\n            \]\);\n        }\n        \n        if \(bill\.labourList && bill\.labourList\.length > 0\) {\n            bill\.labourList\.forEach\(l => {\n                subTotal \+= l\.amount;\n                tableRows\.push\(\[\n                    labourIndex\+\+,\n                    \`Labour: \$\{l\.remark\}\`,\n                    "-",\n                    "-",\n                    \`Rs\. \$\{l\.amount\.toLocaleString\(\)\}\`\n                \]\);\n            }\);\n        }/,
    `let labourIndex = bill.items.length + 1;\n        const freeServiceMode = bill.isFreeService && bill.serviceNumber;\n        if (bill.labourCharge > 0) {\n            const rowTotal = freeServiceMode ? 0 : bill.labourCharge;\n            subTotal += rowTotal;\n            let desc = \`Labour Charge: \${bill.labourRemark || ''}\`;\n            if (freeServiceMode) desc += \` (Free Service \${bill.serviceNumber})\`;\n            tableRows.push([\n                labourIndex++,\n                desc,\n                "-",\n                "-",\n                \`Rs. \${rowTotal.toLocaleString()}\`\n            ]);\n        }\n        if (bill.labourList && bill.labourList.length > 0) {\n            bill.labourList.forEach(l => {\n                const lDisc = l.discount || 0;\n                let rowTotal = l.amount * (1 - lDisc / 100);\n                if (freeServiceMode) rowTotal = 0;\n                subTotal += rowTotal;\n                let desc = \`Labour: \${l.remark}\`;\n                if (freeServiceMode) desc += \` (Free Service \${bill.serviceNumber})\`;\n                else if (lDisc > 0) desc += \` (\${lDisc}% Off)\`;\n                tableRows.push([\n                    labourIndex++,\n                    desc,\n                    "-",\n                    "-",\n                    \`Rs. \${rowTotal.toLocaleString()}\`\n                ]);\n            });\n        }`
);

// 5. totalBillAmount
content = content.replace(
    /const totalBillAmount = billItems\.reduce\(\(sum, item\) => sum \+ \(item\.qty \* item\.sellingPrice\), 0\) \+ labourList\.reduce\(\(sum, l\) => sum \+ \(Number\(l\.amount\) \|\| 0\), 0\);/,
    `const totalBillAmount = billItems.reduce((sum, item) => sum + (item.qty * item.sellingPrice * (1 - (item.discount || 0)/100)), 0) + ((isFreeService && serviceNumber) ? 0 : labourList.reduce((sum, l) => sum + ((Number(l.amount) || 0) * (1 - (l.discount || 0)/100)), 0));`
);

// 6. Form fields for Free Service (Below Bill Date)
content = content.replace(
    /<input \n                                        type="date" \n                                        value=\{billDate\}\n                                        onChange=\{\(e\) => setBillDate\(e\.target\.value\)\}\n                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"\n                                    \/>\n                                <\/div>\n                            <\/div>/,
    `<input \n                                        type="date" \n                                        value={billDate}\n                                        onChange={(e) => setBillDate(e.target.value)}\n                                        className="w-full h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white transition-all"\n                                    />\n                                </div>\n                                <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-4 mt-2">\n                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 cursor-pointer">\n                                        <input type="checkbox" checked={isFreeService} onChange={(e) => setIsFreeService(e.target.checked)} className="w-4 h-4 accent-blue-600" />\n                                        Free Service\n                                    </label>\n                                    {isFreeService && (\n                                        <select \n                                            value={serviceNumber} \n                                            onChange={(e) => setServiceNumber(e.target.value)}\n                                            className="h-11 px-4 rounded-xl border border-slate-200 font-bold text-slate-800 focus:border-blue-500 outline-none bg-white flex-1"\n                                        >\n                                            <option value="">-- Select Service No. --</option>\n                                            {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>Service {n}</option>)}\n                                        </select>\n                                    )}\n                                </div>\n                            </div>`
);

// 7. Add Spares Form (Discount)
content = content.replace(
    /className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"/,
    `className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"`
);
content = content.replace(
    /<div>\n                                        <button \n                                            onClick=\{handleAddItemToBill\}/,
    `<div>\n                                        <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-1.5">Discount (%)</label>\n                                        <input \n                                            type="number" \n                                            min="0" max="100"\n                                            value={selectedSpareDiscount}\n                                            onChange={(e) => setSelectedSpareDiscount(e.target.value)}\n                                            className="w-full h-11 px-4 rounded-xl border-2 border-emerald-100 font-mono font-bold text-emerald-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-emerald-50 focus:bg-white transition-all"\n                                            placeholder="0"\n                                        />\n                                    </div>\n                                    <div>\n                                        <button \n                                            onClick={handleAddItemToBill}`
);

// 8. Add Labour Form (Discount)
content = content.replace(
    /<div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">/,
    `<div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">`
);
content = content.replace(
    /<div>\n                                    <button \n                                        onClick=\{\(\) => \{/,
    `<div>\n                                    <label className="text-[10px] font-bold text-emerald-600 uppercase block mb-1.5">Discount (%)</label>\n                                    <input \n                                        type="number" \n                                        min="0" max="100"\n                                        value={labourDiscount}\n                                        onChange={(e) => setLabourDiscount(e.target.value)}\n                                        className="w-full h-11 px-4 rounded-xl border-2 border-emerald-100 font-mono font-bold text-emerald-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none bg-emerald-50 focus:bg-white transition-all"\n                                        placeholder="0"\n                                    />\n                                </div>\n                                <div>\n                                    <button \n                                        onClick={() => {`
);
content = content.replace(
    /setLabourList\(\[\.\.\.labourList, \{ amount: Number\(labourAmount\), remark: labourRemark \}\]\);\n                                            setLabourAmount\(''\);\n                                            setLabourRemark\(''\);/,
    `setLabourList([...labourList, { amount: Number(labourAmount), remark: labourRemark, discount: Number(labourDiscount) || 0 }]);\n                                            setLabourAmount('');\n                                            setLabourRemark('');\n                                            setLabourDiscount('');`
);

// 9. Render list of items (showing discount)
content = content.replace(
    /<h4 className="text-sm font-bold text-slate-800 leading-tight">\{item\.name\}<\/h4>\n                                                    <p className="text-\[10px\] font-bold text-slate-400 uppercase mt-1">\n                                                        \{item\.qty\} x ₹\{item\.sellingPrice\}\n                                                    <\/p>\n                                                <\/div>\n                                                <div className="flex flex-col items-end gap-2 ml-3">\n                                                    <span className="text-sm font-mono font-black text-slate-800">\n                                                        ₹\{\(item\.qty \* item\.sellingPrice\)\.toLocaleString\(\)\}/g,
    `<h4 className="text-sm font-bold text-slate-800 leading-tight">{item.name} {item.discount > 0 && <span className="text-[10px] text-emerald-600 ml-1">(-{item.discount}%)</span>}</h4>\n                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">\n                                                        {item.qty} x ₹{item.sellingPrice}\n                                                    </p>\n                                                </div>\n                                                <div className="flex flex-col items-end gap-2 ml-3">\n                                                    <span className="text-sm font-mono font-black text-slate-800">\n                                                        ₹{((item.qty * item.sellingPrice) * (1 - (item.discount || 0)/100)).toLocaleString()}`
);

// 10. Render list of labour (showing discount)
content = content.replace(
    /<h4 className="text-sm font-bold text-blue-800 leading-tight">Labour: \{labour\.remark\}<\/h4>\n                                                <\/div>\n                                                <div className="flex flex-col items-end gap-2 ml-3">\n                                                    <span className="text-sm font-mono font-black text-blue-800">\n                                                        ₹\{\(labour\.amount\)\.toLocaleString\(\)\}/,
    `<h4 className="text-sm font-bold text-blue-800 leading-tight">Labour: {labour.remark} {labour.discount > 0 && <span className="text-[10px] text-emerald-600 ml-1">(-{labour.discount}%)</span>}</h4>\n                                                </div>\n                                                <div className="flex flex-col items-end gap-2 ml-3">\n                                                    <span className={\`text-sm font-mono font-black \${(isFreeService && serviceNumber) ? 'text-emerald-500 line-through' : 'text-blue-800'}\`}>\n                                                        ₹{(labour.amount * (1 - (labour.discount || 0)/100)).toLocaleString()}`
);

fs.writeFileSync(path, content);
console.log('Patched SpareBilling.jsx');
