import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Button from "../../Basic/Button";
import TextInput from "../../Basic/TextInput";
import DateTimeInput from "../../Basic/DateTimeInput";
import Select from "../../Basic/Select";
import SalesInvoiceRow from "./SalesInvoiceRow";
import useInvoiceRows from "../../../hooks/useInvoiceRows";
import classes from "./SalesInvoice.module.css";
import FormMessage from "../../Basic/FormMessage";

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

    // Load invoice data if in edit or view mode
    useEffect(() => {
        if ((props.mode === "edit" || props.mode === "view") && props.invoice) {
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
    }, []);

    // Calculate total whenever rows or invoice type changes
    useEffect(() => {
        const calculateTotal = () => {
            return invoiceRows.reduce((total, row) => {
                const product = products.find((p) => p._id === row.product);
                if (!product) return total;

                // Get unit price based on customer type
                const u_price =
                    invoice.type === "walkin"
                        ? product.u_walkin_price
                        : product.u_pharmacy_price;

                // Find the volume conversion value
                const volumeEntry = product?.values?.find(
                    (v) => v.id === row.volume
                );
                const value = Number(volumeEntry?.val || 1);

                // Calculate volume price
                const v_price = u_price * value;

                const quantity = Number(row.quantity);

                return (
                    total +
                    (isNaN(quantity) || isNaN(v_price) ? 0 : quantity * v_price)
                );
            }, 0);
        };

        const total_selling_price = calculateTotal();
        const final_amount = total_selling_price - Number(invoice.offer || 0);

        setFinalTotal(final_amount);

        // Calculate profit (only in edit mode when we know the purchase cost)
        if (props.mode === "edit") {
            setProfit(final_amount - (props.invoice?.total_purchase_cost || 0));
        }
    }, [
        invoiceRows,
        invoice.offer,
        invoice.type,
        products,
        props.mode,
        props.invoice?.total_purchase_cost,
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
        // For edit mode, we'll only validate and update the main invoice data
        if (props.mode === "edit") {
            // Validate required fields
            if (!invoice.date || !invoice.type) {
                setSubmitError("⚠️ يجب إدخال النوع والتاريخ");
                return;
            }

            // Validate offer is a non-negative number
            if (isNaN(Number(invoice.offer)) || Number(invoice.offer) < 0) {
                setSubmitError("⚠️ يجب أن يكون الخصم رقمًا غير سالب");
                return;
            }

            setIsSubmitting(true);

            // In edit mode, we only update the main invoice data
            const requestBody = {
                customer: invoice.customer || null,
                type: invoice.type,
                date: invoice.date,
                offer: Number(invoice.offer || 0),
            };

            try {
                const response = await axios.put(
                    `${process.env.REACT_APP_BACKEND}sales-invoices/${props.invoice._id}`,
                    requestBody
                );

                setSubmitMessage({
                    text: "✅ تم تحديث بيانات الفاتورة بنجاح",
                    isError: false,
                });

                if (props.onSuccess) {
                    props.onSuccess(response.data);
                }
            } catch (error) {
                console.error("Error updating invoice:", error);
                setSubmitMessage({
                    text: `❌ حدث خطأ أثناء تحديث الفاتورة: ${
                        error.response?.data?.error || error.message
                    }`,
                    isError: true,
                });
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        // For add mode, continue with the existing logic
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

        // Calculate total selling price for add mode
        const total_selling_price = validRows.reduce((total, row) => {
            const product = products.find((p) => p._id === row.product);
            if (!product) return total;

            // Get unit price based on customer type
            const u_price =
                invoice.type === "walkin"
                    ? product.u_walkin_price
                    : product.u_pharmacy_price;

            // Find the volume conversion value
            const volumeEntry = product?.values?.find(
                (v) => v.id === row.volume
            );
            const value = Number(volumeEntry?.val || 1);

            // Calculate volume price
            const v_price = u_price * value;

            const quantity = Number(row.quantity);

            return (
                total +
                (isNaN(quantity) || isNaN(v_price) ? 0 : quantity * v_price)
            );
        }, 0);

        // Calculate final amount
        const final_amount = total_selling_price - Number(invoice.offer || 0);

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
            total_selling_price: finalTotal,
            finalTotal: finalTotal,
        };

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND}sales-invoices/full`,
                requestBody
            );

            setSubmitMessage({
                text: "✅ تم إضافة الفاتورة بنجاح",
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
        } catch (error) {
            console.error("Error submitting invoice:", error);
            setSubmitMessage({
                text: `❌ حدث خطأ: ${
                    error.response?.data?.error || error.message
                }`,
                isError: true,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Add this function to handle barcode scanning
    const handleBarcodeChange = useCallback(
        async (index, barcode) => {
            if (!barcode || barcode.trim() === "") return; // Skip empty barcodes

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

                    // Skip if the product and volume are already set to these values
                    if (
                        updatedRows[index].product === productId &&
                        updatedRows[index].volume === volumeId
                    ) {
                        return;
                    }

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

    // Determine if we're in view mode
    const isViewMode = props.mode === "view";

    // Use this function to disable inputs in view mode
    const getDisabledState = () => {
        return isViewMode;
    };

    return (
        <div className={classes.container}>
            <h2 className={classes.formTitle}>
                {props.mode === "edit"
                    ? "تعديل بيانات فاتورة مبيعات"
                    : props.mode === "view"
                    ? "عرض فاتورة مبيعات"
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
                        disabled={getDisabledState()}
                    />
                </div>
                <div className="col-md-3">
                    <Select
                        label="نوع العميل"
                        value={invoice.type}
                        options={[
                            { value: "walkin", label: "زبون" },
                            { value: "pharmacy", label: "صيدلية" },
                        ]}
                        onchange={(val) => handleInvoiceChange("type", val)}
                        disabled={getDisabledState()}
                    />
                </div>
                <div className="col-md-3">
                    <Select
                        label="العميل"
                        value={invoice.customer}
                        options={[
                            { value: "", label: "بدون عميل" },
                            ...customers
                                .filter(
                                    (c) =>
                                        !invoice.type || c.type === invoice.type
                                )
                                .map((c) => ({
                                    value: c._id,
                                    label: c.name,
                                })),
                        ]}
                        onchange={(val) => handleInvoiceChange("customer", val)}
                        disabled={getDisabledState()}
                    />
                </div>
                <div className="col-md-3">
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
                        disabled={getDisabledState()}
                    />
                </div>
            </div>

            {/* Only show the items table in add mode or view mode */}
            {props.mode !== "edit" && (
                <>
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
                                {!isViewMode && <th></th>}
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
                                        disabled={getDisabledState()}
                                        viewMode={isViewMode}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </>
            )}

            {/* In edit mode or view mode, show a summary of the invoice */}
            {(props.mode === "edit" || props.mode === "view") && (
                <div className="card mb-4">
                    <div className="card-header bg-light">
                        <h5 className="mb-0">ملخص الفاتورة</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-4">
                                <p>
                                    <strong>إجمالي قبل الخصم:</strong>{" "}
                                    {props.invoice?.total_selling_price?.toFixed(
                                        2
                                    ) || 0}{" "}
                                    ج.م
                                </p>
                            </div>
                            <div className="col-md-4">
                                <p>
                                    <strong>الخصم:</strong>{" "}
                                    {invoice.offer?.toFixed(2) || 0} ج.م
                                </p>
                            </div>
                            <div className="col-md-4">
                                <p>
                                    <strong>الإجمالي بعد الخصم:</strong>{" "}
                                    {(
                                        props.invoice?.total_selling_price -
                                        Number(invoice.offer || 0)
                                    ).toFixed(2) || 0}{" "}
                                    ج.م
                                </p>
                            </div>
                        </div>

                        {props.mode === "edit" && (
                            <div className="alert alert-info">
                                <i className="fas fa-info-circle me-2"></i>
                                ملاحظة: لتعديل عناصر الفاتورة، يرجى حذف الفاتورة
                                وإنشاء فاتورة جديدة. أو استخدم نظام المرتجعات و
                                الاضافة.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Show appropriate buttons based on mode */}
            {isViewMode ? (
                <Button
                    content="العودة"
                    onClick={props.onBack || (() => window.history.back())}
                    type="secondary"
                />
            ) : (
                <Button
                    content={
                        props.mode === "edit"
                            ? "تحديث بيانات الفاتورة"
                            : "حفظ الفاتورة"
                    }
                    onClick={handleSubmit}
                    disabled={
                        props.mode === "edit"
                            ? isSubmitting
                            : !isFormValid || isSubmitting
                    }
                />
            )}

            {submitError && !isViewMode && (
                <div style={{ color: "red", marginTop: "10px" }}>
                    {submitError}
                </div>
            )}
            {!isViewMode && (
                <FormMessage
                    text={submitMessage.text}
                    isError={submitMessage.isError}
                    className="mt-3"
                />
            )}
        </div>
    );
}
