// SalesInvoiceRow.js
import React, { useEffect, useRef } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { FaUndo } from "react-icons/fa";
import TextInput from "../../Basic/TextInput";
import Select from "../../Basic/Select";
import SearchableSelect from "../../Basic/SearchableSelect";
import classes from "./SalesInvoiceRow.module.css";

export default function SalesInvoiceRow({
    row,
    index,
    onChange,
    onRemove,
    onAdd,
    isLastRow,
    canRemove,
    products,
    salesType,
    errors,
    onBarcodeChange,
    disabled,
    viewMode,
    onReturn,
    isEditMode = false,
    totalRows,
    returnItems = [],
}) {
    const selectedProduct = products.find((p) => p._id === row.product);
    const barcodeTimeoutRef = useRef(null);

    const basePrice =
        salesType === "walkin"
            ? selectedProduct?.u_walkin_price
            : selectedProduct?.u_pharmacy_price;

    const volumeValue = selectedProduct?.values?.find(
        (v) => v.id === row.volume
    )?.value;

    const unitPrice =
        viewMode && row.v_price
            ? row.v_price
            : basePrice && volumeValue
            ? basePrice * volumeValue
            : "";

    const total = Number(row.quantity || 0) * Number(unitPrice || 0);

    // Get product name for view mode
    const productName = selectedProduct?.name || "غير معروف";

    // Get volume name for view mode
    const volumeName =
        selectedProduct?.values?.find((v) => v.id === row.volume)?.name ||
        "غير معروف";

    // Debounced barcode change handler
    const handleBarcodeChange = (val) => {
        // First update the value immediately
        onChange(index, "barcode", val);

        // Clear existing timeout
        if (barcodeTimeoutRef.current) {
            clearTimeout(barcodeTimeoutRef.current);
        }

        // Set new timeout for barcode lookup
        barcodeTimeoutRef.current = setTimeout(() => {
            if (val && val.trim() !== "" && val.length >= 3) {
                // Only lookup if barcode is at least 3 characters
                console.log("Looking up barcode:", val); // Debug log
                onBarcodeChange(index, val);
            }
        }, 500); // 500ms debounce
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (barcodeTimeoutRef.current) {
                clearTimeout(barcodeTimeoutRef.current);
            }
        };
    }, []);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Only handle shortcuts when not in view mode
            if (viewMode) return;

            // Check if the event target is an input, select, or textarea
            const isInputElement =
                event.target.tagName === "INPUT" ||
                event.target.tagName === "SELECT" ||
                event.target.tagName === "TEXTAREA";

            // If user is typing in an input field, don't handle shortcuts
            if (isInputElement) return;

            // Handle Insert key (add new row)
            if (event.key === "Insert" && isLastRow && !disabled) {
                event.preventDefault();
                onAdd();
            }

            // Handle Delete key (remove last row)
            if (event.key === "Delete" && !disabled) {
                event.preventDefault();
                // Always remove the last row, regardless of current row
                const lastRowIndex = totalRows - 1;
                if (lastRowIndex > 0) {
                    // Only remove if there's more than one row
                    onRemove(lastRowIndex);
                }
            }
        };

        // Add event listener
        document.addEventListener("keydown", handleKeyDown);

        // Cleanup
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [
        viewMode,
        isLastRow,
        canRemove,
        disabled,
        onAdd,
        onRemove,
        index,
        totalRows,
    ]);

    return (
        <tr>
            <th className={classes.item} scope="row">
                {index + 1}
            </th>

            {/* Barcode */}
            <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>{row.barcode || "—"}</div>
                ) : (
                    <div>
                        <TextInput
                            placeholder="الباركود"
                            value={row.barcode || ""}
                            onchange={handleBarcodeChange}
                            disabled={disabled}
                        />
                        {errors.barcode && (
                            <div className={classes.error}>
                                {errors.barcode}
                            </div>
                        )}
                    </div>
                )}
            </td>

            {/* Product */}
            <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>{productName}</div>
                ) : (
                    <div>
                        <SearchableSelect
                            className="tableCellContainer"
                            placeholder="اختر المنتج"
                            label=""
                            value={row.product || ""}
                            options={products.map((p) => ({
                                value: p._id,
                                label: p.name,
                            }))}
                            onchange={(val) => onChange(index, "product", val)}
                            disabled={disabled}
                            error={errors.product || ""}
                        />
                    </div>
                )}
            </td>

            {/* Quantity */}
            <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>
                        {row.quantity || "0"}
                    </div>
                ) : (
                    <>
                        <TextInput
                            className={classes["no-margin"]}
                            type="number"
                            placeholder="الكمية"
                            value={row.quantity || ""}
                            onchange={(val) => onChange(index, "quantity", val)}
                            disabled={disabled}
                            label="الكمية"
                            min={0}
                        />
                        {errors.quantity && (
                            <div className={classes.error}>
                                {errors.quantity}
                            </div>
                        )}
                    </>
                )}
            </td>

            {/* Volume */}
            <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>{volumeName}</div>
                ) : (
                    <>
                        <Select
                            onchange={(val) => onChange(index, "volume", val)}
                            disabled={!row.product || disabled}
                            className={classes["no-margin"]}
                            title="العبوة"
                            value={row.volume || ""}
                            options={
                                row.product
                                    ? products
                                          .find((p) => p._id === row.product)
                                          ?.values?.map((v) => ({
                                              value: v.id,
                                              label: v.name,
                                          })) || []
                                    : []
                            }
                        />
                        {errors.volume && (
                            <div className={classes.error}>{errors.volume}</div>
                        )}
                    </>
                )}
            </td>

            {/* Unit Price */}
            <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>
                        {unitPrice !== ""
                            ? `${Number(unitPrice).toFixed(2)} ج.م`
                            : "—"}
                    </div>
                ) : (
                    <TextInput
                        className={classes["no-margin"]}
                        type="number"
                        label="السعر"
                        value={
                            unitPrice !== ""
                                ? typeof unitPrice === "number"
                                    ? unitPrice.toFixed(2)
                                    : unitPrice
                                : ""
                        }
                        disabled
                    />
                )}
            </td>

            {/* Total */}
            <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>
                        {total > 0 ? `${total.toFixed(2)} ج.م` : "—"}
                    </div>
                ) : (
                    <TextInput
                        className={classes["no-margin"]}
                        type="number"
                        label="الإجمالى"
                        value={total.toFixed(2)}
                        disabled
                    />
                )}
            </td>

            {/* Returned (View Mode only) */}
            {returnItems && returnItems.length > 0 && (
                <td className={classes.item}>
                    <div className={classes.viewText}>
                        {(() => {
                            const returned = returnItems.filter(
                                (r) =>
                                    (r.sales_item?._id || r.sales_item) === row._id ||
                                    ((r.product?._id || r.product) === row.product &&
                                        (r.volume?._id || r.volume) === row.volume)
                            );

                            const totalBaseReturned = returned.reduce((sum, r) => {
                                // Find the product for this return item to get its values
                                const returnProd = products.find(
                                    (p) => p._id === (r.product?._id || r.product)
                                );
                                // Find the specific volume conversion value
                                const volumeId = r.volume?._id || r.volume;
                                const volumeEntry = returnProd?.values?.find(
                                    (v) => v.id === volumeId
                                );
                                const factor = Number(volumeEntry?.value || 1);
                                return sum + Number(r.quantity || 0) * factor;
                            }, 0);

                            const normalizedReturned = totalBaseReturned / (volumeValue || 1);

                            // Find unit name
                            const product = products.find(
                                (p) => p._id === row.product
                            );
                            const unitName =
                                product?.values?.find(
                                    (v) => v.id === row.volume
                                )?.name || "وحدة";

                            return normalizedReturned > 0
                                ? `${normalizedReturned % 1 === 0 ? normalizedReturned : normalizedReturned.toFixed(2)} ${unitName}`
                                : "";
                        })()}
                    </div>
                </td>
            )}

            {/* Controls */}
            {!viewMode && (
                <td>
                    <div
                        style={{
                            display: "flex",
                            gap: "5px",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {isEditMode && row.product && row.volume && (
                            <FaUndo
                                onClick={() => onReturn && onReturn(row, index)}
                                className={classes.returnButton}
                                title="إرجاع المنتج"
                                disabled={disabled}
                            />
                        )}
                        {isLastRow ? (
                            <button
                                type="button"
                                onClick={onAdd}
                                className={classes.insertButton}
                                disabled={
                                    typeof disabled === "function"
                                        ? disabled("add")
                                        : disabled
                                }
                                title="إدراج صف جديد (Insert) - اضغط Insert لإضافة صف جديد"
                            >
                                Insert
                            </button>
                        ) : (
                            !viewMode && (
                                <button
                                    type="button"
                                    onClick={() => onRemove(index)}
                                    className={classes.deleteButton}
                                    disabled={
                                        (typeof disabled === "function"
                                            ? disabled("remove")
                                            : disabled)
                                    }
                                    title="حذف الصف (Delete) - اضغط Delete لحذف هذا الصف"
                                >
                                    Del
                                </button>
                            )
                        )}
                        {/* {isLastRow && (
                            <IoMdAddCircle
                                onClick={onAdd}
                                className={classes.add}
                                disabled={disabled}
                            />
                        )}
                        {canRemove && (
                            <MdDelete
                                onClick={() => onRemove(index)}
                                className={classes.remove}
                                disabled={disabled}
                            />
                        )} */}
                    </div>
                </td>
            )}
        </tr>
    );
}
