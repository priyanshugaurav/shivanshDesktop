import re

with open('/Users/mayankgaurav/Projects/Local/shivanshDesktop/frontend/src/components/Sales.jsx', 'r') as f:
    content = f.read()

# 1. Update Initial State
content = content.replace(
    "      payment: { downPaymentAuto: '0.00', downPayment: '', discount: '0', paidAmount: '', type: 'CASH', date: '', dues: '0.00', netDues: '0.00' },",
    "      magadhMargin: '0.00',\n      payment: { downPayment: '', paidAmount: '', dues: '0.00' },"
)

# 2. Update ViewAgreement
old_view = """                  <Section title="Payment Details" icon={Calculator}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field label="Customer Down Payment (Auto)" value={data.payment?.downPaymentAuto || (data.payment?.downPayment && data.payment?.discount ? (parseFloat(data.payment.downPayment) + parseFloat(data.payment.discount)).toFixed(2) : data.payment?.downPayment)} />
                            <Field label="Discount" value={data.payment?.discount || '0'} />
                            <Field label="Customer Down Payment" value={data.payment?.downPayment} />
                            <Field label="Customer Paid Amount" value={data.payment?.paidAmount} />
                            <Field label="Payment Type" value={data.payment?.type} />
                            <Field label="Payment Date" value={data.payment?.date ? new Date(data.payment.date).toLocaleDateString() : ''} />
                            <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                                <span className="block text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Net Dues</span>
                                <span className="block text-sm font-bold text-orange-700 font-mono">{data.payment?.netDues || data.payment?.dues}</span>
                            </div>
                        </div>
                  </Section>"""

new_view = """                  <Section title="Payment Details" icon={Calculator}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Field label="Customer Down Payment" value={data.payment?.downPayment} />
                            <Field label="Customer Paid Amount" value={data.payment?.paidAmount} />
                            <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                                <span className="block text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Dues</span>
                                <span className="block text-sm font-bold text-orange-700 font-mono">{data.payment?.dues}</span>
                            </div>
                        </div>
                  </Section>"""
content = content.replace(old_view, new_view)

# 3. Update useEffect Calculations
old_calc = """        // 4. Down Payment (Manual logic from user: On Road - Loan)
        const downPaymentAutoVal = (safe(onRoadPrice) - loanAmt + (formData.agreementType === 'TYPE2' ? bankFee : 0));
        const downPaymentAuto = downPaymentAutoVal.toFixed(2);
        const downPayment = (downPaymentAutoVal - paymentDiscount).toFixed(2);
        
        // 5. Dues (Down payment - Paid amount)
        const paidAmt = safe(formData.payment.paidAmount);
        const dues = (safe(downPayment) - paidAmt).toFixed(2);
        
        // 8. TDS and Final Net Profit (Dependent on Deal Commission)
        const dealCommission = safe(formData.dse.commission);
        const tds = (dealCommission * 0.05).toFixed(2);
        const finalNetProfit = (safe(netProfit) - safe(tds)).toFixed(2);
        
        // Update State (Avoiding infinite loops by comparing values)
        const needsUpdate = (
            formData.model.onRoadPrice !== onRoadPrice ||
            formData.dto.total !== dtoTotal ||
            formData.payment.downPaymentAuto !== downPaymentAuto ||
            formData.payment.downPayment !== downPayment ||
            formData.payment.dues !== dues ||
            formData.payment.netDues !== dues || // Syncing net dues initially too
            formData.dse.netProfit !== netProfit ||
            formData.dse.tds !== tds ||
            formData.dse.finalNetProfit !== finalNetProfit
        );

        if (needsUpdate) {
            setFormData(prev => ({
                ...prev,
                model: { ...prev.model, onRoadPrice },
                dto: { ...prev.dto, total: dtoTotal },
                payment: { 
                    ...prev.payment, 
                    downPaymentAuto,
                    downPayment, 
                    dues, 
                    netDues: (prev.payment.netDues === prev.payment.dues || !initialData) ? dues : prev.payment.netDues 
                },
                dse: { ...prev.dse, netProfit, tds, finalNetProfit }
            }));
        }"""

new_calc = """        // 3. Magadh Margin
        const magadhMarginVal = exShowroom - insurance - bankFee - loanAmt;
        const magadhMargin = magadhMarginVal.toFixed(2);
        
        // 4. Down Payment
        const downPayment = safe(formData.payment.downPayment);
        
        // 5. Dues (Down payment - Paid amount)
        const paidAmt = safe(formData.payment.paidAmount);
        const dues = (downPayment - paidAmt).toFixed(2);
        
        // 8. Net Profit, TDS and Final Net Profit
        const dealCommission = safe(formData.dse.commission);
        const netProfitVal = (downPayment - safe(magadhMargin) - dtoTotalVal) + dealCommission;
        const netProfit = netProfitVal.toFixed(2);
        const tds = (dealCommission * 0.05).toFixed(2);
        const finalNetProfit = (netProfitVal - safe(tds)).toFixed(2);
        
        // Update State (Avoiding infinite loops by comparing values)
        const needsUpdate = (
            formData.model.onRoadPrice !== onRoadPrice ||
            formData.dto.total !== dtoTotal ||
            formData.magadhMargin !== magadhMargin ||
            formData.payment.dues !== dues ||
            formData.dse.netProfit !== netProfit ||
            formData.dse.tds !== tds ||
            formData.dse.finalNetProfit !== finalNetProfit
        );

        if (needsUpdate) {
            setFormData(prev => ({
                ...prev,
                model: { ...prev.model, onRoadPrice },
                dto: { ...prev.dto, total: dtoTotal },
                magadhMargin,
                payment: { 
                    ...prev.payment, 
                    dues
                },
                dse: { ...prev.dse, netProfit, tds, finalNetProfit }
            }));
        }"""
content = content.replace(old_calc, new_calc)

# 4. Dependency Array
old_deps = """        formData.dto.registration, formData.dto.onlinePayment, formData.dto.permit,
        formData.loan.processingFee, formData.loan.amount,
        formData.payment.paidAmount, formData.payment.discount,
        formData.broker.amount, formData.other.amount,"""
new_deps = """        formData.dto.registration, formData.dto.onlinePayment, formData.dto.permit,
        formData.loan.processingFee, formData.loan.amount,
        formData.payment.downPayment, formData.payment.paidAmount,
        formData.broker.amount, formData.other.amount,"""
content = content.replace(old_deps, new_deps)

# 5. UI Magadh Margin
old_broker = """                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-4 flex items-center gap-2"><UserCheck className="h-4 w-4 text-slate-400" /> Broker Details</h3>"""
new_broker = """                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-4 flex items-center gap-2"><Tag className="h-4 w-4 text-slate-400" /> Magadh Margin</h3>
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Magadh Margin (Auto)</label>
                                <div className="px-3 py-2 bg-slate-100 border border-gray-200 rounded-lg text-xs font-black text-slate-900 h-9 flex items-center">{formData.magadhMargin}</div>
                            </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-4 flex items-center gap-2"><UserCheck className="h-4 w-4 text-slate-400" /> Broker Details</h3>"""
content = content.replace(old_broker, new_broker)

# 6. UI Payment Section
old_pay = """                  <div>
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-4 flex items-center gap-2"><Calculator className="h-4 w-4 text-slate-400" /> Payment</h3>
                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Customer Down Payment (Auto)</label>
                              <div className="px-3 py-2 bg-slate-100 border border-gray-200 rounded-lg text-xs font-black text-slate-900 h-9 flex items-center">{formData.payment.downPaymentAuto || '0.00'}</div>
                          </div>
                          <Input label="Discount" value={formData.payment.discount} onChange={v => handleDeepChange('payment', 'discount', v)} theme={theme} />
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Customer Down Payment</label>
                              <div className="px-3 py-2 bg-slate-100 border border-gray-200 rounded-lg text-xs font-black text-slate-900 h-9 flex items-center">{formData.payment.downPayment}</div>
                          </div>
                          <Input label="Customer Paid Amount" value={formData.payment.paidAmount} onChange={v => handleDeepChange('payment', 'paidAmount', v)} theme={theme} />
                          <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Payment Type</label><select value={formData.payment.type} onChange={e => handleDeepChange('payment', 'type', e.target.value)} className={`w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-transparent focus:ring-1 ${theme.ring}`}><option>CASH</option><option>ONLINE</option><option>CHEQUE</option></select></div>
                          <Input label="Payment Date" type="date" value={formData.payment.date} onChange={v => handleDeepChange('payment', 'date', v)} theme={theme} />
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Dues (Auto)</label>
                              <div className="px-3 py-2 bg-slate-100 border border-gray-200 rounded-lg text-xs font-black text-slate-900 h-9 flex items-center">{formData.payment.dues}</div>
                          </div>
                          <Input label="Net Dues Remaining" value={formData.payment.netDues} onChange={v => handleDeepChange('payment', 'netDues', v)} theme={theme} />
                      </div>
                  </div>"""

new_pay = """                  <div>
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase mb-4 flex items-center gap-2"><Calculator className="h-4 w-4 text-slate-400" /> Payment</h3>
                      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5">
                          <Input label="Customer Down Payment" value={formData.payment.downPayment} onChange={v => handleDeepChange('payment', 'downPayment', v)} theme={theme} />
                          <Input label="Customer Paid Amount" value={formData.payment.paidAmount} onChange={v => handleDeepChange('payment', 'paidAmount', v)} theme={theme} />
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Dues (Auto)</label>
                              <div className="px-3 py-2 bg-slate-100 border border-gray-200 rounded-lg text-xs font-black text-slate-900 h-9 flex items-center">{formData.payment.dues}</div>
                          </div>
                      </div>
                  </div>"""
content = content.replace(old_pay, new_pay)

with open('/Users/mayankgaurav/Projects/Local/shivanshDesktop/frontend/src/components/Sales.jsx', 'w') as f:
    f.write(content)

