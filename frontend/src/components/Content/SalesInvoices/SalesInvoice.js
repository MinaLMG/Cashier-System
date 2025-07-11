import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Button from "../../Basic/Button";
import TextInput from "../../Basic/TextInput";
import DateTimeInput from "../../Basic/DateTimeInput";
import Select from "../../Basic/Select";
import SalesInvoiceRow from "./SalesInvoiceRow";
import useInvoiceRows from "../../../hooks/useInvoiceRows";
import classes from "./SalesInvoice.module.css";

export default function SalesInvoice(props) {
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({
        text: "",
        isError: false,
    });
    const [submitError, setSubmitError] = useState("");
    const [finalTotal, setFinalTotal] = useState(0);
    const [baseCost, setBaseCost] = useState(0);
    const [profit, setProfit] = useState(0);

    // Define the initial empty row
    const emptyRow = {
        barcode: "",
        product: "",
        volume: "",
        quantity: "",
    };

    // Define invoice state with ISO datetime string
    const [invoice, setInvoice] = useState({
        customer: "",
        type: "walkin",
        date: new Date().toISOString(), // Full ISO string with time
        offer: 0,
    });

    // Define row validation function
    const validateRow = useCallback(
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

    // Use our custom hook for row management
    const {
        rows: invoiceRows,
        rowErrors,
        isFormValid,
        handleRowChange,
        addRow,
        removeRow,
        setRows: setInvoiceRows,
        validateRows,
    } = useInvoiceRows(emptyRow, validateRow, [products, invoice.type]);

    // Fetch data on component mount
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

    // Load invoice data if in edit mode
    useEffect(() => {
        if (props.mode === "edit" && props.invoice) {
            const { date, customer, type, offer, rows, base } = props.invoice;
            setInvoice({
                date: new Date(date).toISOString(), // Convert to ISO string with time
                customer,
                type,
                offer,
            });
            setInvoiceRows(rows.length > 0 ? rows : [{ ...emptyRow }]);
            setBaseCost(base || 0);
        }
    }, [props.mode, props.invoice, setInvoiceRows, emptyRow]);

    // Calculate total whenever rows or invoice type changes
    useEffect(() => {
        const calculateTotal = () => {
            return invoiceRows.reduce((total, row) => {
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

        // Calculate profit (only in edit mode when we know the base cost)
        if (props.mode === "edit") {
            setProfit(newTotal - baseCost);
        }
    }, [
        invoiceRows,
        invoice.offer,
        invoice.type,
        products,
        baseCost,
        props.mode,
    ]);

    // Handle invoice field changes
    const handleInvoiceChange = (field, value) => {
        setInvoice((prev) => ({ ...prev, [field]: value }));
    };

    // Use validateRows in a function to avoid the unused variable warning
    const validateAllRows = () => {
        const errors = validateRows();
        return errors;
    };

    // Handle form submission
    const handleSubmit = async () => {
        // Validate all rows before submission
        validateAllRows();

        const validRows = invoiceRows.filter(
            (row, i) =>
                Object.keys(validateRow(row, i, invoiceRows) || {}).length === 0
        );

        if (!invoice.date || !invoice.type || validRows.length === 0) {
            setSubmitError("⚠️ يجب إدخال النوع وتاريخ وصف واحد صحيح على الأقل");
            return;
        }

        setIsSubmitting(true);

        const requestBody = {
            customer: invoice.customer,
            type: invoice.type,
            date: invoice.date, // Send the full ISO datetime string
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
            let response;
            if (props.mode === "edit") {
                response = await axios.put(
                    `${process.env.REACT_APP_BACKEND}sales-invoices/full/${props.invoice._id}`,
                    requestBody
                );
            } else {
                response = await axios.post(
                    `${process.env.REACT_APP_BACKEND}sales-invoices/full`,
                    requestBody
                );
            }

            setSubmitMessage({
                text:
                    props.mode === "edit"
                        ? "✅ تم تحديث الفاتورة بنجاح"
                        : "✅ تم إضافة الفاتورة بنجاح",
                isError: false,
            });

            // Reset form to initial state if not in edit mode
            if (props.mode !== "edit") {
                setInvoice({
                    customer: "",
                    type: "walkin",
                    date: new Date().toISOString(), // Full ISO string with time
                    offer: 0,
                });
                setInvoiceRows([{ ...emptyRow }]);
                setFinalTotal(0);
            }

            if (props.onSuccess) {
                props.onSuccess(response.data);
            }
        } catch (err) {
            console.error("Error submitting invoice:", err);
            setSubmitMessage({
                text: `❌ حدث خطأ: ${err.response?.data?.error || err.message}`,
                isError: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add this function to handle barcode scanning
    const handleBarcodeChange = useCallback(
        async (index, barcode) => {
            console.log("called");
            try {
                // Find product and volume by barcode
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND}has-volumes/barcode/${barcode}`
                );

                if (response.data) {
                    const { product: productId, volume: volumeId } =
                        response.data;

                    // Update the row with the found product and volume
                    const updatedRows = [...invoiceRows];
                    updatedRows[index].product = productId;
                    updatedRows[index].volume = volumeId;

                    // Set default quantity to 1 if not already set
                    if (!updatedRows[index].quantity) {
                        updatedRows[index].quantity = "1";
                    }

                    setInvoiceRows(updatedRows);

                    // If this is the last row, add a new row for the next scan
                    if (index === invoiceRows.length - 1) {
                        addRow();
                    }
                }
            } catch (error) {
                console.error("Error finding product by barcode:", error);
                // You could set an error message here if needed
            }
        },
        [invoiceRows, setInvoiceRows, addRow]
    );

    return (
        <div className={classes.container}>
            <h2 className={classes.formTitle}>
                {props.mode === "edit"
                    ? "تعديل فاتورة مبيعات"
                    : "إضافة فاتورة مبيعات"}
            </h2>

            <div className="row mb-3">
                <div className="col-md-5">
                    <DateTimeInput
                        label="التاريخ والوقت"
                        id="invoice-date"
                        value={invoice.date}
                        onchange={(value) => handleInvoiceChange("date", value)}
                        includeTime={true}
                    />
                </div>
                <div className="col-md-2">
                    <Select
                        title="العميل"
                        value={invoice.customer || ""}
                        onchange={(value) =>
                            handleInvoiceChange("customer", value)
                        }
                        options={[
                            { value: "", label: "بدون عميل" },
                            ...customers.map((c) => ({
                                value: c._id,
                                label: c.name,
                            })),
                        ]}
                    />
                </div>
                <div className="col-md-6">
                    <Select
                        title="نوع العميل"
                        value={invoice.type}
                        onchange={(value) => handleInvoiceChange("type", value)}
                        options={[
                            { value: "walkin", label: "زبون" },
                            { value: "pharmacy", label: "صيدلية" },
                        ]}
                    />
                </div>
            </div>

            <table
                className={`table table-light table-hover table-bordered border-secondary ${classes.table}`}
            >
                <thead>
                    <tr>
                        <th>#</th>
                        <th>الباركود</th>
                        <th>المنتج</th>
                        <th>الكمية</th>
                        <th>العبوة</th>
                        <th>السعر</th>
                        <th>الإجمالي</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {invoiceRows.map((row, i) => {
                        return (
                            <SalesInvoiceRow
                                key={i}
                                row={row}
                                index={i}
                                onChange={handleRowChange}
                                onRemove={removeRow}
                                onAdd={addRow}
                                isLastRow={i === invoiceRows.length - 1}
                                canRemove={
                                    invoiceRows.length > 1 &&
                                    i !== invoiceRows.length - 1
                                }
                                products={products}
                                salesType={invoice.type}
                                errors={rowErrors[i] || {}}
                                onBarcodeChange={handleBarcodeChange}
                            />
                        );
                    })}

                    <tr>
                        <td></td>
                        <td colSpan={4}>
                            <TextInput
                                type="number"
                                label="خصم"
                                value={invoice.offer}
                                onchange={(val) =>
                                    handleInvoiceChange(
                                        "offer",
                                        isNaN(Number(val)) ? 0 : Number(val)
                                    )
                                }
                            />
                        </td>
                        <td colSpan={3}>
                            <strong>{finalTotal.toFixed(2)} ج.م</strong>
                        </td>
                    </tr>

                    {/* Show profit information in edit mode */}
                    {props.mode === "edit" && (
                        <tr>
                            <td></td>
                            <td colSpan={4}>
                                <div className="d-flex justify-content-between">
                                    <strong>تكلفة الشراء:</strong>
                                    <strong>{baseCost.toFixed(2)} ج.م</strong>
                                </div>
                            </td>
                            <td colSpan={3}>
                                <div className="d-flex justify-content-between">
                                    <strong>الربح:</strong>
                                    <strong
                                        className={
                                            profit > 0
                                                ? "text-success"
                                                : "text-danger"
                                        }
                                    >
                                        {profit.toFixed(2)} ج.م
                                    </strong>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <Button
                content={
                    props.mode === "edit" ? "تحديث الفاتورة" : "حفظ الفاتورة"
                }
                onClick={handleSubmit}
                disabled={!isFormValid || isSubmitting}
            />

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
