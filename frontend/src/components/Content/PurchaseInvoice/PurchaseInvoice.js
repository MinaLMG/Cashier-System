import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Button from "../../Basic/Button";
import TextInput from "../../Basic/TextInput";
import Select from "../../Basic/Select";
import InvoiceRow from "./InvoiceRow";
import useInvoiceRows from "../../../hooks/useInvoiceRows";
import classes from "./PurchaseInvoice.module.css";
import DateTimeInput from "../../Basic/DateTimeInput";
import ProductForm from "../AddProduct/ProductForm";
import Modal from "../../UI/Modal";
import FormMessage from "../../Basic/FormMessage";

export default function PurchaseInvoice(props) {
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({
        text: "",
        isError: false,
    });
    const [submitError, setSubmitError] = useState("");
    const [showAddProductModal, setShowAddProductModal] = useState(false);

    // Determine if we're in view mode
    const isViewMode = props.mode === "view";

    // Use this function to disable inputs in view mode
    const getDisabledState = (field) => {
        if (isViewMode) return true;

        // In edit mode, disable product, volume and quantity fields
        // if (
        //     props.mode === "edit" &&
        //     ["product", "volume", "quantity"].includes(field)
        // ) {
        //     return true;
        // }

        return false;
    };

    // Define the initial empty row
    const emptyRow = {
        _id: null,
        product: null,
        quantity: "",
        volume: null,
        v_buy_price: "",
        v_pharmacy_price: "",
        v_walkin_price: "",
        expiry: null,
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
        const v_buy_price = Number(row.v_buy_price);
        const v_pharmacyPrice = Number(row.v_pharmacy_price);
        const v_walkinPrice = Number(row.v_walkin_price);

        if (isNaN(v_buy_price) || v_buy_price <= 0)
            errors.v_buy_price = "سعر شراء غير صحيح";
        if (isNaN(v_pharmacyPrice) || v_pharmacyPrice <= 0)
            errors.v_pharmacy_price = "سعر صيدلية غير صحيح";
        if (isNaN(v_walkinPrice) || v_walkinPrice <= 0)
            errors.v_walkin_price = "سعر زبون غير صحيح";

        if (v_pharmacyPrice < v_buy_price) {
            errors.v_pharmacy_price = "يجب أن يكون سعر الصيدلية ≥ سعر الشراء";
        }

        if (v_walkinPrice < v_pharmacyPrice) {
            errors.v_walkin_price = "يجب أن يكون سعر الزبون ≥ سعر الصيدلية";
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

    // Initialize invoice state with ISO date string
    const [invoice, setInvoice] = useState({
        date: new Date().toISOString(),
        supplier: null,
        total_cost: "0",
    });

    // Calculate total cost whenever rows change
    useEffect(() => {
        let total = 0;
        invoiceRows.forEach((row) => {
            const quantity = Number(row.quantity);
            const v_buy_price = Number(row.v_buy_price);

            // Only add if the row is valid
            if (
                row.product &&
                row.volume &&
                !isNaN(quantity) &&
                quantity > 0 &&
                !isNaN(v_buy_price) &&
                v_buy_price > 0
            ) {
                total += quantity * v_buy_price;
            }
        });
        setInvoice((prev) => ({ ...prev, total_cost: total.toString() }));
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

    // Load invoice data if in edit or view mode
    useEffect(() => {
        if ((props.mode === "edit" || props.mode === "view") && props.invoice) {
            const { date, supplier, rows, total_cost } = props.invoice;
            setInvoice({
                date,
                supplier,
                total_cost,
            });
            setInvoiceRows(rows.length > 0 ? rows : [{ ...emptyRow }]);
        }
    }, []);

    // Handle invoice field changes
    const handleInvoiceChange = (field, value) => {
        console.log(field, value);
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
            total_cost: Number(invoice.total_cost),
        };

        try {
            let response;
            if (props.mode === "edit") {
                response = await axios.put(
                    `${process.env.REACT_APP_BACKEND}purchase-invoices/full/${props.invoice._id}`,
                    requestBody
                );
            } else {
                response = await axios.post(
                    `${process.env.REACT_APP_BACKEND}purchase-invoices/full`,
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
                    date: new Date().toISOString(),
                    supplier: "",
                    total_cost: "0",
                });
                setInvoiceRows([{ ...emptyRow }]);
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

    // Handle add product success
    const handleAddProductSuccess = (id) => {
        // Fetch the full product details from the backend using the ID
        axios
            .get(`${process.env.REACT_APP_BACKEND}products/${id}`)
            .then((response) => {
                const newProduct = response.data;

                // Add the new product to the products list
                setProducts((prevProducts) => [...prevProducts, newProduct]);

                // Close the modal
                setShowAddProductModal(false);

                // Optionally, select the new product in the current row
                if (invoiceRows.length > 0) {
                    const lastRowIndex = invoiceRows.length - 1;
                    const lastRow = invoiceRows[lastRowIndex];

                    if (!lastRow.product) {
                        handleRowChange(
                            lastRowIndex,
                            "product",
                            newProduct._id
                        );
                    }
                }
            })
            .catch((error) => {
                console.error("Error fetching new product:", error);
                setSubmitMessage({
                    text: `❌ حدث خطأ في جلب بيانات المنتج: ${error.message}`,
                    isError: true,
                });
            });
    };

    // Add this function to handle product addition success
    const handleProductAdded = (newProduct) => {
        // This should call the existing handleAddProductSuccess function
        handleAddProductSuccess(newProduct._id);
    };

    return (
        <div className={classes.container}>
            <h2 className={classes.formTitle}>
                {props.mode === "edit"
                    ? "تعديل فاتورة مشتريات"
                    : props.mode === "view"
                    ? "عرض فاتورة مشتريات"
                    : "إضافة فاتورة مشتريات"}
            </h2>

            {!isViewMode && (
                <div className="d-flex justify-content-end mb-3">
                    <Button
                        content="إضافة منتج جديد"
                        onClick={() => setShowAddProductModal(true)}
                        type="primary"
                    />
                </div>
            )}

            <div className="row mb-3">
                <div className="col-md-4">
                    <DateTimeInput
                        label="التاريخ"
                        id="invoice-date"
                        value={invoice.date}
                        onchange={(value) => handleInvoiceChange("date", value)}
                        includeTime={false}
                    />
                </div>
                <div className="col-md-4">
                    <Select
                        title="المورد"
                        value={invoice.supplier || ""}
                        options={[
                            { value: "", label: "بدون مورّد" },
                            ...suppliers.map((s) => ({
                                value: s._id,
                                label: s.name,
                            })),
                        ]}
                        onchange={(val) => handleInvoiceChange("supplier", val)}
                        disabled={getDisabledState()}
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
                            الكمية
                        </th>
                        <th className={classes.head} scope="col">
                            العبوة
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
                        {!isViewMode && (
                            <th className={classes.head} scope="col"></th>
                        )}
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
                                errors={isViewMode ? {} : rowErrors[i] || {}}
                                isLastRow={i === invoiceRows.length - 1}
                                canRemove={
                                    invoiceRows.length > 1 &&
                                    i !== invoiceRows.length - 1
                                }
                                disabled={getDisabledState}
                                viewMode={isViewMode}
                            />
                        );
                    })}

                    {/* Total row */}
                    <tr>
                        <td colSpan="4" className={classes.item}>
                            <strong>إجمالي الفاتورة:</strong>
                        </td>
                        <td
                            colSpan={isViewMode ? "5" : "6"}
                            className={classes.item}
                        >
                            <div className="d-flex justify-content-between">
                                <strong>
                                    {Number(invoice.total_cost).toFixed(2)} ج.م
                                </strong>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

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
                            ? "تحديث الفاتورة"
                            : "حفظ الفاتورة"
                    }
                    onClick={handleSubmit}
                    disabled={!isFormValid || isSubmitting}
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

            {/* Modal for adding new product */}
            {showAddProductModal && (
                <Modal onClose={() => setShowAddProductModal(false)}>
                    <ProductForm
                        mode="add"
                        onSuccess={handleProductAdded}
                        onCancel={() => setShowAddProductModal(false)}
                        inModal={true}
                    />
                </Modal>
            )}
        </div>
    );
}
