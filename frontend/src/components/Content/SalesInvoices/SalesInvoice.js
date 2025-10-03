import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Button from "../../Basic/Button";
import TextInput from "../../Basic/TextInput";
import DateTimeInput from "../../Basic/DateTimeInput";
import Select from "../../Basic/Select";
import InputTable from "../../Basic/InputTable";
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
    const [formError, setFormError] = useState(""); // Form-level error below submit button
    const [fieldErrors, setFieldErrors] = useState({}); // Individual field errors
    const [hasUserInteracted, setHasUserInteracted] = useState(false); // Track if user has started interacting
    const [finalTotal, setFinalTotal] = useState(0);
    const [baseCost, setBaseCost] = useState(0);
    const [profit, setProfit] = useState(0);

    // Add this state to track when we're updating fields to prevent infinite loops
    const [isUpdatingFields, setIsUpdatingFields] = useState(false);

    // Add a state to track barcode validation requests
    const [barcodeValidationCache, setBarcodeValidationCache] = useState({});

    // Add state to track field update sources to prevent loops
    const [fieldUpdateSource, setFieldUpdateSource] = useState({});

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

            // Add barcode validation - only if barcode is provided and product/volume are selected
            if (row.barcode && row.product && row.volume) {
                // Check if we have a cached validation result for this combination
                const cacheKey = `${row.product}-${row.volume}-${row.barcode}`;
                const cachedResult = barcodeValidationCache[cacheKey];

                if (cachedResult === false) {
                    // We've already validated this combination and it's invalid
                    errors.barcode = `الباركود ${row.barcode} غير صحيح لهذا المنتج والعبوة`;
                } else if (cachedResult === true) {
                    // We've already validated this combination and it's valid
                    // No error needed
                } else if (!isUpdatingFields) {
                    // If we're not updating fields and don't have a cached result,
                    // we'll need to verify with the backend
                    // For now, we'll just skip validation
                }
            }

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
        [products, isUpdatingFields, barcodeValidationCache]
    );

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
        setRowErrors, // Add this to destructure setRowErrors from the hook
    } = useInvoiceRows(emptyRow, validateRow, [products, invoice.type]);

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
        }

        if (!invoice.customer) {
            newFieldErrors.customer = "العميل مطلوب";
            hasErrors = true;
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
            const rowErrors = validateRow(row, index, invoiceRows);
            Object.keys(rowErrors).forEach((field) => {
                newFieldErrors[`row_${index}_${field}`] = rowErrors[field];
                hasErrors = true;
            });
        });

        setFieldErrors(newFieldErrors);
        setFormError(hasErrors ? "يرجى إصلاح الأخطاء أعلاه" : "");
        return !hasErrors;
    }, [invoice, invoiceRows, hasUserInteracted, props.mode, validateRow]);

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

            // Trigger validation after loading data
            setTimeout(() => {
                validateRows();
            }, 100);
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

    // Initialize form for edit mode
    useEffect(() => {
        if (props.mode === "edit" && props.invoice) {
            setHasUserInteracted(true); // Enable validation for edit mode
        }
    }, [props.mode, props.invoice]);

    // Handle invoice field changes
    const handleInvoiceChange = (field, value) => {
        if (field === "customer" && value) {
            // If a customer is selected, set the type based on the customer's type
            const selectedCustomer = customers.find((c) => c._id === value);
            if (selectedCustomer) {
                setInvoice((prev) => ({
                    ...prev,
                    [field]: value,
                    type: selectedCustomer.type, // Set type based on customer type
                }));
                return;
            }
        } else if (field === "type" && invoice.customer) {
            // If type is changed manually and a customer is selected,
            // clear the customer selection
            setInvoice((prev) => ({
                ...prev,
                [field]: value,
                customer: "", // Clear customer when type changes
            }));
            return;
        }

        // For other fields or when customer is cleared
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
                setFormError("⚠️ يجب إدخال النوع والتاريخ");
                return;
            }

            // Validate offer is a non-negative number
            if (isNaN(Number(invoice.offer)) || Number(invoice.offer) < 0) {
                setFormError("⚠️ يجب أن يكون الخصم رقمًا غير سالب");
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

                // Clear success message after 5 seconds
                setTimeout(() => {
                    setSubmitMessage({
                        text: "",
                        isError: false,
                    });
                }, 5000);

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
            setFormError("⚠️ يجب إدخال النوع وتاريخ وصف واحد صحيح على الأقل");
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

            // Clear success message after 5 seconds
            setTimeout(() => {
                setSubmitMessage({
                    text: "",
                    isError: false,
                });
            }, 5000);

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
                setFieldErrors({});
                setFormError("");
                setHasUserInteracted(false);
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

    // Function to lookup product and volume from barcode
    const lookupProductFromBarcode = useCallback(
        async (index, barcode) => {
            if (!barcode || barcode.trim() === "") return;
            if (isUpdatingFields) return; // Prevent loops

            setIsUpdatingFields(true);
            setFieldUpdateSource((prev) => ({
                ...prev,
                [`${index}-barcode`]: "barcode",
            }));

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
                    // Update the row with found product and volume
                    const newRows = [...invoiceRows];
                    newRows[index].product = response.data.product;
                    newRows[index].volume = response.data.volume;
                    setInvoiceRows(newRows);

                    // Clear product and volume errors
                    const newErrors = [...rowErrors];
                    if (newErrors[index]) {
                        delete newErrors[index].product;
                        delete newErrors[index].volume;
                        delete newErrors[index].barcode;
                        setRowErrors(newErrors);
                    }

                    // Also update the barcode validation cache
                    setBarcodeValidationCache((prev) => ({
                        ...prev,
                        [`${response.data.product}-${response.data.volume}-${barcode}`]: true,
                    }));
                } else {
                    // Barcode not found - set error
                    const newErrors = [...rowErrors];
                    if (!newErrors[index]) newErrors[index] = {};
                    newErrors[
                        index
                    ].barcode = `الباركود ${barcode} غير موجود في النظام`;
                    setRowErrors(newErrors);
                }
            } catch (error) {
                console.error("Error looking up barcode:", error);
                // Set barcode error
                const newErrors = [...rowErrors];
                if (!newErrors[index]) newErrors[index] = {};
                newErrors[
                    index
                ].barcode = `خطأ في البحث عن الباركود ${barcode}`;
                setRowErrors(newErrors);
            } finally {
                setIsUpdatingFields(false);
                setTimeout(() => {
                    setFieldUpdateSource((prev) => {
                        const newSource = { ...prev };
                        delete newSource[`${index}-barcode`];
                        return newSource;
                    });
                }, 100);
            }
        },
        [invoiceRows, isUpdatingFields, rowErrors, setRowErrors]
    );

    // Add a function to validate barcode with the backend
    const validateBarcode = useCallback(
        async (index, row) => {
            if (!row.barcode || !row.product || !row.volume) return;

            const cacheKey = `${row.product}-${row.volume}-${row.barcode}`;

            // Skip if we already have a cached result
            if (barcodeValidationCache[cacheKey] !== undefined) {
                // If we have a cached result and it's false, set the error
                if (barcodeValidationCache[cacheKey] === false) {
                    const newErrors = [...rowErrors];
                    if (!newErrors[index]) newErrors[index] = {};

                    // Get the correct barcode from cache if available
                    const correctBarcode =
                        barcodeValidationCache[
                            `${row.product}-${row.volume}-correct`
                        ];
                    if (correctBarcode) {
                        newErrors[
                            index
                        ].barcode = `الباركود الصحيح لهذا المنتج والعبوة هو ${correctBarcode}`;
                    } else {
                        newErrors[
                            index
                        ].barcode = `الباركود ${row.barcode} غير صحيح لهذا المنتج والعبوة`;
                    }

                    setRowErrors(newErrors);
                }
                return;
            }

            setIsUpdatingFields(true);

            try {
                // Get the correct barcode for this product/volume
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND}has-volumes/product-volume-barcode/${row.product}/${row.volume}`
                );

                if (response.data && response.data.barcode) {
                    // Store the correct barcode in cache
                    setBarcodeValidationCache((prev) => ({
                        ...prev,
                        [`${row.product}-${row.volume}-correct`]:
                            response.data.barcode,
                    }));

                    // Check if the barcode matches
                    const isValid = response.data.barcode === row.barcode;

                    // Update the cache
                    setBarcodeValidationCache((prev) => ({
                        ...prev,
                        [cacheKey]: isValid,
                    }));

                    // If invalid, update the row errors
                    if (!isValid) {
                        const newErrors = [...rowErrors];
                        if (!newErrors[index]) newErrors[index] = {};
                        newErrors[
                            index
                        ].barcode = `الباركود الصحيح لهذا المنتج والعبوة هو ${response.data.barcode}`;
                        setRowErrors(newErrors);
                    } else {
                        // Clear any barcode errors
                        const newErrors = [...rowErrors];
                        if (newErrors[index] && newErrors[index].barcode) {
                            delete newErrors[index].barcode;
                            setRowErrors(newErrors);
                        }
                    }
                }
            } catch (error) {
                console.error("Error validating barcode:", error);
            } finally {
                setIsUpdatingFields(false);
            }
        },
        [barcodeValidationCache, rowErrors, setRowErrors]
    );

    // Function to lookup barcode from product and volume
    const lookupBarcodeFromProductVolume = useCallback(
        async (index, productId, volumeId) => {
            if (!productId || !volumeId || isUpdatingFields) return;
            if (fieldUpdateSource[`${index}-barcode`]) return; // Prevent loops

            setIsUpdatingFields(true);

            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND}has-volumes/product/${productId}/volume/${volumeId}/barcode`
                );

                if (response.data && response.data.barcode) {
                    // Update the barcode field
                    const newRows = [...invoiceRows];
                    newRows[index].barcode = response.data.barcode;
                    setInvoiceRows(newRows);

                    // Clear any barcode errors
                    const newErrors = [...rowErrors];
                    if (newErrors[index] && newErrors[index].barcode) {
                        delete newErrors[index].barcode;
                        setRowErrors(newErrors);
                    }

                    // Update the cache
                    setBarcodeValidationCache((prev) => ({
                        ...prev,
                        [`${productId}-${volumeId}-${response.data.barcode}`]: true,
                    }));
                } else {
                    // No barcode found - set validation error
                    const newErrors = [...rowErrors];
                    if (!newErrors[index]) newErrors[index] = {};
                    newErrors[index].barcode =
                        "لا يوجد باركود لهذا المنتج والعبوة";
                    setRowErrors(newErrors);

                    // Clear the barcode field
                    const newRows = [...invoiceRows];
                    newRows[index].barcode = "";
                    setInvoiceRows(newRows);
                }
            } catch (error) {
                console.error("Error fetching barcode:", error);
                // Set error but don't clear barcode in case it was manually entered
                const newErrors = [...rowErrors];
                if (!newErrors[index]) newErrors[index] = {};
                newErrors[index].barcode = "خطأ في جلب باركود المنتج";
                setRowErrors(newErrors);
            } finally {
                setIsUpdatingFields(false);
            }
        },
        [
            invoiceRows,
            isUpdatingFields,
            rowErrors,
            setRowErrors,
            fieldUpdateSource,
        ]
    );

    // Improved handleProductOrVolumeChange function with correct API endpoint
    const handleProductOrVolumeChange = useCallback(
        async (index, field, value) => {
            if (isUpdatingFields) return; // Prevent infinite loops
            if (fieldUpdateSource[`${index}-barcode`]) return; // Prevent loops from barcode updates

            // Update the field first
            originalHandleRowChange(index, field, value);

            // Get the updated row data
            const updatedRow = { ...invoiceRows[index], [field]: value };

            // If both product and volume are selected, lookup the barcode
            if (updatedRow.product && updatedRow.volume) {
                await lookupBarcodeFromProductVolume(
                    index,
                    updatedRow.product,
                    updatedRow.volume
                );
            }
        },
        [
            invoiceRows,
            originalHandleRowChange,
            lookupBarcodeFromProductVolume,
            isUpdatingFields,
            fieldUpdateSource,
        ]
    );

    // Improved handleBarcodeChange function to clear product/volume for invalid barcodes
    const handleBarcodeChange = useCallback(
        async (index, barcode) => {
            if (!barcode || barcode.trim() === "") return; // Skip empty barcodes
            if (isUpdatingFields) return; // Prevent loops

            await lookupProductFromBarcode(index, barcode);
        },
        [lookupProductFromBarcode, isUpdatingFields]
    );

    // Improved validateManualBarcode function to ensure errors persist
    const validateManualBarcode = useCallback(
        async (index, barcode) => {
            if (!barcode) return;

            const row = invoiceRows[index];
            if (!row.product || !row.volume) return;

            // Don't validate if we're already updating fields
            if (isUpdatingFields) return;

            try {
                // Get the correct barcode for this product/volume
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND}has-volumes/product/${row.product}/volume/${row.volume}/barcode`
                );

                if (response.data && response.data.barcode) {
                    // Check if the barcode matches
                    const isValid = response.data.barcode === barcode;

                    // Update errors if needed
                    const newErrors = [...rowErrors];
                    if (!newErrors[index]) newErrors[index] = {};

                    if (!isValid) {
                        // For invalid barcodes, clear product and volume
                        const updatedRows = [...invoiceRows];
                        updatedRows[index].product = "";
                        updatedRows[index].volume = "";
                        // Keep the barcode for error display
                        updatedRows[index].barcode = barcode;
                        setInvoiceRows(updatedRows);

                        // Set the error message
                        newErrors[
                            index
                        ].barcode = `الباركود ${barcode} غير صحيح`;
                        setRowErrors(newErrors);
                    } else {
                        // For valid barcodes, clear any errors
                        delete newErrors[index].barcode;
                        setRowErrors(newErrors);
                    }
                }
            } catch (error) {
                console.error("Error validating barcode:", error);
            }
        },
        [invoiceRows, rowErrors, setRowErrors, isUpdatingFields, setInvoiceRows]
    );

    // Determine if we're in view mode
    const isViewMode = props.mode === "view";

    // Use this function to disable inputs in view mode
    const getDisabledState = () => {
        return isViewMode;
    };

    // Rename the function to avoid confusion with the original handleRowChange
    const handleBarcodeFieldChange = useCallback(
        async (index, field, value) => {
            // First update the field normally
            originalHandleRowChange(index, field, value);

            // If the barcode field changed and we have product and volume selected,
            // validate the barcode
            if (field === "barcode" && value) {
                const row = { ...invoiceRows[index], [field]: value };
                if (row.product && row.volume) {
                    // Validate the barcode against the backend
                    await validateBarcode(index, row);
                }
            }
        },
        [invoiceRows, originalHandleRowChange, validateBarcode]
    );

    return (
        <div className={classes.container}>
            <h2 className={classes.formTitle}>
                {props.mode === "edit"
                    ? "تعديل بيانات فاتورة مبيعات"
                    : props.mode === "view"
                    ? "عرض فاتورة مبيعات"
                    : "إضافة فاتورة مبيعات"}
            </h2>
            <DateTimeInput
                label="التاريخ والوقت"
                id="invoice-date"
                value={invoice.date}
                onchange={(value) => {
                    if (!hasUserInteracted) setHasUserInteracted(true);
                    handleInvoiceChange("date", value);
                }}
                includeTime={true}
                disabled={getDisabledState()}
                width="300px"
                error={fieldErrors.date || ""}
            />

            <Select
                label="العميل"
                value={invoice.customer}
                options={[
                    ...customers.map((c) => ({
                        value: c._id,
                        label: c.name,
                    })),
                ]}
                onchange={(val) => {
                    if (!hasUserInteracted) setHasUserInteracted(true);
                    handleInvoiceChange("customer", val);
                }}
                disabled={getDisabledState()}
                error={fieldErrors.customer || ""}
            />

            <Select
                label="نوع العميل"
                value={invoice.type}
                options={[
                    { value: "walkin", label: "زبون" },
                    { value: "pharmacy", label: "صيدلية" },
                ]}
                onchange={(val) => {
                    if (!hasUserInteracted) setHasUserInteracted(true);
                    handleInvoiceChange("type", val);
                }}
                disabled={getDisabledState()}
                error={fieldErrors.type || ""}
            />

            {/* Only show the items table in add mode or view mode */}
            {props.mode !== "edit" && (
                <>
                    <InputTable error={fieldErrors.rows || ""}>
                        <thead>
                            <tr>
                                <th style={{ width: "50px" }}>#</th>
                                <th>الباركود</th>
                                <th>المنتج</th>
                                <th>الكمية</th>
                                <th>العبوة</th>
                                <th>السعر</th>
                                <th>الإجمالي</th>
                                {!isViewMode && (
                                    <th style={{ width: "100px" }}></th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {invoiceRows.map((row, i) => {
                                return (
                                    <SalesInvoiceRow
                                        key={i}
                                        row={row}
                                        index={i}
                                        onChange={(index, field, value) => {
                                            if (
                                                field === "product" ||
                                                field === "volume"
                                            ) {
                                                handleProductOrVolumeChange(
                                                    index,
                                                    field,
                                                    value
                                                );
                                            } else if (field === "barcode") {
                                                // First update the field normally
                                                originalHandleRowChange(
                                                    index,
                                                    field,
                                                    value
                                                );

                                                // Then validate the barcode if it's not empty
                                                if (
                                                    value &&
                                                    value.trim() !== ""
                                                ) {
                                                    // Use setTimeout to ensure the validation happens after the state update
                                                    setTimeout(() => {
                                                        validateManualBarcode(
                                                            index,
                                                            value
                                                        );
                                                    }, 10);
                                                }
                                            } else {
                                                originalHandleRowChange(
                                                    index,
                                                    field,
                                                    value
                                                );
                                            }
                                        }}
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

                            {/* Total row */}
                            <tr className={classes.totalRow}>
                                <td colSpan="4" className={classes.totalLabel}>
                                    <strong>إجمالي الفاتورة:</strong>
                                </td>
                                <td
                                    colSpan={isViewMode ? "3" : "4"}
                                    className={classes.totalValue}
                                >
                                    <strong>{finalTotal.toFixed(2)} ج.م</strong>
                                </td>
                            </tr>
                        </tbody>
                    </InputTable>
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

                        {/* Profit display for edit mode */}
                        {props.mode === "edit" && (
                            <div className="row mt-3">
                                <div className="col-md-12">
                                    <div className="alert alert-light border">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <p className="mb-1">
                                                    <strong>
                                                        تكلفة الشراء:
                                                    </strong>{" "}
                                                    {props.invoice?.total_purchase_cost?.toFixed(
                                                        2
                                                    ) || 0}{" "}
                                                    ج.م
                                                </p>
                                            </div>
                                            <div className="col-md-6">
                                                <p className="mb-1">
                                                    <strong>
                                                        الربح/الخسارة:
                                                    </strong>{" "}
                                                    <span
                                                        style={{
                                                            color:
                                                                profit >= 0
                                                                    ? "var(--success-color)"
                                                                    : "var(--accent-red)",
                                                            fontWeight: "bold",
                                                        }}
                                                    >
                                                        {profit.toFixed(2)} ج.م
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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
        </div>
    );
}
