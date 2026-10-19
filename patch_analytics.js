const fs = require('fs');
const path = './frontend/src/components/SpareAnalytics.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. formatCurrency
content = content.replace(
    /const formatCurrency = \(val\) => \{\n        if \(val >= 100000\) return \`₹\$\{\(val \/ 100000\)\.toFixed\(1\)\}L\`;\n        if \(val >= 1000\) return \`₹\$\{\(val \/ 1000\)\.toFixed\(1\)\}K\`;\n        return \`₹\$\{val\.toLocaleString\(\)\}\`;\n    \};/,
    `const formatCurrency = (val) => {\n        return \`₹\${val.toLocaleString('en-IN')}\`;\n    };`
);

// 2. Add topItemsSort state
content = content.replace(
    /const \[customYearVal, setCustomYearVal\] = useState\(new Date\(\)\.getFullYear\(\)\.toString\(\)\);/,
    `const [customYearVal, setCustomYearVal] = useState(new Date().getFullYear().toString());\n    const [topItemsSort, setTopItemsSort] = useState('revenue');`
);

// 3. YAxis formatting
content = content.replace(
    /tickFormatter=\{\(val\) => val >= 100000 \? \`\$\{\(val\/100000\)\.toFixed\(1\)\}L\` : val >= 1000 \? \`\$\{\(val\/1000\)\.toFixed\(0\)\}k\` : val\}/,
    `tickFormatter={(val) => val.toLocaleString('en-IN')}`
);

// 4. Update Top Selling Items Box
content = content.replace(
    /<span className="text-\[9px\] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">By Revenue<\/span>/,
    `<select \n                            value={topItemsSort}\n                            onChange={(e) => setTopItemsSort(e.target.value)}\n                            className="text-[9px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg outline-none border-none cursor-pointer"\n                        >\n                            <option value="revenue">By Revenue</option>\n                            <option value="quantity">By Quantity</option>\n                        </select>`
);

content = content.replace(
    /\{topItems\.length > 0 \? topItems\.map\(\(item, idx\) => \(/,
    `{topItems.length > 0 ? [...topItems].sort((a, b) => topItemsSort === 'revenue' ? b.revenue - a.revenue : b.qtySold - a.qtySold).map((item, idx) => (`
);

// 5. Insert Pie Chart Row above the Footer
const pieChartCode = `
            {/* --- EXTRA ROW: Top Items Pie Chart --- */}
            <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200/60 shadow-sm flex flex-col h-[360px] mb-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <Package size={12} className="text-violet-500" /> Top 10 Items by Quantity
                    </h3>
                </div>
                <div className="flex-1 w-full relative flex flex-col md:flex-row items-center">
                    <div className="w-full md:w-1/2 h-full min-h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={[...topItems].sort((a,b)=>b.qtySold-a.qtySold).slice(0, 10)} 
                                    innerRadius={60} 
                                    outerRadius={90} 
                                    paddingAngle={2} 
                                    dataKey="qtySold" 
                                    nameKey="name" 
                                    stroke="none"
                                >
                                    {[...topItems].sort((a,b)=>b.qtySold-a.qtySold).slice(0, 10).map((_, index) => (
                                        <Cell key={\`cell-\${index}\`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#64748b', '#0ea5e9', '#d946ef', '#14b8a6', '#84cc16'][index % 10]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', fontSize: '10px', border: 'none' }}
                                    formatter={(val) => [\`\${val} Units\`, 'Quantity Sold']}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="w-full md:w-1/2 h-full overflow-y-auto pr-2 space-y-2 mt-4 md:mt-0">
                        {[...topItems].sort((a,b)=>b.qtySold-a.qtySold).slice(0, 10).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e', '#64748b', '#0ea5e9', '#d946ef', '#14b8a6', '#84cc16'][idx % 10] }}></span>
                                <span className="text-[10px] font-bold text-slate-700 truncate">{item.name}</span>
                                <span className="ml-auto text-[10px] font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded-md">{item.qtySold} units</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- PROFIT SUMMARY FOOTER --- */}
`;

content = content.replace(
    /\{\/\* --- PROFIT SUMMARY FOOTER --- \*\/\}/,
    pieChartCode
);

fs.writeFileSync(path, content);
console.log('Patched SpareAnalytics.jsx');
