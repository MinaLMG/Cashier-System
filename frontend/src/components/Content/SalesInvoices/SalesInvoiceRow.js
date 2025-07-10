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
}) {
    const selectedProduct = products.find((p) => p._id === row.product);

    const basePrice =
        salesType === "walkin"
            ? selectedProduct?.walkin_price
            : selectedProduct?.pharmacy_price;

    const volumeValue = selectedProduct?.values?.find(
        (v) => v.id === row.volume
    )?.val;

    const unitPrice =
        basePrice && volumeValue ? Number(basePrice) * Number(volumeValue) : "";

    const total = Number(row.quantity || 0) * Number(unitPrice || 0);

    return (
        <tr>
            <th className={classes.item} scope="row">
                {index + 1}
            </th>

            {/* Barcode */}
            <td className={classes.item}>
                <TextInput
                    className={classes["no-margin"]}
                    type="text"
                    placeholder="الباركود"
                    label="الباركود"
                    value={row.barcode || ""}
                    onchange={(val) => {
                        onChange(index, "barcode", val);
                        if (val && val.length > 3) {
                            onBarcodeChange(index, val);
                        }
                    }}
                    autoFocus={isLastRow}
                />
                {errors.barcode && (
                    <div className={classes.error}>{errors.barcode}</div>
                )}
            </td>

            {/* Product */}
            <td className={classes.item}>
                <Select
                    className={classes["no-margin"]}
                    title="المنتج"
                    value={row.product}
                    onchange={(val) => onChange(index, "product", val)}
                    options={products.map((p) => ({
                        value: p._id,
                        label: p.name,
                    }))}
                />
                {errors.product && (
                    <div className={classes.error}>{errors.product}</div>
                )}
            </td>

            {/* Volume */}
            <td className={classes.item}>
                <Select
                    className={classes["no-margin"]}
                    title="العبوة"
                    value={row.volume}
                    onchange={(val) => onChange(index, "volume", val)}
                    options={
                        row.product
                            ? products
                                  .find((p) => p._id === row.product)
                                  ?.values.map((v) => ({
                                      value: v.id,
                                      label: v.name,
                                  })) ?? []
                            : []
                    }
                    disabled={!row.product}
                />
                {errors.volume && (
                    <div className={classes.error}>{errors.volume}</div>
                )}
            </td>

            {/* Quantity */}
            <td className={classes.item}>
                <TextInput
                    className={classes["no-margin"]}
                    type="number"
                    placeholder="الكمية"
                    label="الكمية"
                    value={row.quantity}
                    onchange={(val) => onChange(index, "quantity", val)}
                />
                {errors.quantity && (
                    <div className={classes.error}>{errors.quantity}</div>
                )}
            </td>

            {/* Unit Price */}
            <td className={classes.item}>
                <TextInput
                    className={classes["no-margin"]}
                    type="number"
                    label="السعر"
                    value={unitPrice !== "" ? unitPrice.toFixed(2) : ""}
                    disabled
                />
            </td>

            {/* Total */}
            <td className={classes.item}>
                <TextInput
                    className={classes["no-margin"]}
                    type="number"
                    label="الإجمالى"
                    value={total.toFixed(2)}
                    disabled
                />
            </td>

            {/* Actions */}
            <td className={`${classes.item} ${classes.tools}`}>
                {isLastRow && (
                    <IoMdAddCircle onClick={onAdd} className={classes.add} />
                )}
                {canRemove && (
                    <MdDelete
                        onClick={() => onRemove(index)}
                        className={classes.remove}
                    />
                )}
            </td>
        </tr>
    );
}
