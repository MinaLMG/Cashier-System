import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Button from "../../Basic/Button";
import TextInput from "../../Basic/TextInput";
import Select from "../../Basic/Select";
import SalesInvoiceRow from "./SalesInvoiceRow";
import classes from "./SalesInvoice.module.css";

export default function SalesInvoice(props) {
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [invoice, setInvoice] = useState({
        customer: "",
        type: "walkin",
        date: new Date().toISOString().split("T")[0],
        offer: 0,
        rows: [{ barcode: "", product: "", volume: "", quantity: "" }],
    });
    const [rowErrors, setRowErrors] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitMessage, setSubmitMessage] = useState({
        text: "",
        isError: false,
    });
    const [finalTotal, setFinalTotal] = useState(0);

    // 🧠 Validation Helpers
    const getRowErrors = useCallback(
        (row, index, rows) => {
            const errors = {};
            const selectedProduct = products.find((p) => p._id === row.product);
            const volumeObj = selectedProduct?.values?.find(
                (v) => v.id === row.volume
            );
            const quantityNum = Number(row.quantity);
            const volumeValue = volumeObj?.val ?? 0;
            const productRemaining = selectedProduct?.total_remaining ?? 0;

            if (!row.product) errors.product = "الرجاء اختيار منتج";
            if (!row.volume) errors.volume = "الرجاء اختيار عبوة";

            if (!quantityNum || quantityNum <= 0) {
                errors.quantity = "الكمية غير صحيحة";
            } else if (!volumeValue) {
                errors.volume = "يرجى اختيار عبوة صالحة";
            } else {
                // Calculate cumulative used quantity for same product before this row
                let usedQuantity = 0;
                for (let i = 0; i < rows.length; i++) {
                    if (i === index) continue;
                    const r = rows[i];
                    if (r.product !== row.product) continue;

                    const prod = products.find((p) => p._id === r.product);
                    const vol = prod?.values?.find((v) => v.id === r.volume);
                    if (!vol) continue;

                    usedQuantity += Number(r.quantity || 0) * vol.val;
                }

                const thisQuantity = quantityNum * volumeValue;
                const remainingAfterOthers = productRemaining - usedQuantity;

                if (thisQuantity > remainingAfterOthers) {
                    const maxQty = Math.floor(
                        remainingAfterOthers / volumeValue
                    );
                    errors.quantity = `أقصى كمية يمكن بيعها هي ${maxQty}`;
                }
            }

            return errors;
        },
        [products]
    );

    const validateAllRows = (rows) => {
        const errors = rows.map(getRowErrors);
        // setRowErrors(errors);
        return errors.every((err) => Object.keys(err).length === 0);
    };

    // 🧲 Effects
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [customers, products] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_BACKEND}customers`),
                    axios.get(`${process.env.REACT_APP_BACKEND}products/full`),
                ]);
                setCustomers(customers.data);
                setProducts(products.data);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            }
        };
        fetchData();
    }, []);
    useEffect(() => {
        const totalRows = invoice.rows.length;

        const updatedErrors = invoice.rows.map((row, i) =>
            i === totalRows - 1 && totalRows > 1
                ? {}
                : getRowErrors(row, i, invoice.rows)
        );
        setRowErrors(updatedErrors);

        const rowsToValidate =
            totalRows > 1 ? updatedErrors.slice(0, -1) : updatedErrors;

        const isEachRowValid = rowsToValidate.every((err) =>
            Object.values(err).every((v) => !v)
        );
        const atLeastOneValid = rowsToValidate.some((err) =>
            Object.values(err).every((v) => !v)
        );

        const validForm =
            isEachRowValid &&
            atLeastOneValid &&
            Boolean(invoice.date) &&
            Boolean(invoice.type);

        setIsFormValid(validForm);
    }, [invoice, products]);

    // 🛠️ Handlers
    const handleRowChange = (index, key, value) => {
        const updatedRows = [...invoice.rows];
        updatedRows[index][key] = value;

        // Immediately validate the current row live
        const newErrors = getRowErrors(updatedRows[index], index, updatedRows);
        const updatedErrors = [...rowErrors];
        updatedErrors[index] = newErrors;

        // Update state
        setInvoice((prev) => ({ ...prev, rows: updatedRows }));
        setRowErrors(updatedErrors);
    };

    const addRow = () => {
        if (!validateAllRows(invoice.rows)) return;
        setInvoice((prev) => ({
            ...prev,
            rows: [
                ...prev.rows,
                { barcode: "", product: "", volume: "", quantity: "" },
            ],
        }));
    };

    const removeRow = (index) => {
        const updatedRows = invoice.rows.filter((_, i) => i !== index);
        const updatedErrors = rowErrors.filter((_, i) => i !== index);

        setInvoice((prev) => ({ ...prev, rows: updatedRows }));
        setRowErrors(updatedErrors);
    };

    useEffect(() => {
        const calculateTotal = () => {
            return invoice.rows.reduce((total, row) => {
                const product = products.find((p) => p._id === row.product);
                const price =
                    invoice.type === "walkin"
                        ? product?.walkin_price
                        : product?.pharmacy_price;

                const volumeEntry = product?.values?.find(
                    (v) => v.id === row.volume
                );
                const value = Number(volumeEntry?.val || 1);

                const quantity = Number(row.quantity);
                const unitPrice = Number(price);

                return (
                    total +
                    (isNaN(quantity) || isNaN(unitPrice) || isNaN(value)
                        ? 0
                        : quantity * value * unitPrice)
                );
            }, 0);
        };

        const newTotal = calculateTotal() - Number(invoice.offer || 0);
        setFinalTotal(newTotal);
    }, [invoice.rows, invoice.offer, invoice.type, products]);

    const handleSubmit = async () => {
        console.log(invoice);
        const validRows = invoice.rows.filter((row, i) =>
            Object.values(rowErrors[i] || {}).every((v) => !v)
        );

        if (!invoice.date || !invoice.type || validRows.length === 0) {
            setSubmitError("⚠️ يجب إدخال النوع وتاريخ وصف واحد صحيح على الأقل");
            return;
        }

        setIsSubmitting(true);

        const requestBody = {
            customer: invoice.customer,
            type: invoice.type,
            date: invoice.date,
            offer: Number(invoice.offer || 0),
            rows: validRows.map((row) => ({
                product: row.product,
                volume: row.volume,
                quantity: Number(row.quantity),
            })),
            total: finalTotal,
            finalTotal: finalTotal,
        };

        try {
            if (props.mode === "add") {
                await axios.post(
                    `${process.env.REACT_APP_BACKEND}sales-invoices/full`,
                    requestBody
                );
            } else if (props.mode === "edit" && props.invoice?._id) {
                await axios.put(
                    `${process.env.REACT_APP_BACKEND}sales-invoices/full/${props.invoice._id}`,
                    requestBody
                );
            }

            setSubmitMessage({
                text: "✅ تم حفظ الفاتورة بنجاح",
                isError: false,
            });
            props.onSuccess?.();

            if (props.mode === "add") {
                setInvoice({
                    customer: "",
                    type: "",
                    date: new Date().toISOString().split("T")[0],
                    offer: 0,
                    rows: [
                        { barcode: "", product: "", volume: "", quantity: "" },
                    ],
                });
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = "❌ حدث خطأ أثناء حفظ الفاتورة";
            if (status === 401)
                errorMsg = "غير مصرح بالعملية - يرجى تسجيل الدخول";
            else if (status === 403) errorMsg = "ليس لديك صلاحية لهذه العملية";
            else if (err.response?.data?.error)
                errorMsg = err.response.data.error;

            setSubmitMessage({ text: errorMsg, isError: true });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={classes.container}>
            <h2>فاتورة بيع</h2>

            {/* Header Info */}
            <div style={{ display: "flex", margin: "20px 0" }}>
                <div style={{ width: "10%", marginRight: "2.5%" }}>
                    <TextInput
                        type="date"
                        label="تاريخ الفاتورة"
                        value={invoice.date}
                        onchange={(e) =>
                            setInvoice((prev) => ({ ...prev, date: e }))
                        }
                    />
                </div>
                <div style={{ width: "50%", marginRight: "2.5%" }}>
                    <Select
                        title="العميل"
                        value={invoice.customer}
                        onchange={(val) => {
                            const customerType = customers.find(
                                (c) => c._id === val
                            )?.type;
                            setInvoice((prev) => ({
                                ...prev,
                                customer: val,
                                type:
                                    customerType === "walkin"
                                        ? "walkin"
                                        : "pharmacy",
                            }));
                        }}
                        options={customers.map((c) => ({
                            value: c._id,
                            label: c.name,
                        }))}
                    />
                </div>
            </div>

            <div style={{ width: "50%", marginRight: "2.5%" }}>
                <Select
                    title="نوع العميل"
                    value={invoice.type === "walkin" ? "جمهور" : "صيدلية"}
                    disabled={!!invoice.customer}
                    onchange={(e) =>
                        setInvoice((prev) => ({ ...prev, type: e }))
                    }
                    options={[
                        { value: "صيدلية", label: "صيدلية" },
                        { value: "جمهور", label: "جمهور" },
                    ]}
                />
            </div>

            {/* Invoice Rows */}
            <table
                className={`table table-light table-hover table-bordered border-secondary ${classes.table}`}
            >
                <thead>
                    <tr>
                        <th>#</th>
                        <th>المنتج</th>
                        <th>العبوة</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>الإجمالي</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.rows.map((row, i) => (
                        <SalesInvoiceRow
                            key={i}
                            row={row}
                            index={i}
                            onChange={handleRowChange}
                            onRemove={removeRow}
                            onAdd={addRow}
                            isLastRow={i === invoice.rows.length - 1}
                            canRemove={
                                invoice.rows.length > 1 &&
                                i !== invoice.rows.length - 1
                            }
                            products={products}
                            salesType={invoice.type}
                            errors={rowErrors}
                        />
                    ))}

                    <tr>
                        <td></td>
                        <td colSpan={3}>
                            <TextInput
                                type="number"
                                label="خصم"
                                value={invoice.offer}
                                onchange={(val) =>
                                    setInvoice((prev) => ({
                                        ...prev,
                                        offer: isNaN(Number(val))
                                            ? 0
                                            : Number(val),
                                    }))
                                }
                            />
                        </td>
                        <td colSpan={3}>
                            <strong>{finalTotal.toFixed(2)} ج.م</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <Button
                content="حفظ الفاتورة"
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
            />

            {/* Messages */}
            {submitError && (
                <div style={{ color: "red", marginTop: "10px" }}>
                    {submitError}
                </div>
            )}
            {submitMessage.text && (
                <div
                    style={{
                        marginTop: "10px",
                        fontWeight: "bold",
                        color: submitMessage.isError ? "red" : "green",
                    }}
                >
                    {submitMessage.text}
                </div>
            )}
        </div>
    );
}
