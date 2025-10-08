import { useState, useCallback, useEffect, Fragment } from "react";
import axios from "axios";
import Select from "../../Basic/Select";
import TextInput from "../../Basic/TextInput";
import classes from "./ProductForm.module.css";
import { FaPlus, FaMinus } from "react-icons/fa6";
import Button from "../../Basic/Button";
import FormMessage from "../../Basic/FormMessage";
import InputTable from "../../Basic/InputTable";

export default function ProductForm({
    mode = "add",
    product: initialProductData,
    onSuccess,
    inModal,
}) {
    const [product, setProduct] = useState({
        name: "",
        "min-stock": "",
        conversions: [{ from: "", to: "", value: 1, barcode: "" }],
        values: [],
    });

    const [volumes, setVolumes] = useState([]);
    const [isSubmittable, setIsSubmittable] = useState(false);
    const [formError, setFormError] = useState(""); // Form-level error below submit button
    const [submitMessage, setSubmitMessage] = useState({
        text: "",
        isError: false,
    });
    const [fieldErrors, setFieldErrors] = useState({}); // Individual field errors
    const [hasUserInteracted, setHasUserInteracted] = useState(false); // Track if user has started interacting
    const [canModifyConversions, setCanModifyConversions] = useState(true); // Track if conversions can be modified
    const [canModifyBarcode, setCanModifyBarcode] = useState(true); // Track if barcode can be modified

    // Check if product conversions can be modified
    const checkProductModifiability = useCallback(
        async (productId) => {
            if (mode !== "edit" || !productId) {
                setCanModifyConversions(true);
                setCanModifyBarcode(true);
                return;
            }

            try {
                const response = await axios.get(
                    `${process.env.REACT_APP_BACKEND}products/${productId}/check-conversions-modifiable`
                );
                setCanModifyConversions(response.data.canModifyConversions);
                setCanModifyBarcode(response.data.canModifyBarcode);
            } catch (err) {
                console.error("Error checking product modifiability:", err);
                // Default to allowing modifications if check fails
                setCanModifyConversions(true);
                setCanModifyBarcode(true);
            }
        },
        [mode]
    );

    const validateForSubmit = useCallback(
        (conversions) => {
            // Only validate if user has interacted or we're in edit mode
            if (!hasUserInteracted && mode !== "edit") {
                setIsSubmittable(false);
                setFormError("");
                setFieldErrors({});
                return;
            }

            const newFieldErrors = {};
            let hasErrors = false;

            // Validate product name
            if (!product.name.trim()) {
                newFieldErrors.name = "اسم المنتج مطلوب";
                hasErrors = true;
            }

            // Validate min-stock field
            const minStockValue = Number(product["min-stock"]);
            if (
                product["min-stock"] !== "" &&
                product["min-stock"] !== null &&
                product["min-stock"] !== undefined
            ) {
                if (isNaN(minStockValue) || minStockValue < 0) {
                    newFieldErrors["min-stock"] =
                        "الحد الأدنى للمخزون يجب أن يكون صفر أو رقم موجب";
                    hasErrors = true;
                }
            }

            // Validate conversions
            conversions.forEach(({ from, to, value }, index) => {
                const isLast = index === conversions.length - 1;
                const isFirst = index === 0;

                if (isFirst && !from) {
                    newFieldErrors[`conversion_${index}_from`] =
                        "الوحدة الأساسية مطلوبة";
                    hasErrors = true;
                }

                if (!isFirst && !isLast) {
                    if (!from) {
                        newFieldErrors[`conversion_${index}_from`] =
                            "الوحدة مطلوبة";
                        hasErrors = true;
                    }
                    if (!to) {
                        newFieldErrors[`conversion_${index}_to`] =
                            "الوحدة الهدف مطلوبة";
                        hasErrors = true;
                    }
                    if (!value || value <= 0) {
                        newFieldErrors[`conversion_${index}_value`] =
                            "القيمة يجب أن تكون أكبر من صفر (لا يمكن أن تكون صفر)";
                        hasErrors = true;
                    }
                }
            });

            // Check graph connectivity
            try {
                const graph = {};
                const involvedIds = new Set();

                conversions.forEach(({ from, to, value }) => {
                    if (from && to && value && value > 0) {
                        if (!graph[from]) graph[from] = [];
                        if (!graph[to]) graph[to] = [];

                        graph[from].push({ node: to, weight: value });
                        graph[to].push({ node: from, weight: 1 / value });

                        involvedIds.add(from);
                        involvedIds.add(to);
                    }
                });

                const baseId = conversions[0]?.from;
                if (baseId && involvedIds.size > 0) {
                    const visitedCheck = {};
                    const stack = [baseId];
                    while (stack.length) {
                        const node = stack.pop();
                        if (visitedCheck[node]) continue;
                        visitedCheck[node] = true;
                        for (const edge of graph[node] || []) {
                            stack.push(edge.node);
                        }
                    }

                    for (const id of involvedIds) {
                        if (!visitedCheck[id]) {
                            newFieldErrors.conversions =
                                "سلسلة التحويل غير مكتملة أو غير متصلة";
                            hasErrors = true;
                            break;
                        }
                    }
                }
            } catch (err) {
                newFieldErrors.conversions = "خطأ في التحقق من صحة التحويلات";
                hasErrors = true;
            }

            setFieldErrors(newFieldErrors);
            setIsSubmittable(!hasErrors);
            setFormError(hasErrors ? "يرجى إصلاح الأخطاء أعلاه" : "");
        },
        [product.name, product["min-stock"], hasUserInteracted, mode]
    );

    const updateValues = useCallback(
        (conversions) => {
            try {
                const graph = {};
                const involvedIds = new Set();

                conversions.forEach(({ from, to, value }) => {
                    if (from && to && value && value > 0) {
                        if (!graph[from]) graph[from] = [];
                        if (!graph[to]) graph[to] = [];

                        graph[from].push({ node: to, weight: value });
                        graph[to].push({ node: from, weight: 1 / value });

                        involvedIds.add(from);
                        involvedIds.add(to);
                    }
                });

                const baseId = conversions[0]?.from;
                const baseVolume = volumes.find((v) => v._id === baseId);
                if (!baseId || !baseVolume) {
                    throw new Error("الوحدة الأساسية غير صالحة أو غير موجودة.");
                }

                const visited = {};
                const values = [];
                const queue = [{ id: baseId, value: 1 }];
                visited[baseId] = 1;

                while (queue.length > 0) {
                    const { id, value } = queue.shift();
                    const volume = volumes.find((v) => v._id === id);
                    if (volume)
                        values.push({
                            id: volume._id,
                            name: volume.name,
                            val: value,
                        });

                    for (const edge of graph[id] || []) {
                        if (!(edge.node in visited)) {
                            const newValue = value / edge.weight;
                            visited[edge.node] = newValue;
                            queue.push({ id: edge.node, value: newValue });
                        }
                    }
                }

                values.sort((a, b) => a.val - b.val);
                setProduct((prev) => ({ ...prev, values }));
            } catch (err) {
                setProduct((prev) => ({
                    ...prev,
                    values: [],
                }));
            }
        },
        [volumes]
    );

    const handleConversionChange = (index, field, value) => {
        // Mark that user has started interacting
        if (!hasUserInteracted) {
            setHasUserInteracted(true);
        }

        // Prevent changes to non-barcode fields if product has been used
        if (field !== "barcode" && !canModifyConversions) {
            setSubmitMessage({
                text: "لا يمكن تعديل تحويلات المنتج (من، إلى، القيمة) - تم استخدامه في فواتير المشتريات. يمكن تعديل الباركود فقط.",
                isError: true,
            });
            return;
        }

        const updated = [...product.conversions];
        const newFieldErrors = { ...fieldErrors };

        if (field !== "barcode") {
            if (
                (field === "from" && updated[index].to === value) ||
                (field === "to" && updated[index].from === value)
            ) {
                newFieldErrors[`conversion_${index}_${field}`] =
                    "لا يمكن اختيار نفس الحجم في الخانتين";
                setFieldErrors(newFieldErrors);
                return;
            }

            if (field === "from") {
                const isDuplicate = updated.some(
                    (c, i) => i !== index && c.from === value
                );
                if (isDuplicate) {
                    newFieldErrors[`conversion_${index}_from`] =
                        "تم اختيار هذا الحجم بالفعل كحجم أساسى في صف آخر";
                    setFieldErrors(newFieldErrors);
                    return;
                }
            }
        }

        // Clear field-specific errors when user makes changes
        delete newFieldErrors[`conversion_${index}_${field}`];
        delete newFieldErrors.conversions;

        updated[index][field] = value;
        setProduct((prev) => ({
            ...prev,
            conversions: updated,
        }));
        setFieldErrors(newFieldErrors);

        if (field !== "barcode") updateValues(updated);
    };

    const handleAddRow = () => {
        // Prevent adding rows if conversions can't be modified
        if (!canModifyConversions) {
            setSubmitMessage({
                text: "لا يمكن إضافة تحويلات جديدة - تم استخدام المنتج في فواتير المشتريات. يمكن تعديل الباركود فقط.",
                isError: true,
            });
            return;
        }

        // Mark that user has started interacting
        if (!hasUserInteracted) {
            setHasUserInteracted(true);
        }

        const last = product.conversions.at(-1);
        const isFirst = product.conversions.length === 1;

        if (isFirst && !last?.from) {
            setFieldErrors({
                conversions: "يجب اختيار الحجم الأساسى أولاً قبل إضافة صف جديد",
            });
            return;
        }

        if (
            !isFirst &&
            (!last?.from || !last?.to || !last?.value || last.value <= 0)
        ) {
            setFieldErrors({
                conversions: "يرجى إكمال الصف الأخير قبل إضافة صف جديد",
            });
            return;
        }

        setProduct((prev) => ({
            ...prev,
            conversions: [
                ...prev.conversions,
                { from: "", to: "", value: "", barcode: "" },
            ],
        }));
        setFieldErrors({});
    };

    const removeRow = (index) => {
        // Prevent removing rows if conversions can't be modified
        if (!canModifyConversions) {
            setSubmitMessage({
                text: "لا يمكن حذف التحويلات - تم استخدام المنتج في فواتير المشتريات. يمكن تعديل الباركود فقط.",
                isError: true,
            });
            return;
        }

        if (product.conversions.length === 1) {
            setProduct((prev) => ({
                ...prev,
                error: "لا يمكن حذف الصف الوحيد المتاح",
            }));
            return;
        }

        const updated = [...product.conversions];
        updated.splice(index, 1);

        setProduct((prev) => ({
            ...prev,
            conversions: updated,
            error: "",
        }));

        updateValues(updated);
    };
    const handleChange = (field, value) => {
        // Mark that user has started interacting
        if (!hasUserInteracted) {
            setHasUserInteracted(true);
        }

        setProduct((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear field-specific error when user types
        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };
    useEffect(() => {
        axios
            .get(process.env.REACT_APP_BACKEND + "volumes")
            .then((res) => setVolumes(res.data))
            .catch((err) => console.error("Failed to fetch volumes:", err));
    }, []);

    useEffect(() => {
        validateForSubmit(product.conversions);
    }, [
        product.conversions,
        product.name,
        product["min-stock"],
        validateForSubmit,
    ]);
    useEffect(() => {
        if (mode === "edit" && initialProductData) {
            setProduct({
                name: initialProductData.name || "",
                "min-stock": initialProductData["min-stock"] || "",
                conversions: initialProductData.conversions || [
                    { from: "", to: "", value: 1, barcode: "" },
                ],
            });
            setFieldErrors({});
            setFormError("");
            setHasUserInteracted(true); // Enable validation for edit mode

            // Check if conversions can be modified
            checkProductModifiability(initialProductData._id);
        }
    }, [mode, initialProductData, checkProductModifiability]);
    // 2. Separate effect: call updateValues when both conversions and volumes are ready
    useEffect(() => {
        if (product.conversions?.length > 0 && volumes.length > 0) {
            updateValues(product.conversions);
        }
    }, [product.conversions, volumes, updateValues]);

    return (
        <div className={classes.add}>
            <TextInput
                type="text"
                placeholder="اسم المنتج"
                label="اسم المنتج"
                id="product-name"
                value={product.name}
                onchange={(e) => {
                    // Mark that user has started interacting
                    if (!hasUserInteracted) {
                        setHasUserInteracted(true);
                    }

                    setProduct({ ...product, name: e });
                    // Clear name error when user types
                    if (fieldErrors.name) {
                        setFieldErrors((prev) => ({ ...prev, name: "" }));
                    }
                }}
                width={inModal ? "80%" : "50%"}
                error={fieldErrors.name || ""}
            />

            <InputTable error={fieldErrors.conversions || ""}>
                <thead>
                    <tr>
                        <th>الوحدة بتاعتنا</th>
                        <th>كام</th>
                        <th>من ايه؟</th>
                        <th>الباركود</th>
                        <th style={{ width: "100px" }}></th>
                    </tr>
                </thead>
                <tbody>
                    {product.conversions.map((row, index) => (
                        <tr
                            key={index}
                            className={
                                index % 2 === 0
                                    ? classes.evenRow
                                    : classes.oddRow
                            }
                        >
                            <td>
                                <Select
                                    title="الوحدة"
                                    value={row.from}
                                    onchange={(val) =>
                                        handleConversionChange(
                                            index,
                                            "from",
                                            val
                                        )
                                    }
                                    options={volumes.map((v) => ({
                                        value: v._id,
                                        label: v.name,
                                    }))}
                                    disabled={!canModifyConversions}
                                    error={
                                        fieldErrors[
                                            `conversion_${index}_from`
                                        ] || ""
                                    }
                                />
                            </td>
                            <td>
                                <TextInput
                                    type="number"
                                    placeholder="كام"
                                    label="كام"
                                    id={`value-${index}`}
                                    value={row.value}
                                    onchange={(e) =>
                                        handleConversionChange(
                                            index,
                                            "value",
                                            Number(e)
                                        )
                                    }
                                    disabled={
                                        index === 0 || !canModifyConversions
                                    }
                                    error={
                                        fieldErrors[
                                            `conversion_${index}_value`
                                        ] || ""
                                    }
                                />
                            </td>
                            <td>
                                {index > 0 && (
                                    <Select
                                        title="من"
                                        value={row.to}
                                        onchange={(val) =>
                                            handleConversionChange(
                                                index,
                                                "to",
                                                val
                                            )
                                        }
                                        options={volumes.map((v) => ({
                                            value: v._id,
                                            label: v.name,
                                        }))}
                                        disabled={
                                            index === 0 || !canModifyConversions
                                        }
                                        error={
                                            fieldErrors[
                                                `conversion_${index}_to`
                                            ] || ""
                                        }
                                    />
                                )}
                            </td>
                            <td>
                                <TextInput
                                    type="text"
                                    placeholder="باركود"
                                    label="باركود"
                                    id={`barcode-${index}`}
                                    value={row.barcode || ""}
                                    onchange={(e) =>
                                        handleConversionChange(
                                            index,
                                            "barcode",
                                            e
                                        )
                                    }
                                    disabled={!canModifyBarcode}
                                />
                            </td>
                            <td className={classes.actionColumn}>
                                {index === product.conversions.length - 1 && (
                                    <FaPlus
                                        className={classes["plus-icon"]}
                                        size="1.5em"
                                        onClick={handleAddRow}
                                    />
                                )}
                                {index > 0 && (
                                    <FaMinus
                                        className={classes["minus-icon"]}
                                        size="1.5em"
                                        onClick={() => removeRow(index)}
                                    />
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </InputTable>

            <TextInput
                type="number"
                label="الحد الأدنى للمخزون"
                id="min-stock"
                value={product["min-stock"]}
                onchange={(val) => {
                    // Mark that user has started interacting
                    if (!hasUserInteracted) {
                        setHasUserInteracted(true);
                    }
                    handleChange("min-stock", val);
                }}
                min={0}
                width={inModal ? "80%" : "50%"}
                error={fieldErrors["min-stock"] || ""}
            />
            <div style={{ padding: "auto", marginTop: "15px" }}>
                <Button
                    content={mode === "add" ? "حفظ" : "تعديل"}
                    disabled={!isSubmittable}
                    onClick={() => {
                        const endpoint =
                            mode === "edit"
                                ? `${process.env.REACT_APP_BACKEND}products/full/${initialProductData._id}`
                                : `${process.env.REACT_APP_BACKEND}products/full`;

                        const method = mode === "edit" ? axios.put : axios.post;

                        method(endpoint, product)
                            .then((res) => {
                                setSubmitMessage({
                                    text:
                                        mode === "edit"
                                            ? "تم تحديث المنتج بنجاح"
                                            : "تم حفظ المنتج بنجاح",
                                    isError: false,
                                });
                                if (onSuccess) {
                                    onSuccess(res.data.product);
                                }

                                // Clear success message after 5 seconds
                                setTimeout(() => {
                                    setSubmitMessage({
                                        text: "",
                                        isError: false,
                                    });
                                }, 5000);

                                // Reset form to initial state if not in edit mode
                                if (mode === "add") {
                                    setProduct({
                                        name: "",
                                        "min-stock": "",
                                        conversions: [
                                            {
                                                from: "",
                                                to: "",
                                                value: 1,
                                                barcode: "",
                                            },
                                        ],
                                        values: [],
                                    });
                                    setFieldErrors({});
                                    setFormError("");
                                    setHasUserInteracted(false);
                                }
                            })
                            .catch((err) => {
                                setSubmitMessage({
                                    text:
                                        err.response?.data?.error ||
                                        (mode === "add"
                                            ? "حدث خطأ أثناء حفظ المنتج"
                                            : "حدث خطأ أثناء تعديل المنتج"),
                                    isError: true,
                                });

                                // Clear error after 10 seconds
                                setTimeout(() => {
                                    setSubmitMessage({
                                        text: "",
                                        isError: false,
                                    });
                                }, 10000);
                            });
                    }}
                />

                {/* Form-level error below submit button */}
                {formError && (
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
                <FormMessage
                    text={submitMessage.text}
                    isError={submitMessage.isError}
                />
            </div>
        </div>
    );
}
