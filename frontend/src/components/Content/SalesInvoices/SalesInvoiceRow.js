// SalesInvoiceRow.js
import { IoMdAddCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import TextInput from "../../Basic/TextInput";
import Select from "../../Basic/Select";
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
}) {
    const selectedProduct = products.find((p) => p._id === row.product);

    const basePrice =
        salesType === "walkin"
            ? selectedProduct?.u_walkin_price
            : selectedProduct?.u_pharmacy_price;

    const volumeValue = selectedProduct?.values?.find(
        (v) => v.id === row.volume
    )?.val;

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

    return (
        <tr>
            <th className={classes.item} scope="row">
                {index + 1}
            </th>

            {/* Barcode */}
            <td>
                {viewMode ? (
                    <div className={classes.viewText}>{row.barcode || "—"}</div>
                ) : (
                    <TextInput
                        placeholder="الباركود"
                        value={row.barcode || ""}
                        onchange={(val) => {
                            onChange(index, "barcode", val);
                            onBarcodeChange(index, val);
                        }}
                        disabled={disabled}
                    />
                )}
            </td>

            {/* Product */}
            <td>
                {viewMode ? (
                    <div className={classes.viewText}>{productName}</div>
                ) : (
                    <>
                        <Select
                            options={products.map((p) => ({
                                value: p._id,
                                label: p.name,
                            }))}
                            disabled={disabled}
                            className={classes["no-margin"]}
                            title="المنتج"
                            value={row.product || ""}
                            onchange={(val) => onChange(index, "product", val)}
                        />
                        {errors.product && (
                            <div className={classes.error}>
                                {errors.product}
                            </div>
                        )}
                    </>
                )}
            </td>

            {/* Quantity */}
            <td>
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
            <td>
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
            <td>
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
            <td>
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

            {/* Controls */}
            {!viewMode && (
                <td>
                    {isLastRow && (
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
                    )}
                </td>
            )}
        </tr>
    );
}
