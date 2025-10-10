import React, { useEffect, useRef } from "react";
import { IoMdAddCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { FaCircle } from "react-icons/fa";
import Select from "../../Basic/Select";
import SearchableSelect from "../../Basic/SearchableSelect";
import TextInput from "../../Basic/TextInput";
import DateTimeInput from "../../Basic/DateTimeInput";
import classes from "./InvoiceRow.module.css";

// Extracted InvoiceRow Component
export default function InvoiceRow(props) {
    // Add viewMode prop to component props
    const {
        row,
        index,
        products,
        onChange,
        onRemove,
        onAdd,
        errors,
        isLastRow,
        canRemove,
        disabled,
        viewMode,
        priceSuggestions,
        totalRows,
        onBarcodeChange,
    } = props;

    const barcodeTimeoutRef = useRef(null);

    // Function to reset expiry date
    const resetExpiryDate = () => {
        onChange(index, "expiry", null);
    };

    // Debounced barcode change handler (same as SalesInvoice)
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

    // Get product name for view mode
    const productName =
        viewMode && row.product
            ? products.find((p) => p._id === row.product)?.name || "غير معروف"
            : "";

    // Get volume name for view mode
    const volumeName =
        viewMode && row.product && row.volume
            ? products
                  .find((p) => p._id === row.product)
                  ?.values?.find((v) => v.id === row.volume)?.name ||
              "غير معروف"
            : "";

    // Get barcode for the selected volume
    const volumeBarcode =
        row.product && row.volume
            ? products
                  .find((p) => p._id === row.product)
                  ?.values?.find((v) => v.id === row.volume)?.barcode || ""
            : "";

    // Format date for view mode
    const formattedExpiry =
        viewMode && row.expiry
            ? new Date(row.expiry).toLocaleDateString("ar-EG")
            : "";

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
                    <div className={classes.viewText}>
                        {volumeBarcode || "--"}
                    </div>
                ) : (
                    <>
                        <TextInput
                            className={classes["no-margin"]}
                            type="text"
                            placeholder="امسح الباركود"
                            label="الباركود"
                            id={`barcode` + index}
                            value={row.barcode || ""}
                            onchange={handleBarcodeChange}
                            disabled={
                                typeof disabled === "function"
                                    ? disabled("barcode")
                                    : disabled
                            }
                        />
                        {errors.barcode && (
                            <div className={classes.error}>
                                {errors.barcode}
                            </div>
                        )}
                    </>
                )}
            </td>

            {/* Product Name */}
            <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>{productName}</div>
                ) : (
                    <>
                        <SearchableSelect
                            className={`${classes["no-margin"]} tableCellContainer`}
                            label=""
                            placeholder="اختر المنتج"
                            value={row.product}
                            onchange={(val) => onChange(index, "product", val)}
                            options={products.map((p) => ({
                                value: p._id,
                                label: p.name,
                            }))}
                            disabled={
                                typeof disabled === "function"
                                    ? disabled("product")
                                    : disabled
                            }
                            error={errors.product || ""}
                        />
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
                            className={classes["no-margin"]}
                            title="العبوة"
                            value={row.volume}
                            onchange={(val) => onChange(index, "volume", val)}
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
                            disabled={
                                !row.product ||
                                (typeof disabled === "function"
                                    ? disabled("volume")
                                    : disabled)
                            }
                        />
                        {errors.volume && (
                            <div className={classes.error}>{errors.volume}</div>
                        )}
                    </>
                )}
            </td>

            {/* Quantity */}
            <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>{row.quantity}</div>
                ) : (
                    <>
                        <TextInput
                            className={classes["no-margin"]}
                            type="number"
                            placeholder="الكمية"
                            label="الكمية"
                            id={`quantity` + index}
                            value={row.quantity}
                            onchange={(val) => onChange(index, "quantity", val)}
                            disabled={
                                typeof disabled === "function"
                                    ? disabled("quantity")
                                    : disabled
                            }
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

            {/* سعر الشراء */}
            <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>
                        {Number(row.v_buy_price).toFixed(2)} ج.م
                    </div>
                ) : (
                    <>
                        <TextInput
                            className={classes["no-margin"]}
                            type="number"
                            placeholder="سعر الشراء"
                            label="سعر الشراء"
                            id={`v_buy_price` + index}
                            value={row["v_buy_price"]}
                            onchange={(val) =>
                                onChange(index, "v_buy_price", val)
                            }
                            disabled={
                                typeof disabled === "function"
                                    ? disabled("v_buy_price")
                                    : disabled
                            }
                            min={0}
                        />
                        {priceSuggestions?.v_buy_price && (
                            <div className={classes.priceSuggestion}>
                                <span className={classes.suggestionIcon}>
                                    💡
                                </span>
                                <span className={classes.suggestionText}>
                                    مقترح: {priceSuggestions.v_buy_price} ج.م
                                </span>
                            </div>
                        )}
                        {errors.v_buy_price && (
                            <div className={classes.error}>
                                {errors.v_buy_price}
                            </div>
                        )}
                    </>
                )}
            </td>

            {/* سعر البيع للصيدلية */}
            <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>
                        {Number(row.v_pharmacy_price).toFixed(2)} ج.م
                    </div>
                ) : (
                    <>
                        <TextInput
                            className={classes["no-margin"]}
                            type="number"
                            placeholder="سعر البيع للصيدلية"
                            label="سعر البيع للصيدلية"
                            id={`v_pharmacy_price` + index}
                            value={row["v_pharmacy_price"]}
                            onchange={(val) =>
                                onChange(index, "v_pharmacy_price", val)
                            }
                            disabled={
                                typeof disabled === "function"
                                    ? disabled("product")
                                    : disabled
                            }
                            min={0}
                        />
                        {priceSuggestions?.v_pharmacy_price && (
                            <div className={classes.priceSuggestion}>
                                <span className={classes.suggestionIcon}>
                                    💡
                                </span>
                                <span className={classes.suggestionText}>
                                    مقترح: {priceSuggestions.v_pharmacy_price}{" "}
                                    ج.م
                                </span>
                            </div>
                        )}
                        {errors.v_pharmacy_price && (
                            <div className={classes.error}>
                                {errors.v_pharmacy_price}
                            </div>
                        )}
                    </>
                )}
            </td>

            {/* سعر البيع للزبون */}
            <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>
                        {Number(row.v_walkin_price).toFixed(2)} ج.م
                    </div>
                ) : (
                    <>
                        <TextInput
                            className={classes["no-margin"]}
                            type="number"
                            placeholder="سعر البيع للزبون"
                            label="سعر البيع للزبون"
                            id={`v_walkin_price` + index}
                            value={row["v_walkin_price"]}
                            onchange={(val) =>
                                onChange(index, "v_walkin_price", val)
                            }
                            disabled={
                                typeof disabled === "function"
                                    ? disabled("product")
                                    : disabled
                            }
                            min={0}
                        />
                        {priceSuggestions?.v_walkin_price && (
                            <div className={classes.priceSuggestion}>
                                <span className={classes.suggestionIcon}>
                                    💡
                                </span>
                                <span className={classes.suggestionText}>
                                    مقترح: {priceSuggestions.v_walkin_price} ج.م
                                </span>
                            </div>
                        )}
                        {errors.v_walkin_price && (
                            <div className={classes.error}>
                                {errors.v_walkin_price}
                            </div>
                        )}
                    </>
                )}
            </td>

            {/* تاريخ الصلاحية */}
            <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>
                        {formattedExpiry || "غير محدد"}
                    </div>
                ) : (
                    <>
                        <div className={classes.expiryContainer}>
                            <FaCircle
                                className={classes.resetExpiry}
                                onClick={resetExpiryDate}
                                title="إعادة ضبط تاريخ الانتهاء"
                            />
                            <DateTimeInput
                                className={classes["no-margin"]}
                                label="تاريخ الانتهاء"
                                id={`expiry${index}`}
                                value={row.expiry || null}
                                onchange={(val) =>
                                    onChange(index, "expiry", val)
                                }
                                includeTime={false}
                                disabled={
                                    typeof disabled === "function"
                                        ? disabled("product")
                                        : disabled
                                }
                            />
                        </div>
                        {errors.expiry && (
                            <div className={classes.error}>{errors.expiry}</div>
                        )}
                    </>
                )}
            </td>

            {/* الباقي - COMMENTED OUT */}
            {/* <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>
                        {row.remaining || "0"}
                    </div>
                ) : (
                    <>
                        <TextInput
                            className={classes["no-margin"]}
                            type="number"
                            placeholder="الباقى"
                            label="الباقى"
                            id={`remaining_${index}`}
                            value={row["remaining"]}
                            onchange={(val) =>
                                onChange(index, "remaining", val)
                            }
                            disabled={
                                typeof disabled === "function"
                                    ? disabled("product")
                                    : disabled
                            }
                            min={0}
                        />
                        {errors.remaining && (
                            <div className={classes.error}>
                                {errors.remaining}
                            </div>
                        )}
                    </>
                )}
            </td> */}

            {/* Controls */}
            {!viewMode && (
                <td className={classes.item}>
                    <div
                        style={{
                            display: "flex",
                            gap: "5px",
                            justifyContent: "center",
                        }}
                    >
                        {isLastRow && (
                            <button
                                type="button"
                                disabled={
                                    typeof disabled === "function"
                                        ? disabled("add")
                                        : disabled
                                }
                                onClick={onAdd}
                                className={classes.insertButton}
                                title="إدراج صف جديد (Insert) - اضغط Insert لإضافة صف جديد"
                            >
                                Insert
                            </button>
                        )}
                        {canRemove && (
                            <button
                                type="button"
                                onClick={() => onRemove(index)}
                                className={classes.deleteButton}
                                disabled={
                                    typeof disabled === "function"
                                        ? disabled("remove")
                                        : disabled
                                }
                                title="حذف الصف (Delete) - اضغط Delete لحذف هذا الصف"
                            >
                                Del
                            </button>
                        )}
                    </div>
                    {/* {isLastRow && (
                        <IoMdAddCircle
                            disabled={disabled}
                            onClick={onAdd}
                            className={classes.add}
                        />
                    )}
                    {canRemove && (
                        <MdDelete
                            onClick={() => onRemove(index)}
                            className={classes.remove}
                            disabled={disabled}
                        />
                    )} */}
                </td>
            )}
        </tr>
    );
}
