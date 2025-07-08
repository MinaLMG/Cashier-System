import { useEffect, useState } from "react";
import axios from "axios";
import TextInput from "../../Basic/TextInput";
import classes from "./PurchaseInvoice.module.css";
import Select from "../../Basic/Select";
import Button from "../../Basic/Button";
import InvoiceRow from "./InvoiceRow";

// Main Component
export default function PurchaseInvoice(props) {
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [invoice, setInvoice] = useState({
        date: new Date(Date.now()).toISOString().split("T")[0],
        supplier: null,
        rows: [
            {
                _id: null,
                product: null,
                quantity: "",
                volume: null,
                buy_price: "",
                phar_price: "",
                cust_price: "",
                expiry: "",
                remaining: "",
            },
        ],
        cost: "0",
    });

    const [rowErrors, setRowErrors] = useState({});
    const [submitMessage, setSubmitMessage] = useState({
        text: "",
        isError: false,
    });
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    // Fetch initial data
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
    useEffect(() => {
        // Get all rows except possibly the last one
        const rowsToValidate = invoice.rows.slice(0, -1);

        // Check if:
        // 1. At least one valid row exists
        // 2. All rows (except possibly last) are valid
        const hasAtLeastOneValidRow = invoice.rows.some(
            (row) => !validateRow(row)
        );
        const allNonLastRowsValid = rowsToValidate.every(
            (row) => !validateRow(row)
        );

        setIsFormValid(
            invoice.date && hasAtLeastOneValidRow && allNonLastRowsValid
        );
    }, [invoice]);
    useEffect(() => {
        let total = 0;
        invoice.rows.forEach((row) => {
            const quantity = Number(row.quantity);
            const buyPrice = Number(row.buy_price);
            const pharPrice = Number(row.phar_price);
            const walkinPrice = Number(row.cust_price);

            // Only add if the row is valid
            if (
                row.product &&
                row.volume &&
                !isNaN(quantity) &&
                quantity > 0 &&
                !isNaN(buyPrice) &&
                !isNaN(pharPrice) &&
                !isNaN(walkinPrice) &&
                buyPrice > 0 &&
                pharPrice > 0 &&
                walkinPrice > 0 &&
                buyPrice <= pharPrice &&
                pharPrice <= walkinPrice
            ) {
                total += quantity * buyPrice;
            }
        });

        setInvoice((prev) => ({ ...prev, cost: total }));
    }, [invoice.rows]);
    useEffect(() => {
        if (props.mode === "edit" && props.invoice) {
            setInvoice({
                _id: invoice._id,
                date: new Date(props.invoice.date).toISOString().split("T")[0],
                supplier: props.invoice.supplier || null,
                rows: props.invoice.rows.map((row) => ({
                    _id: row._id,
                    product: row.product,
                    quantity: row.quantity,
                    volume: row.volume,
                    buy_price: row.buy_price,
                    phar_price: row.phar_price,
                    cust_price: row.cust_price,
                    expiry: row.expiry
                        ? new Date(row.expiry).toISOString().split("T")[0]
                        : "",
                    remaining: row.remaining,
                })),
            });
        }
    }, [props.mode, props.invoice]);
    // Unified validation logic
    const validateRow = (row) => {
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

        return Object.keys(errors).length ? errors : null;
    };

    const canAddNewRow = invoice.rows.every((row, i) => !validateRow(row));

    // Handler functions
    const handleRowChange = (index, key, value) => {
        const updatedRows = [...invoice.rows];
        updatedRows[index][key] = value;
        setInvoice((prev) => ({ ...prev, rows: updatedRows }));
    };

    const addRow = () => {
        const errors = {};
        invoice.rows.forEach((row, index) => {
            const rowError = validateRow(row);
            if (rowError) errors[index] = rowError;
        });

        if (Object.keys(errors).length) {
            setRowErrors(errors);
            return;
        }

        setInvoice((prev) => ({
            ...prev,
            rows: [
                ...prev.rows,
                {
                    product: null,
                    quantity: "",
                    volume: null,
                    buy_price: "",
                    phar_price: "",
                    cust_price: "",
                    expiry: "",
                    remaining: "",
                },
            ],
        }));
        setRowErrors({});
    };

    const removeRow = (index) => {
        setInvoice((prev) => ({
            ...prev,
            rows: prev.rows.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async () => {
        console.log(invoice);
        const validRows = invoice.rows.filter((row) => !validateRow(row));

        if (!invoice.date || validRows.length === 0) {
            setSubmitError("⚠️ يجب إدخال بيانات صحيحة لصف واحد على الأقل");
            return;
        }

        setIsSubmitting(true);
        const requestBody = {
            ...invoice,
            rows: validRows.map((row) => ({
                ...row,
                expiry: row.expiry || null,
            })),
            cost: invoice.cost,
        };

        try {
            if (props.mode === "add") {
                await axios.post(
                    `${process.env.REACT_APP_BACKEND}purchase-invoices/full`,
                    requestBody
                );
            } else if (props.mode === "edit" && props.invoice?._id) {
                await axios.put(
                    `${process.env.REACT_APP_BACKEND}purchase-invoices/full/${props.invoice._id}`,
                    requestBody
                );
            }

            setSubmitMessage({ text: "تم حفظ الفاتورة بنجاح", isError: false });
            if (props.onSuccess) {
                props.onSuccess();
            }
            if (props.onSuccess) props.onSuccess(); // Notify parent

            // Reset form only if adding
            if (props.mode === "add") {
                setInvoice({
                    date: new Date(Date.now()).toISOString().split("T")[0],
                    supplier: null,
                    rows: [
                        {
                            product: null,
                            quantity: "",
                            volume: null,
                            buy_price: "",
                            phar_price: "",
                            cust_price: "",
                            expiry: "",
                            remaining: "",
                        },
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
            {/* Invoice Header */}
            <div style={{ display: "flex", marginBottom: "20px" }}>
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
                        title="المورّد"
                        value={invoice.supplier}
                        onchange={(val) =>
                            setInvoice((prev) => ({ ...prev, supplier: val }))
                        }
                        options={suppliers.map((s) => ({
                            value: s._id,
                            label: s.name,
                        }))}
                    />
                </div>
            </div>

            {/* Invoice Table */}
            <div style={{ width: "95%", margin: "20px auto" }}>
                <table
                    className={`table table-light table-hover table-bordered border-secondary ${classes.table}`}
                >
                    <thead>
                        <tr>
                            <th className={classes.head} scope="col">
                                #
                            </th>
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "300px" }}
                            >
                                اسم المنتج
                            </th>
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "90px" }}
                            >
                                الكمية
                            </th>
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "140px" }}
                            >
                                العبوة
                            </th>
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "130px" }}
                            >
                                سعر الشراء
                            </th>
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "170px" }}
                            >
                                سعر البيع للصيدلية
                            </th>

                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "160px" }}
                            >
                                سعر البيع للزبون
                            </th>
                            <th className={classes.head} scope="col">
                                تاريخ انتهاء الصلاحية
                            </th>
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "135px" }}
                            >
                                الباقى( لو فاتورة باثر رجعى)
                            </th>
                            <th className={classes.head} scope="col"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.rows.map((row, i) => (
                            <InvoiceRow
                                key={i}
                                row={row}
                                index={i}
                                products={products}
                                onChange={handleRowChange}
                                onRemove={removeRow}
                                onAdd={addRow}
                                errors={rowErrors}
                                isLastRow={i === invoice.rows.length - 1}
                                canRemove={
                                    invoice.rows.length > 1 &&
                                    i !== invoice.rows.length - 1
                                }
                            />
                        ))}
                        <tr>
                            <th colSpan="4">الاجمالى</th>
                            <th colSpan="6">
                                <strong
                                    style={{
                                        color: "#333",
                                        fontSize: "1.1rem",
                                    }}
                                >
                                    {Number(invoice.cost || 0).toFixed(2)} ج.م
                                </strong>
                            </th>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Submit Section */}
            <Button
                content={
                    isSubmitting
                        ? "جاري الحفظ..."
                        : props.mode === "edit"
                        ? "تحديث الفاتورة"
                        : "احفظ الفاتورة"
                }
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
