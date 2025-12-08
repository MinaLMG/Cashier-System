import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Button from "../../Basic/Button";
import TextInput from "../../Basic/TextInput";
import Select from "../../Basic/Select";
import InputTable from "../../Basic/InputTable";
import InvoiceRow from "./InvoiceRow";
import useInvoiceRows from "../../../hooks/useInvoiceRows";
import classes from "./PurchaseInvoice.module.css";
import DateTimeInput from "../../Basic/DateTimeInput";
import ProductForm from "../AddProduct/ProductForm";
import SupplierForm from "../Suppliers/SupplierForm";
import Modal from "../../UI/Modal";
import FormMessage from "../../Basic/FormMessage";

export default function PurchaseInvoice(props) {
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [productsLoaded, setProductsLoaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({
        text: "",
        isError: false,
    });
    const [formError, setFormError] = useState(""); // Form-level error below submit button
    const [fieldErrors, setFieldErrors] = useState({}); // Individual field errors
    const [hasUserInteracted, setHasUserInteracted] = useState(false); // Track if user has started interacting
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
    const [priceSuggestions, setPriceSuggestions] = useState({}); // Store price suggestions for each row

    // Add ref to track if suspended invoice has been loaded
    const suspendedInvoiceLoaded = useRef(false);

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

        // For add/remove buttons, only disable in view mode
        if (field === "add" || field === "remove") {
            return isViewMode;
        }

        return false;
    };

    // Define the initial empty row
    const emptyRow = {
        _id: null,
        product: null,
        quantity: "",
        volume: null,
        barcode: "",
        v_buy_price: "",
        v_pharmacy_price: "",
        v_walkin_price: "",
        v_guidal_price: "",
        expiry: null,
        // remaining: "", // COMMENTED OUT - will be set to full quantity automatically
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
        const v_guidalPrice = Number(row.v_guidal_price);

        if (isNaN(v_buy_price) || v_buy_price <= 0)
            errors.v_buy_price = "سعر شراء غير صحيح";
        if (isNaN(v_pharmacyPrice) || v_pharmacyPrice <= 0)
            errors.v_pharmacy_price = "سعر صيدلية غير صحيح";
        if (isNaN(v_walkinPrice) || v_walkinPrice <= 0)
            errors.v_walkin_price = "سعر زبون غير صحيح";
        if (isNaN(v_guidalPrice) || v_guidalPrice <= 0)
            errors.v_guidal_price = "السعر الاسترشادى غير صحيح";

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
        handleRowChange: originalHandleRowChange,
        addRow,
        removeRow,
        setRows: setInvoiceRows,
        validateRows,
    } = useInvoiceRows(emptyRow, validateRow, [products]);

    // Fetch price suggestions when product and volume are both set
    const fetchPriceSuggestions = useCallback(
        async (index, productId, volumeId) => {
            // Check for valid productId and volumeId
            if (
                !productId ||
                !volumeId ||
                productId === "" ||
                volumeId === ""
            ) {
                return;
            }

            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND}purchase-invoices/price-suggestions/${productId}/${volumeId}`
                );

                if (response.data.hasSuggestions) {
                    setPriceSuggestions((prev) => ({
                        ...prev,
                        [index]: response.data.suggestedPrices,
                    }));
                } else {
                    // Clear suggestions if no historical data
                    setPriceSuggestions((prev) => {
                        const newSuggestions = { ...prev };
                        delete newSuggestions[index];
                        return newSuggestions;
                    });
                }
            } catch (error) {
                console.error("Error fetching price suggestions:", error);
                // Clear suggestions on error
                setPriceSuggestions((prev) => {
                    const newSuggestions = { ...prev };
                    delete newSuggestions[index];
                    return newSuggestions;
                });
            }
        },
        []
    );

    // Lazy-load full product details and cache them in the products array
    const ensureFullProductLoaded = useCallback(
        async (productId) => {
            if (!productId) return;
            console.log("[ensureFullProductLoaded] products", products);
            // If we already have full data for this product, skip the request
            const existing = products.find((p) => p._id === productId);
            console.log("[ensureFullProductLoaded] existing", existing);
            if (
                existing &&
                existing.values &&
                existing.u_walkin_price != null
            ) {
                return;
            }

            try {
                const res = await axios.get(
                    `${process.env.REACT_APP_BACKEND}products/full/${productId}`
                );
                console.log("[ensureFullProductLoaded] res", res.data);
                const fullProduct = res.data;
                setProducts((prev) => {
                    const exists = prev.some((p) => p._id === productId);
                    return exists
                        ? prev.map((p) =>
                              p._id === productId ? fullProduct : p
                          )
                        : [...prev, fullProduct];
                });
            } catch (err) {
                console.error("Failed to load full product details:", err);
            }
        },
        [products]
    );

    // Function to lookup product and volume from barcode using API (same as SalesInvoice)
    const lookupProductFromBarcode = useCallback(
        async (index, barcode) => {
            if (!barcode || barcode.trim() === "") return;

            try {
                // Find product and volume that has this barcode
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND}has-volumes/barcode/${barcode}`
                );

                if (
                    response.data &&
                    response.data.product &&
                    response.data.volume
                ) {
                    const productId = response.data.product;
                    const volumeId = response.data.volume;

                    // Ensure full product details are loaded before setting product/volume
                    await ensureFullProductLoaded(productId);

                    // Auto-select product and volume based on barcode
                    originalHandleRowChange(index, "product", productId);
                    originalHandleRowChange(index, "volume", volumeId);

                    // Fetch price suggestions for the found product and volume
                    fetchPriceSuggestions(index, productId, volumeId);

                    // Show success message
                    setSubmitMessage({
                        text: `✅ تم العثور على المنتج: ${response.data.productName} - ${response.data.volumeName}`,
                        isError: false,
                    });
                    setTimeout(() => {
                        setSubmitMessage({ text: "", isError: false });
                    }, 3000);
                } else {
                    // Show error message for unknown barcode
                    setSubmitMessage({
                        text: `❌ لم يتم العثور على منتج بالباركود: ${barcode}`,
                        isError: true,
                    });
                    setTimeout(() => {
                        setSubmitMessage({ text: "", isError: false });
                    }, 3000);
                }
            } catch (error) {
                console.error("Error looking up barcode:", error);
                setSubmitMessage({
                    text: `❌ خطأ في البحث عن الباركود: ${barcode}`,
                    isError: true,
                });
                setTimeout(() => {
                    setSubmitMessage({ text: "", isError: false });
                }, 3000);
            }
        },
        [
            originalHandleRowChange,
            fetchPriceSuggestions,
            ensureFullProductLoaded,
        ]
    );

    // Handle barcode change (same as SalesInvoice)
    const handleBarcodeChange = useCallback(
        (index, barcode) => {
            lookupProductFromBarcode(index, barcode);
        },
        [lookupProductFromBarcode]
    );

    // Wrap handleRowChange to lazy-load product details and fetch suggestions
    const handleRowChange = useCallback(
        (index, field, value) => {
            originalHandleRowChange(index, field, value);

            const currentRow = invoiceRows[index];

            // When product changes, ensure we have full product details loaded
            if (field === "product" && value) {
                ensureFullProductLoaded(value);
            }

            // Fetch suggestions when product changes (and volume is already set)
            if (field === "product" && value && currentRow?.volume) {
                fetchPriceSuggestions(index, value, currentRow.volume);
            }
            // Fetch suggestions when volume changes (and product is already set)
            else if (field === "volume" && value && currentRow?.product) {
                fetchPriceSuggestions(index, currentRow.product, value);
            }
        },
        [
            originalHandleRowChange,
            invoiceRows,
            fetchPriceSuggestions,
            ensureFullProductLoaded,
        ]
    );

    // Normalize row data regardless of source (suspended/edit)
    const getProductId = useCallback((product) => {
        if (!product) return null;
        if (typeof product === "object")
            return product._id || product.id || null;
        return product;
    }, []);

    const getVolumeId = useCallback((volume) => {
        if (!volume) return null;
        if (typeof volume === "object") return volume._id || volume.id || null;
        return volume;
    }, []);

    const normalizeRows = useCallback(
        (rows = []) =>
            rows.map((row) => ({
                ...row,
                product: getProductId(row.product),
                volume: getVolumeId(row.volume),
            })),
        [getProductId, getVolumeId]
    );

    // Initialize invoice state with ISO date string
    const [invoice, setInvoice] = useState({
        date: new Date().toISOString(),
        supplier: null,
        total_cost: "0",
        notes: "",
    });

    // Form validation function
    const validateForm = useCallback(() => {
        // Only validate if user has interacted or we're in edit mode
        if (!hasUserInteracted && props.mode !== "edit") {
            setFormError("");
            setFieldErrors({});
            return false;
        }

        const newFieldErrors = {};
        let hasErrors = false;

        // Validate invoice fields
        if (!invoice.date) {
            newFieldErrors.date = "التاريخ مطلوب";
            hasErrors = true;
        } else {
            // Check if date is in the future
            const selectedDate = new Date(invoice.date);
            const now = new Date();
            // Set time to start of day for comparison
            selectedDate.setHours(0, 0, 0, 0);
            now.setHours(0, 0, 0, 0);

            if (selectedDate > now) {
                newFieldErrors.date = "لا يمكن اختيار تاريخ في المستقبل";
                hasErrors = true;
            }
        }

        // Validate invoice rows
        if (
            invoiceRows.length === 0 ||
            (invoiceRows.length === 1 && !invoiceRows[0].product)
        ) {
            newFieldErrors.rows = "يجب إضافة منتج واحد على الأقل";
            hasErrors = true;
        }

        // Validate each row
        invoiceRows.forEach((row, index) => {
            const rowErrors = validateRow(row);
            Object.keys(rowErrors).forEach((field) => {
                newFieldErrors[`row_${index}_${field}`] = rowErrors[field];
                hasErrors = true;
            });
        });

        setFieldErrors(newFieldErrors);
        setFormError(hasErrors ? "يرجى إصلاح الأخطاء أعلاه" : "");
        return !hasErrors;
    }, [invoice, invoiceRows, hasUserInteracted, props.mode, validateRow]);

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

    // Fetch data on component mount (lightweight product options)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [suppliersRes, productsRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_BACKEND}suppliers`),
                    axios.get(
                        `${process.env.REACT_APP_BACKEND}products/options`
                    ),
                ]);
                setSuppliers(suppliersRes.data);
                setProducts(productsRes.data); // Only {_id, name} at this stage
                setProductsLoaded(true);
            } catch (err) {
                console.error("Failed to fetch data:", err);
            }
        };
        fetchData();
    }, []);

    // Load invoice data if in edit or view mode
    useEffect(() => {
        if (
            !productsLoaded // Wait until base products are loaded to avoid overwrite
        ) {
            return;
        }

        if ((props.mode === "edit" || props.mode === "view") && props.invoice) {
            const { date, supplier, rows, total_cost, notes } = props.invoice;
            setInvoice({
                date,
                supplier,
                total_cost,
                notes: notes || "",
            });
            const normalizedRows = normalizeRows(rows);
            setInvoiceRows(
                normalizedRows.length > 0 ? normalizedRows : [{ ...emptyRow }]
            );

            // Pre-load full product details for all products used in the invoice
            const uniqueProductIds = [
                ...new Set(
                    normalizedRows
                        .map((r) => getProductId(r.product))
                        .filter(Boolean)
                ),
            ];
            uniqueProductIds.forEach((id) => {
                ensureFullProductLoaded(id);
            });
        } else if (
            props.mode !== "edit" &&
            props.mode !== "view" &&
            !suspendedInvoiceLoaded.current
        ) {
            // Load suspended invoice only in add mode and only once
            const suspended = localStorage.getItem("suspendedPurchaseInvoice");
            if (suspended) {
                try {
                    const data = JSON.parse(suspended);
                    const normalizedRows = normalizeRows(data.rows || []);
                    setInvoice(data.invoice);
                    setInvoiceRows(
                        normalizedRows.length > 0
                            ? normalizedRows
                            : [{ ...emptyRow }]
                    );

                    console.log("[re-hydrate] normalizedRows", normalizedRows);

                    // Pre-load full product details for all products in suspended invoice
                    const uniqueProductIds = [
                        ...new Set(
                            normalizedRows
                                .map((r) => getProductId(r.product))
                                .filter(Boolean)
                        ),
                    ];
                    console.log(
                        "[re-hydrate] uniqueProductIds",
                        uniqueProductIds
                    );
                    uniqueProductIds.forEach((id) => {
                        console.log("[re-hydrate] id", id);
                        ensureFullProductLoaded(id);
                    });

                    setSubmitMessage({
                        text: "✅ تم استرجاع الفاتورة المعلقة",
                        isError: false,
                    });
                    setTimeout(() => {
                        setSubmitMessage({ text: "", isError: false });
                    }, 3000);

                    // Remove from localStorage after loading so it's one-shot
                    localStorage.removeItem("suspendedPurchaseInvoice");
                } catch (err) {
                    console.error("Error loading suspended invoice:", err);
                }
            }

            // Mark that we have attempted to load (whether or not data existed)
            suspendedInvoiceLoaded.current = true;
        }
    }, [
        emptyRow,
        props.invoice,
        props.mode,
        setInvoiceRows,
        ensureFullProductLoaded,
        getProductId,
        getVolumeId,
        normalizeRows,
        productsLoaded,
    ]);

    // Reset suspended invoice loaded flag when mode changes
    useEffect(() => {
        suspendedInvoiceLoaded.current = false;
    }, [props.mode]);

    // Handle invoice field changes
    const handleInvoiceChange = (field, value) => {
        setInvoice((prev) => ({ ...prev, [field]: value }));
    };

    // Suspend invoice - save current state to localStorage
    const handleSuspendInvoice = () => {
        const dataToSave = {
            invoice,
            rows: invoiceRows,
        };
        localStorage.setItem(
            "suspendedPurchaseInvoice",
            JSON.stringify(dataToSave)
        );
        setSubmitMessage({
            text: "✅ تم تعليق الفاتورة بنجاح. يمكنك العودة إليها لاحقاً",
            isError: false,
        });
        setTimeout(() => {
            setSubmitMessage({ text: "", isError: false });
        }, 3000);
    };

    // Clear suspended invoice
    const clearSuspendedInvoice = () => {
        localStorage.removeItem("suspendedPurchaseInvoice");
        suspendedInvoiceLoaded.current = false; // Reset the ref
    };

    // Reset form to initial state
    const handleReset = () => {
        setInvoice({
            date: new Date().toISOString(),
            supplier: null,
            total_cost: "0",
        });
        setInvoiceRows([{ ...emptyRow }]);
        setFieldErrors({});
        setFormError("");
        setSubmitMessage({ text: "", isError: false });
        setPriceSuggestions({}); // Clear all price suggestions
        clearSuspendedInvoice();
        setHasUserInteracted(false);
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
            setFormError("⚠️ يجب إدخال بيانات صحيحة لصف واحد على الأقل");
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
            notes: invoice.notes || "",
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

            // Clear success message after 5 seconds
            setTimeout(() => {
                setSubmitMessage({
                    text: "",
                    isError: false,
                });
            }, 5000);

            // Clear suspended invoice after successful submission
            clearSuspendedInvoice();

            // Reset form to initial state if not in edit mode
            if (props.mode !== "edit") {
                setInvoice({
                    date: new Date().toISOString(),
                    supplier: "",
                    total_cost: "0",
                });
                setInvoiceRows([{ ...emptyRow }]);
                setFieldErrors({});
                setFormError("");
                setHasUserInteracted(false);
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

            // Clear error after 10 seconds
            setTimeout(() => {
                setSubmitMessage({
                    text: "",
                    isError: false,
                });
            }, 10000);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle add product success
    const handleAddProductSuccess = (id) => {
        // Fetch the full product details from the backend using the ID
        axios
            .get(`${process.env.REACT_APP_BACKEND}products/full/${id}`)
            .then((response) => {
                const newProduct = response.data;

                // Add or replace the product in the products list
                setProducts((prevProducts) => {
                    const exists = prevProducts.some((p) => p._id === id);
                    if (exists) {
                        return prevProducts.map((p) =>
                            p._id === id ? newProduct : p
                        );
                    }
                    return [...prevProducts, newProduct];
                });

                // Close the modal
                setShowAddProductModal(false);
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

    // Handle add supplier success
    const handleAddSupplierSuccess = () => {
        // Fetch the updated suppliers list
        axios
            .get(`${process.env.REACT_APP_BACKEND}suppliers`)
            .then((response) => {
                setSuppliers(response.data);
                setShowAddSupplierModal(false);

                // Optionally, select the new supplier (the last one in the list)
                if (response.data.length > 0) {
                    const newSupplier = response.data[response.data.length - 1];
                    handleInvoiceChange("supplier", newSupplier._id);
                }
            })
            .catch((error) => {
                console.error("Error fetching suppliers:", error);
                setSubmitMessage({
                    text: `❌ حدث خطأ في جلب بيانات الموردين: ${error.message}`,
                    isError: true,
                });
            });
    };

    // Initialize form for edit mode
    useEffect(() => {
        if (props.mode === "edit" && props.invoice) {
            setHasUserInteracted(true); // Enable validation for edit mode
        }
    }, [props.mode, props.invoice]);

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
                <div
                    className="d-flex justify-content-end mb-3"
                    style={{ gap: "10px" }}
                >
                    <Button
                        content="إضافة منتج جديد"
                        onClick={() => setShowAddProductModal(true)}
                        type="primary"
                    />
                    <Button
                        content="إضافة مورد جديد"
                        onClick={() => setShowAddSupplierModal(true)}
                        type="primary"
                    />
                </div>
            )}

            <DateTimeInput
                label="التاريخ"
                id="invoice-date"
                value={invoice.date}
                onchange={(value) => {
                    if (!hasUserInteracted) setHasUserInteracted(true);
                    handleInvoiceChange("date", value);
                }}
                includeTime={false}
                error={fieldErrors.date || ""}
            />

            <Select
                title="المورد"
                value={invoice.supplier || ""}
                options={[
                    ...suppliers.map((s) => ({
                        value: s._id,
                        label: s.name,
                    })),
                ]}
                onchange={(val) => {
                    if (!hasUserInteracted) setHasUserInteracted(true);
                    handleInvoiceChange("supplier", val);
                }}
                disabled={getDisabledState()}
                error={fieldErrors.supplier || ""}
            />

            <InputTable error={fieldErrors.rows || ""}>
                <thead>
                    <tr>
                        <th
                            className={classes.head}
                            scope="col"
                            style={{ width: "50px" }}
                        >
                            #
                        </th>
                        <th className={classes.head} scope="col">
                            الباركود
                        </th>
                        <th className={classes.head} scope="col">
                            المنتج
                        </th>
                        <th className={classes.head} scope="col">
                            العبوة
                        </th>
                        <th
                            className={classes.head}
                            scope="col"
                            style={{ width: "95px" }}
                        >
                            الكمية
                        </th>
                        <th
                            className={classes.head}
                            scope="col"
                            style={{ width: "105px" }}
                        >
                            سعر الشراء
                        </th>
                        <th
                            className={classes.head}
                            scope="col"
                            style={{ width: "105px" }}
                        >
                            سعر البيع للصيدلية
                        </th>
                        <th
                            className={classes.head}
                            scope="col"
                            style={{ width: "105px" }}
                        >
                            سعر البيع للزبون
                        </th>
                        <th
                            className={classes.head}
                            scope="col"
                            style={{ width: "105px" }}
                        >
                            السعر الاسترشادى
                        </th>
                        <th className={classes.head} scope="col">
                            تاريخ انتهاء الصلاحية
                        </th>
                        {isViewMode && (
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "100px" }}
                            >
                                الباقى
                            </th>
                        )}
                        {!isViewMode && (
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "50px" }}
                            ></th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {invoiceRows.map((row, i) => {
                        return (
                            <InvoiceRow
                                key={`row-${i}-${row.product || "empty"}-${
                                    row.volume || "empty"
                                }`}
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
                                disabled={getDisabledState()}
                                viewMode={isViewMode}
                                priceSuggestions={priceSuggestions[i] || null}
                                totalRows={invoiceRows.length}
                                onBarcodeChange={handleBarcodeChange}
                            />
                        );
                    })}

                    {/* Total row */}
                    <tr>
                        <td colSpan="5" className={classes.item}>
                            <strong>إجمالي الفاتورة:</strong>
                        </td>
                        <td
                            colSpan={isViewMode ? "6" : "6"}
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
            </InputTable>

            <div className="mb-3">
                <label
                    htmlFor="purchase-notes"
                    style={{ display: "block", textAlign: "right" }}
                >
                    ملاحظات
                </label>
                <textarea
                    id="purchase-notes"
                    className="form-control"
                    rows={2}
                    value={invoice.notes || ""}
                    onChange={(e) =>
                        handleInvoiceChange("notes", e.target.value)
                    }
                    disabled={isViewMode}
                />
            </div>

            {/* Show appropriate buttons based on mode */}
            {isViewMode ? (
                <Button
                    content="العودة"
                    onClick={props.onBack || (() => window.history.back())}
                    type="secondary"
                />
            ) : (
                <div style={{ display: "flex", gap: "10px" }}>
                    <Button
                        content={
                            props.mode === "edit"
                                ? "تحديث الفاتورة"
                                : "حفظ الفاتورة"
                        }
                        onClick={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                    />
                    {props.mode !== "edit" && (
                        <>
                            <Button
                                content="تعليق الفاتورة"
                                onClick={handleSuspendInvoice}
                                type="secondary"
                                disabled={isSubmitting}
                            />
                            <Button
                                content="إعادة تعيين"
                                onClick={handleReset}
                                type="secondary"
                                disabled={isSubmitting}
                            />
                        </>
                    )}
                    {props.mode === "edit" && (
                        <Button
                            content="العودة"
                            onClick={
                                props.onBack || (() => window.history.back())
                            }
                            type="secondary"
                        />
                    )}
                </div>
            )}

            {/* Form-level error below submit button */}
            {formError && !isViewMode && (
                <div
                    style={{
                        color: "var(--accent-red)",
                        marginTop: "10px",
                        fontSize: "14px",
                        textAlign: "right",
                    }}
                >
                    ⚠️ {formError}
                </div>
            )}

            {/* Submit success/error message */}
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

            {/* Modal for adding new supplier */}
            {showAddSupplierModal && (
                <Modal onClose={() => setShowAddSupplierModal(false)}>
                    <SupplierForm
                        isEditing={false}
                        onSubmit={handleAddSupplierSuccess}
                        onCancel={() => setShowAddSupplierModal(false)}
                    />
                </Modal>
            )}
        </div>
    );
}
