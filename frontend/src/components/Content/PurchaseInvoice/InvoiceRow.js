import { IoMdAddCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { FaCircle } from "react-icons/fa";
import Select from "../../Basic/Select";
import TextInput from "../../Basic/TextInput";
import DateTimeInput from "../../Basic/DateTimeInput";
import classes from "./InvoiceRow.module.css";

// Extracted InvoiceRow Component
export default function InvoiceRow({
    row,
    index,
    products,
    onChange,
    onRemove,
    onAdd,
    errors,
    isLastRow,
    canRemove,
}) {
    // Function to reset expiry date
    const resetExpiryDate = () => {
        onChange(index, "expiry", null);
    };

    return (
        <tr>
            <th className={classes.item} scope="row">
                {index + 1}
            </th>

            {/* Product Name */}
            <td className={classes.item}>
                <Select
                    className={classes["no-margin"]}
                    title="اسم المنتج"
                    value={row.product}
                    onchange={(val) => onChange(index, "product", val)}
                    options={products.map((p) => ({
                        value: p._id,
                        label: p.name,
                    }))}
                    disabled={false}
                />
                {errors.product && (
                    <div className={classes.error}>{errors.product}</div>
                )}
            </td>

            {/* Quantity */}
            <td className={classes.item}>
                <TextInput
                    className={classes["no-margin"]}
                    type="number"
                    placeholder="الكمية"
                    label="الكمية"
                    id={`quantity` + index}
                    value={row.quantity}
                    onchange={(val) => onChange(index, "quantity", val)}
                    disabled={false}
                    min={0}
                />
                {errors.quantity && (
                    <div className={classes.error}>{errors.quantity}</div>
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
                                  ?.values?.map((v) => ({
                                      value: v.id,
                                      label: v.name,
                                  })) || []
                            : []
                    }
                    disabled={!row.product}
                />
                {errors.volume && (
                    <div className={classes.error}>{errors.volume}</div>
                )}
            </td>

            {/* سعر الشراء */}
            <td className={classes.item}>
                <TextInput
                    className={classes["no-margin"]}
                    type="number"
                    placeholder="سعر الشراء"
                    label="سعر الشراء"
                    id={`buy_price` + index}
                    value={row["buy_price"]}
                    onchange={(val) => onChange(index, "buy_price", val)}
                    disabled={false}
                    min={0}
                />
                {errors.buy_price && (
                    <div className={classes.error}>{errors.buy_price}</div>
                )}
            </td>

            {/* سعر البيع للصيدلية */}
            <td className={classes.item}>
                <TextInput
                    className={classes["no-margin"]}
                    type="number"
                    placeholder="سعر البيع للصيدلية"
                    label="سعر البيع للصيدلية"
                    id={`phar_price` + index}
                    value={row["phar_price"]}
                    onchange={(val) => onChange(index, "phar_price", val)}
                    disabled={false}
                    min={0}
                />
                {errors.phar_price && (
                    <div className={classes.error}>{errors.phar_price}</div>
                )}
            </td>

            {/* سعر البيع للزبون */}
            <td className={classes.item}>
                <TextInput
                    className={classes["no-margin"]}
                    type="number"
                    placeholder="سعر البيع للزبون"
                    label="سعر البيع للزبون"
                    id={`cust_price` + index}
                    value={row["cust_price"]}
                    onchange={(val) => onChange(index, "cust_price", val)}
                    disabled={false}
                    min={0}
                />
                {errors.cust_price && (
                    <div className={classes.error}>{errors.cust_price}</div>
                )}
            </td>

            {/* تاريخ الصلاحية */}
            <td className={classes.item}>
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
                        onchange={(val) => onChange(index, "expiry", val)}
                        includeTime={false}
                        disabled={false}
                    />
                </div>
                {errors.expiry && (
                    <div className={classes.error}>{errors.expiry}</div>
                )}
            </td>

            {/* الباقي */}
            <td className={classes.item}>
                <TextInput
                    className={classes["no-margin"]}
                    type="number"
                    placeholder="الباقى"
                    label="الباقى"
                    id={`remaining_${index}`}
                    value={row["remaining"]}
                    onchange={(val) => onChange(index, "remaining", val)}
                    disabled={false}
                    min={0}
                />
                {errors.remaining && (
                    <div className={classes.error}>{errors.remaining}</div>
                )}
            </td>

            {/* Controls */}
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
