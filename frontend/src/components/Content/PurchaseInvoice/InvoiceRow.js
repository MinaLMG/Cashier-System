import { IoMdAddCircle } from "react-icons/io";
import { MdDelete } from "react-icons/md";
import { FaCircle } from "react-icons/fa";
import Select from "../../Basic/Select";
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
    } = props;

    // Function to reset expiry date
    const resetExpiryDate = () => {
        onChange(index, "expiry", null);
    };

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

    // Format date for view mode
    const formattedExpiry =
        viewMode && row.expiry
            ? new Date(row.expiry).toLocaleDateString("ar-EG")
            : "";

    return (
        <tr>
            <th className={classes.item} scope="row">
                {index + 1}
            </th>

            {/* Product Name */}
            <td className={classes.item}>
                {viewMode ? (
                    <div className={classes.viewText}>{productName}</div>
                ) : (
                    <>
                        <Select
                            className={classes["no-margin"]}
                            title="اسم المنتج"
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

            {/* الباقي */}
            <td className={classes.item}>
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
            </td>

            {/* Controls */}
            {!viewMode && (
                <td className={classes.item}>
                    {isLastRow && (
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
                    )}
                </td>
            )}
        </tr>
    );
}
