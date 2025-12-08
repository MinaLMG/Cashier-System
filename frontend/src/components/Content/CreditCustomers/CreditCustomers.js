import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "../../Basic/Select";
import Button from "../../Basic/Button";
import classes from "./CreditCustomers.module.css";
import tableclasses from "../ShowInvoices/ShowPurchaseInvoices.module.css";
import PaymentManager from "./PaymentManager";

export default function CreditCustomers() {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [invoices, setInvoices] = useState([]);
    const [payments, setPayments] = useState([]);
    const [movements, setMovements] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0); // To trigger Data refresh

    // Fetch credit customers on mount
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const res = await axios.get(process.env.REACT_APP_BACKEND + "customers");
                const creditCustomers = res.data.filter(c => c.payment_type === "credit");
                setCustomers(creditCustomers);
            } catch (err) {
                console.error("Failed to fetch customers", err);
            }
        };
        fetchCustomers();
    }, []);

    // Fetch data when customer is selected
    useEffect(() => {
        if (!selectedCustomer) {
            setMovements([]);
            setInvoices([]);
            setPayments([]);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [invoicesRes, paymentsRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_BACKEND}sales-invoices/full?exclude_credit=false`),
                    axios.get(`${process.env.REACT_APP_BACKEND}credit-payments/customer/${selectedCustomer}`)
                ]);

                // Filter invoices for this customer manually
                const customerInvoices = invoicesRes.data.items.filter(inv => inv.customer === selectedCustomer);
                
                const customerPayments = paymentsRes.data;

                setInvoices(customerInvoices);
                setPayments(customerPayments);

                // Combine and sort by date
                const combined = [
                    ...customerInvoices.map(inv => ({
                        type: "invoice",
                        date: inv.date,
                        amount: inv.final_amount,
                        id: inv._id,
                        notes: inv.notes,
                        details: `فاتورة بيع`
                    })),
                    ...customerPayments.map(pay => ({
                        type: "payment",
                        date: pay.date,
                        amount: pay.value, // Credit (subtracted from debt)
                        id: pay._id,
                        notes: pay.notes,
                        details: "سداد نقدى"
                    }))
                ].sort((a, b) => new Date(a.date) - new Date(b.date));

                setMovements(combined);

            } catch (err) {
                console.error("Failed to fetch customer data", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedCustomer, refreshTrigger]);

    // Calculate totals
    const totalDebit = invoices.reduce((sum, inv) => sum + (inv.final_amount || 0), 0);
    const totalCredit = payments.reduce((sum, pay) => sum + (pay.value || 0), 0);
    const balance = totalDebit - totalCredit;

    return (
        <div className={classes.container}>
            <h2 className={classes.title}>عرض عملاء الآجل</h2>
            
            <div className={classes.controls}>
                <Select
                    title="العميل"
                    value={selectedCustomer}
                    onchange={setSelectedCustomer}
                    options={customers.map(c => ({ value: c._id, label: c.name }))}
                    placeholder="اختر العميل..."
                    width="300px"
                />
            </div>

            {selectedCustomer && (
                <div className={classes.dashboard}>
                    <div className={classes.summaryCards}>
                        <div className={`${classes.card} ${classes.debit}`}>
                            <h3>إجمالي المبيعات (مدين)</h3>
                            <p>{totalDebit.toFixed(2)} ج.م</p>
                        </div>
                        <div className={`${classes.card} ${classes.credit}`}>
                            <h3>إجمالي المسدد (دائن)</h3>
                            <p>{totalCredit.toFixed(2)} ج.م</p>
                        </div>
                        <div className={`${classes.card} ${classes.balance}`} style={{
                            borderColor: balance > 0 ? "var(--accent-red)" : "var(--success-color)"
                        }}>
                            <h3>المتبقي (الرصيد current)</h3>
                            <p>{balance.toFixed(2)} ج.م</p>
                        </div>
                    </div>

                    <div className={classes.detailsGrid}>
                        {/* Movements Section */}
                        <div className={classes.section}>
                            <h3>كشف الحساب (حركات)</h3>
                            <div className={`table-responsive ${tableclasses.tableWrapper}`} style={{maxHeight: '400px', overflowY: 'auto'}}>
                                <table className={`table table-bordered ${tableclasses.table}`}>
                                    <thead>
                                        <tr>
                                            <th className={tableclasses.head}>التاريخ</th>
                                            <th className={tableclasses.head}>البيان</th>
                                            <th className={tableclasses.head}>مدين (عليه)</th>
                                            <th className={tableclasses.head}>دائن (له)</th>
                                            <th className={tableclasses.head}>ملاحظات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr><td colSpan="5" className={tableclasses.item}>جاري التحميل...</td></tr>
                                        ) : movements.length === 0 ? (
                                            <tr><td colSpan="5" className={tableclasses.item}>لا توجد حركات</td></tr>
                                        ) : (
                                            movements.map((mov, idx) => (
                                                <tr key={`${mov.type}-${mov.id}-${idx}`}>
                                                    <td className={tableclasses.item}>
                                                        {new Date(mov.date).toLocaleString('ar-EG')}
                                                    </td>
                                                    <td className={tableclasses.item}>{mov.details}</td>
                                                    <td className={tableclasses.item} style={{color: "var(--accent-red)"}}>
                                                        {mov.type === "invoice" ? mov.amount.toFixed(2) : "-"}
                                                    </td>
                                                    <td className={tableclasses.item} style={{color: "var(--success-color)"}}>
                                                        {mov.type === "payment" ? mov.amount.toFixed(2) : "-"}
                                                    </td>
                                                    <td className={tableclasses.item}>{mov.notes || "-"}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
