import { useState, useCallback, useEffect, Fragment } from "react";
import axios from "axios";
import Select from "../../Basic/Select";
import TextInput from "../../Basic/TextInput";
import classes from "./ProductForm.module.css";
import { FaPlus, FaMinus } from "react-icons/fa6";
import Button from "../../Basic/Button";
import FormMessage from "../../Basic/FormMessage";

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
        error: "ادخل الوحدة الاساسية",
    });

    const [volumes, setVolumes] = useState([]);
    const [isSubmittable, setIsSubmittable] = useState(false);
    const [submitError, setSubmitError] = useState(
        "الرجاء إكمال الحقول المطلوبة"
    );
    const [submitMessage, setSubmitMessage] = useState({
        text: "",
        isError: false,
    });
    const [errorsAppearing, setErrorsAppearing] = useState(true);
    const validateForSubmit = useCallback(
        (conversions) => {
            try {
                if (!product.name.trim()) {
                    throw new Error("اسم المنتج مطلوب");
                }

                const graph = {};
                const involvedIds = new Set();

                conversions.forEach(({ from, to, value }, index) => {
                    const isLast = index === conversions.length - 1;
                    const isFirst = index === 0;

                    if (isFirst && !from) {
                        throw new Error("الوحدة الأساسية مطلوبة.");
                    }

                    if (!isFirst && !isLast) {
                        if (!from || !to || !value || value <= 0) {
                            throw new Error("أكمل كل الحقول في الصفوف الوسطى.");
                        }
                    }

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
                if (!baseId) throw new Error("الوحدة الأساسية غير معرّفة");

                // Check graph connectivity
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
                        throw new Error(
                            "سلسلة التحويل غير مكتملة أو غير متصلة."
                        );
                    }
                }

                setIsSubmittable(true);
                setSubmitError("");
            } catch (err) {
                setIsSubmittable(false);
                setSubmitError(err.message);
            }
        },
        [product.name]
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
                setProduct((prev) => ({ ...prev, values, error: "" }));
            } catch (err) {
                setProduct((prev) => ({
                    ...prev,
                    values: [],
                    error: err.message,
                }));
            }
        },
        [volumes]
    );

    const handleConversionChange = (index, field, value) => {
        const updated = [...product.conversions];

        if (field !== "barcode") {
            if (
                (field === "from" && updated[index].to === value) ||
                (field === "to" && updated[index].from === value)
            ) {
                setProduct((prev) => ({
                    ...prev,
                    error: "لا يمكن اختيار نفس الحجم في الخانتين",
                }));
                return;
            }

            if (field === "from") {
                const isDuplicate = updated.some(
                    (c, i) => i !== index && c.from === value
                );
                if (isDuplicate) {
                    setProduct((prev) => ({
                        ...prev,
                        error: "تم اختيار هذا الحجم بالفعل كحجم أساسى في صف آخر",
                    }));
                    return;
                }
            }
        }
        updated[index][field] = value;
        setProduct((prev) => ({
            ...prev,
            conversions: updated,
            error: "",
        }));

        if (field !== "barcode") updateValues(updated);
    };

    const handleAddRow = () => {
        const last = product.conversions.at(-1);
        const isFirst = product.conversions.length === 1;

        if (isFirst && !last?.from) {
            setProduct((prev) => ({
                ...prev,
                error: "يجب اختيار الحجم الأساسى أولاً قبل إضافة صف جديد",
            }));
            return;
        }

        if (
            !isFirst &&
            (!last?.from || !last?.to || !last?.value || last.value <= 0)
        ) {
            setProduct((prev) => ({
                ...prev,
                error: "يرجى إكمال الصف الأخير قبل إضافة صف جديد",
            }));
            return;
        }

        setProduct((prev) => ({
            ...prev,
            conversions: [
                ...prev.conversions,
                { from: "", to: "", value: "", barcode: "" },
            ],
            error: "",
        }));
    };

    const removeRow = (index) => {
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
        setProduct((prev) => ({
            ...prev,
            [field]: value,
        }));
    };
    useEffect(() => {
        axios
            .get(process.env.REACT_APP_BACKEND + "volumes")
            .then((res) => setVolumes(res.data))
            .catch((err) => console.error("Failed to fetch volumes:", err));
    }, []);

    useEffect(() => {
        validateForSubmit(product.conversions);
    }, [product.conversions, product.name, validateForSubmit]);
    useEffect(() => {
        if (mode === "edit" && initialProductData) {
            setProduct({
                name: initialProductData.name || "",
                "min-stock": initialProductData["min-stock"] || "",
                conversions: initialProductData.conversions || [
                    { from: "", to: "", value: 1, barcode: "" },
                ],
                error: "",
            });
        }
    }, [mode, initialProductData]);
    // 2. Separate effect: call updateValues when both conversions and volumes are ready
    useEffect(() => {
        if (product.conversions?.length > 0 && volumes.length > 0) {
            updateValues(product.conversions);
        }
    }, [product.conversions, volumes, updateValues]);

    return (
        <div className={classes.add}>
            <div style={{ width: inModal ? "100%" : "50%" }}>
                <TextInput
                    type="text"
                    placeholder="اسم المنتج"
                    label="اسم المنتج"
                    id="product-name"
                    value={product.name}
                    onchange={(e) => setProduct({ ...product, name: e })}
                />
            </div>

            <div style={{ width: inModal ? "100%" : "70%" }}>
                <div className={classes.table}>
                    <div> الوحدة بتاعتنا </div>
                    <div>كام </div>
                    <div>من ايه؟ </div>
                    <div>الباركود</div>
                    <div></div>

                    {product.conversions.map((row, index) => (
                        <Fragment key={index}>
                            <div>
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
                                    disabled={false}
                                />
                            </div>
                            <div>
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
                                    disabled={index === 0}
                                />
                            </div>
                            <div>
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
                                        disabled={index === 0}
                                    />
                                )}
                            </div>
                            <div>
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
                                />
                            </div>
                            <div>
                                {index === product.conversions.length - 1 && (
                                    <FaPlus
                                        className={classes["plus-icon"]}
                                        size="2.5em"
                                        onClick={handleAddRow}
                                    />
                                )}
                                {index > 0 && (
                                    <FaMinus
                                        className={classes["minus-icon"]}
                                        size="2.5em"
                                        onClick={() => removeRow(index)}
                                    />
                                )}
                            </div>
                        </Fragment>
                    ))}
                </div>
            </div>

            <div style={{ width: inModal ? "100%" : "50%" }}>
                <TextInput
                    type="number"
                    label="الحد الأدنى للمخزون"
                    id="min-stock"
                    value={product["min-stock"]}
                    onchange={(val) => handleChange("min-stock", val)}
                    min={0}
                />
            </div>
            {errorsAppearing && product.error && (
                <div style={{ color: "red", marginTop: "10px" }}>
                    {product.error}
                </div>
            )}

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
                                setErrorsAppearing(false);
                                setTimeout(() => {
                                    setErrorsAppearing(true);
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
                                        error: "ادخل الوحدة الاساسية",
                                    });
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
                            });
                        setTimeout(() => {
                            setSubmitMessage({
                                text: "",
                                isError: false,
                            });
                        }, 5000);
                    }}
                />
                {errorsAppearing && !isSubmittable && (
                    <div style={{ color: "red", marginTop: "10px" }}>
                        ⚠️ {submitError}
                    </div>
                )}
                <FormMessage
                    text={submitMessage.text}
                    isError={submitMessage.isError}
                />
            </div>
        </div>
    );
}
