import React, { useState, useEffect } from "react";
import axios from "axios";
import Button from "../../Basic/Button";
import DateTimeInput from "../../Basic/DateTimeInput";
import classes from "../CreditCustomers/CreditCustomers.module.css";
import tableclasses from "../ShowInvoices/ShowPurchaseInvoices.module.css";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

import Select from "../../Basic/Select";
import Modal from "../../UI/Modal"; // Import Modal

export default function PaymentManager({ customerId, onUpdate }) {
    const [payments, setPayments] = useState([]);
    const [customers, setCustomers] = useState([]); 
    const [selectedCustomerForForm, setSelectedCustomerForForm] = useState(""); 
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false); // Modal state

    // Form state
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        value: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
    });

    // Fetch payments
    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            let res;
            if (customerId) {
                // Specific customer mode
                res = await axios.get(
                    `${process.env.REACT_APP_BACKEND}credit-payments/customer/${customerId}`
                );
            } else {
                // Global mode
                res = await axios.get(
                    `${process.env.REACT_APP_BACKEND}credit-payments`
                );
                
                // Also fetch customers list for the select box if in global mode
                if (customers.length === 0) {
                     const custRes = await axios.get(process.env.REACT_APP_BACKEND + "customers");
                     setCustomers(custRes.data.filter(c => c.payment_type === "credit"));
                }
            }
            setPayments(res.data);
            if (onUpdate) onUpdate(); // Refresh parent stats
        } catch (err) {
            console.error("Failed to fetch payments:", err);
            setError("فشل في تحميل الدفعات");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
        resetForm();
    }, [customerId]);

    const resetForm = () => {
        setEditingId(null);
        setSelectedCustomerForForm("");
        setFormData({
            value: "",
            date: new Date().toISOString(),
            notes: "",
        });
        setError("");
    };

    const handleEdit = (payment) => {
        setEditingId(payment._id);
        if (!customerId && payment.customer) {
             const cId = typeof payment.customer === 'object' ? payment.customer._id : payment.customer;
             setSelectedCustomerForForm(cId);
        }
        
        setFormData({
            value: payment.value,
            date: payment.date,
            notes: payment.notes || "",
        });
        setShowModal(true); // Open modal
    };

    const handleDelete = async (id) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا السداد؟")) return;

        try {
            await axios.delete(
                `${process.env.REACT_APP_BACKEND}credit-payments/${id}`
            );
            fetchPayments();
        } catch (err) {
            console.error("Failed to delete payment:", err);
            alert("فشل في حذف السداد");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const targetCustomer = customerId || selectedCustomerForForm;
        
        if (!formData.value || !formData.date || !targetCustomer) {
             setError(customerId ? "البيانات ناقصة" : "يرجى اختيار العميل والبيانات");
             return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            if (editingId) {
                // Update - note: we typically don't change the customer of a payment on edit, but if we did, we'd include it. 
                // Currently API only updates value, date, notes.
                await axios.put(
                    `${process.env.REACT_APP_BACKEND}credit-payments/${editingId}`,
                    formData
                );
            } else {
                // Create
                await axios.post(
                    `${process.env.REACT_APP_BACKEND}credit-payments`,
                    {
                        customer: targetCustomer,
                        ...formData,
                    }
                );
            }
            resetForm();
            setShowModal(false); // Close modal on success
            fetchPayments();
        } catch (err) {
            console.error("Failed to save payment:", err);
            setError("فشل في حفظ السداد");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        resetForm();
    };

    const handleAddNew = () => {
        resetForm();
        setShowModal(true);
    }

    return (
        <div className={classes.paymentContainer}>
            <div className={classes.headerActions} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0 }}>سجل السدادات</h3>
                <Button content="إضافة سداد جديد" onClick={handleAddNew} />
            </div>

            {showModal && (
                <Modal
                    title={editingId ? "تعديل سداد" : "إضافة سداد جديد"}
                    onClose={handleCloseModal}
                    size="md"
                >
                    <div className={classes.paymentForm}>
                        {error && <div className={classes.error}>{error}</div>}
                        <form onSubmit={handleSubmit} className={classes.formColumn}>
                             {!customerId && (
                                <Select
                                    title="العميل"
                                    value={selectedCustomerForForm}
                                    onchange={setSelectedCustomerForForm}
                                    options={customers.map(c => ({ value: c._id, label: c.name }))}
                                    placeholder="اختر العميل"
                                    width="100%"
                                    disabled={!!editingId}
                                />
                            )}
                            <input
                                type="number"
                                placeholder="القيمة"
                                value={formData.value}
                                onChange={(e) =>
                                    setFormData({ ...formData, value: e.target.value })
                                }
                                required
                                className={classes.input}
                                style={{ width: '100%', marginBottom: '10px' }}
                            />
                            <div style={{ marginBottom: '10px' }}>
                                <DateTimeInput
                                    label="التاريخ"
                                    id="payment-date"
                                    value={formData.date}
                                    onchange={(date) =>
                                        setFormData({ ...formData, date })
                                    }
                                    includeTime={true}
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="ملاحظات"
                                value={formData.notes}
                                onChange={(e) =>
                                    setFormData({ ...formData, notes: e.target.value })
                                }
                                className={classes.input}
                                style={{ width: '100%', marginBottom: '15px' }}
                            />
                            <div style={{ display: "flex", gap: "10px", justifyContent: 'flex-end' }}>
                                <Button
                                    content="إلغاء"
                                    onClick={handleCloseModal}
                                    style={{ backgroundColor: "var(--secondary-light)" }}
                                    type="button"
                                />
                                <Button
                                    content={
                                        isSubmitting
                                            ? "جاري الحفظ..."
                                            : editingId
                                            ? "تحديث"
                                            : "تسجيل"
                                    }
                                    disabled={isSubmitting}
                                    onClick={handleSubmit}
                                />
                            </div>
                        </form>
                    </div>
                </Modal>
            )}

            <div className={`table-responsive ${tableclasses.tableWrapper}`}>
                <table className={`table table-bordered ${tableclasses.table}`}>
                    <thead>
                        <tr>
                            <th className={tableclasses.head}>التاريخ</th>
                            {!customerId && <th className={tableclasses.head}>العميل</th>}
                            <th className={tableclasses.head}>القيمة</th>
                            <th className={tableclasses.head}>ملاحظات</th>
                            <th className={tableclasses.head}>العمليات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={customerId ? "4" : "5"} className={tableclasses.item}>
                                    جاري التحميل...
                                </td>
                            </tr>
                        ) : payments.length === 0 ? (
                            <tr>
                                <td colSpan={customerId ? "4" : "5"} className={tableclasses.item}>
                                    لا توجد سدادات
                                </td>
                            </tr>
                        ) : (
                            payments.map((pay) => (
                                <tr key={pay._id}>
                                    <td className={tableclasses.item}>
                                        {new Date(pay.date).toLocaleString(
                                            "ar-EG"
                                        )}
                                    </td>
                                    {!customerId && (
                                        <td className={tableclasses.item}>
                                            {pay.customer?.name || "???"}
                                        </td>
                                    )}
                                    <td
                                        className={tableclasses.item}
                                        style={{ color: "var(--success-color)" }}
                                    >
                                        {Number(pay.value).toFixed(2)}
                                    </td>
                                    <td className={tableclasses.item}>
                                        {pay.notes || "-"}
                                    </td>
                                    <td className={tableclasses.item}>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "center",
                                                gap: "15px",
                                            }}
                                        >
                                            <FaEdit
                                                style={{
                                                    cursor: "pointer",
                                                    color: "var(--secondary-color)",
                                                }}
                                                onClick={() => handleEdit(pay)}
                                                title="تعديل"
                                            />
                                            <MdDelete
                                                style={{
                                                    cursor: "pointer",
                                                    color: "var(--accent-red)",
                                                }}
                                                onClick={() =>
                                                    handleDelete(pay._id)
                                                }
                                                title="حذف"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
