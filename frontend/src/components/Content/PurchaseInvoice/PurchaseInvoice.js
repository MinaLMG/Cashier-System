import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Button from "../../Basic/Button";
import TextInput from "../../Basic/TextInput";
import Select from "../../Basic/Select";
import InvoiceRow from "./InvoiceRow";
import useInvoiceRows from "../../../hooks/useInvoiceRows";
import classes from "./PurchaseInvoice.module.css";

export default function PurchaseInvoice(props) {
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({
        text: "",
        isError: false,
    });
    const [submitError, setSubmitError] = useState("");

    // Define the initial empty row
    const emptyRow = {
        _id: null,
        product: null,
        quantity: "",
        volume: null,
        buy_price: "",
        phar_price: "",
        cust_price: "",
        expiry: "",
        remaining: "",
    };

    // Define row validation function
    const validateRow = useCallback((row) => {
        const errors = {};

        // Required fields
        if (!row.product) errors.product = "اختر المنتج";
        if (!row.volume) errors.volume = "اختر العبوة";

        // Numeric fields validation
        if (!row.quantity || isNaN(row.quantity) || Number(row.quantity) <= 0) {
            errors.quantity = "ادخل كمية صحيحة";
        }

        // Price validation
        const buyPrice = Number(row.buy_price);
        const pharPrice = Number(row.phar_price);
        const custPrice = Number(row.cust_price);

        if (isNaN(buyPrice) || buyPrice <= 0)
            errors.buy_price = "سعر شراء غير صحيح";
        if (isNaN(pharPrice) || pharPrice <= 0)
            errors.phar_price = "سعر صيدلية غير صحيح";
        if (isNaN(custPrice) || custPrice <= 0)
            errors.cust_price = "سعر زبون غير صحيح";

        if (pharPrice < buyPrice) {
            errors.phar_price = "يجب أن يكون سعر الصيدلية ≥ سعر الشراء";
        }

        if (custPrice < pharPrice) {
            errors.cust_price = "يجب أن يكون سعر الزبون ≥ سعر الصيدلية";
        }

        return errors;
    }, []);

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
    } = useInvoiceRows(emptyRow, validateRow, [products]);

    // Initialize invoice state
    const [invoice, setInvoice] = useState({
        date: new Date(Date.now()).toISOString().split("T")[0],
        supplier: null,
        cost: "0",
    });

    // Calculate total cost whenever rows change
    useEffect(() => {
        let total = 0;
        invoiceRows.forEach((row) => {
            const quantity = Number(row.quantity);
            const buyPrice = Number(row.buy_price);

            // Only add if the row is valid
            if (
                row.product &&
                row.volume &&
                !isNaN(quantity) &&
                quantity > 0 &&
                !isNaN(buyPrice) &&
                buyPrice > 0
            ) {
                total += quantity * buyPrice;
            }
        });
        setInvoice((prev) => ({ ...prev, cost: total.toString() }));
    }, [invoiceRows]);

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [suppliersRes, productsRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_BACKEND}suppliers`),
                    axios.get(`${process.env.REACT_APP_BACKEND}products/full`),
                ]);
                setSuppliers(suppliersRes.data);
                setProducts(productsRes.data);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            }
        };
        fetchData();
    }, []);

    // Load invoice data if in edit mode
    useEffect(() => {
        if (props.mode === "edit" && props.invoice) {
            const { date, supplier, rows, cost } = props.invoice;
            setInvoice({
                date,
                supplier,
                cost,
            });
            setInvoiceRows(rows.length > 0 ? rows : [{ ...emptyRow }]);
        }
    }, [props.mode, props.invoice, setInvoiceRows, emptyRow]);

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

        // Filter valid rows
        const validRows = invoiceRows.filter(
            (row) =>
                !validateRow(row) || Object.keys(validateRow(row)).length === 0
        );

        if (!invoice.date || validRows.length === 0) {
            setSubmitError("⚠️ يجب إدخال بيانات صحيحة لصف واحد على الأقل");
            return;
        }

        setIsSubmitting(true);
        const requestBody = {
            date: invoice.date,
            supplier: invoice.supplier,
            rows: validRows.map((row) => ({
                ...row,
                expiry: row.expiry || null,
            })),
            cost: Number(invoice.cost),
        };

        try {
            let response;
            if (props.mode === "edit") {
                response = await axios.put(
                    `${process.env.REACT_APP_BACKEND}purchase-invoices/${props.invoice._id}`,
                    requestBody
                );
            } else {
                response = await axios.post(
                    `${process.env.REACT_APP_BACKEND}purchase-invoices`,
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

    return (
        <div className={classes.container}>
            <h2 className={classes.formTitle}>
                {props.mode === "edit"
                    ? "تعديل فاتورة مشتريات"
                    : "إضافة فاتورة مشتريات"}
            </h2>

            <div className="row mb-3">
                <div className="col-md-6">
                    <TextInput
                        type="date"
                        label="التاريخ"
                        id="invoice-date"
                        value={invoice.date}
                        onchange={(value) => handleInvoiceChange("date", value)}
                    />
                </div>
                <div className="col-md-6">
                    <Select
                        title="المورد"
                        value={invoice.supplier || ""}
                        onchange={(value) =>
                            handleInvoiceChange("supplier", value)
                        }
                        options={[
                            { value: "", label: "بدون مورد" },
                            ...suppliers.map((s) => ({
                                value: s._id,
                                label: s.name,
                            })),
                        ]}
                    />
                </div>
            </div>

            <table
                className={`table table-light table-hover table-bordered border-secondary ${classes.table}`}
            >
                <thead>
                    <tr>
                        <th className={classes.head} scope="col">
                            #
                        </th>
                        <th className={classes.head} scope="col">
                            المنتج
                        </th>
                        <th className={classes.head} scope="col">
                            العبوة
                        </th>
                        <th className={classes.head} scope="col">
                            الكمية
                        </th>
                        <th className={classes.head} scope="col">
                            سعر الشراء
                        </th>
                        <th className={classes.head} scope="col">
                            سعر البيع للصيدلية
                        </th>
                        <th className={classes.head} scope="col">
                            سعر البيع للزبون
                        </th>
                        <th className={classes.head} scope="col">
                            تاريخ انتهاء الصلاحية
                        </th>
                        <th className={classes.head} scope="col">
                            الباقى( لو فاتورة باثر رجعى)
                        </th>
                        <th className={classes.head} scope="col"></th>
                    </tr>
                </thead>
                <tbody>
                    {invoiceRows.map((row, i) => {
                        return (
                            <InvoiceRow
                                key={i}
                                row={row}
                                index={i}
                                products={products}
                                onChange={handleRowChange}
                                onRemove={removeRow}
                                onAdd={addRow}
                                errors={rowErrors[i] || {}}
                                isLastRow={i === invoiceRows.length - 1}
                                canRemove={
                                    invoiceRows.length > 1 &&
                                    i !== invoiceRows.length - 1
                                }
                            />
                        );
                    })}

                    {/* Total row */}
                    <tr>
                        <td colSpan="4" className={classes.item}>
                            <strong>إجمالي الفاتورة:</strong>
                        </td>
                        <td colSpan="5" className={classes.item}>
                            <div className="d-flex justify-content-between">
                                <strong>
                                    {Number(invoice.cost).toFixed(2)} ج.م
                                </strong>
                            </div>
                        </td>
                        <td className={classes.item}></td>
                    </tr>
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
