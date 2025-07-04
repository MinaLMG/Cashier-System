import { useEffect, useState } from "react";
import axios from "axios";
import TextInput from "../../Basic/TextInput";
import classes from "./PurchaseInvoice.module.css";
import Select from "../../Basic/Select";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { IoMdAddCircle } from "react-icons/io";
// ... previous imports
export default function PurchaseInvoice() {
    const [suppliers, setSuppliers] = useState([]);
    const [volumes, setVolumes] = useState([]);
    const [products, setProducts] = useState([]);
    const [invoice, setInvoice] = useState({
        date: new Date(Date.now()).toISOString().split("T")[0],
        supplier: "",
        rows: [
            {
                product: "",
                quantity: "",
                volume: "",
                buy_price: "",
                phar_price: "",
                cust_price: "",
                expiry: "",
                rest: "",
            },
        ],
    });
    const [rowErrors, setRowErrors] = useState({});
    useEffect(() => {
        axios
            .get(process.env.REACT_APP_BACKEND + "suppliers")
            .then((res) => setSuppliers(res.data))
            .catch((err) => console.error("Failed to fetch suppliers:", err));
        axios
            .get(process.env.REACT_APP_BACKEND + "volumes")
            .then((res) => setVolumes(res.data))
            .catch((err) => console.error("Failed to fetch volumes:", err));
        axios
            .get(process.env.REACT_APP_BACKEND + "products/full")
            .then((res) => setProducts(res.data))
            .catch((err) => console.error("Failed to fetch products:", err));
    }, []);

    const handleRowChange = (index, key, value) => {
        const updatedRows = [...invoice.rows];
        updatedRows[index][key] = value;
        setInvoice((prev) => ({ ...prev, rows: updatedRows }));
    };

    const getVolumesForProduct = (productId) => {
        const product = products.find((p) => p._id === productId);
        return product
            ? product.values.map((v) => ({
                  value: v.id,
                  label: v.name,
              }))
            : [];
    };

    const isRowValid = (row) => {
        return (
            row.product &&
            row.quantity &&
            row.volume &&
            row.buy_price &&
            row.phar_price &&
            row.cust_price &&
            Number(row.buy_price) <= Number(row.phar_price) &&
            Number(row.phar_price) <= Number(row.cust_price)
        );
    };
    function validateRow(row) {
        const errors = {};

        if (!row.name) errors.name = "اختر المنتج";
        if (!row.volume) errors.volume = "اختر العبوة";
        if (!row.quantity) errors.quantity = "ادخل الكمية";
        if (!row.buy_price) errors.buy_price = "ادخل سعر الشراء";
        if (!row.phar_price) errors.phar_price = "ادخل سعر البيع للصيدلية";
        if (!row.cust_price) errors.cust_price = "ادخل سعر البيع للزبون";

        if (
            row.buy_price &&
            row.phar_price &&
            parseFloat(row.phar_price) < parseFloat(row.buy_price)
        ) {
            errors.phar_price = "سعر الصيدلية أقل من سعر الشراء";
        }

        if (
            row.phar_price &&
            row.cust_price &&
            parseFloat(row.cust_price) < parseFloat(row.phar_price)
        ) {
            errors.cust_price = "سعر الزبون أقل من سعر الصيدلية";
        }

        return Object.keys(errors).length ? errors : null;
    }

    const canAddNewRow = invoice.rows.every((r, i) => isRowValid(r));

    const addRow = () => {
        const errors = {};

        invoice.rows.forEach((row, index) => {
            const rowError = validateRow(row);
            if (rowError) errors[index] = rowError;
        });

        if (Object.keys(errors).length > 0) {
            setRowErrors(errors);
            return;
        }

        // Clear old errors
        setRowErrors({});

        // Add a new row
        setInvoice((prev) => ({
            ...prev,
            rows: [...prev.rows, {}],
        }));
    };

    const removeRow = (index) => {
        const updated = [...invoice.rows];
        updated.splice(index, 1);
        setInvoice((prev) => ({ ...prev, rows: updated }));
    };

    return (
        <div className={classes.container}>
            <div style={{ width: "10%", marginRight: "2.5%" }}>
                <TextInput
                    type="date"
                    placeholder="تاريخ الفاتورة"
                    label="تاريخ الفاتورة"
                    id={`date`}
                    value={invoice.date}
                    onchange={(e) =>
                        setInvoice((prev) => ({ ...prev, date: e }))
                    }
                    disabled={false}
                />
            </div>
            <div style={{ width: "50%", marginRight: "2.5%" }}>
                <Select
                    title="المورّد"
                    value={invoice.supplier}
                    onchange={(val) =>
                        setInvoice((prev) => ({ ...prev, supplier: val }))
                    }
                    options={suppliers.map((s) => ({
                        value: s._id,
                        label: s.name,
                    }))}
                    disabled={false}
                />
            </div>

            <div style={{ width: "95%", margin: "20px auto" }}>
                <table
                    className={`table table-light table-hover table-bordered border-secondary ${classes.table}`}
                >
                    <thead>
                        <tr>
                            <th className={classes.head} scope="col"></th>
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "300px" }}
                            >
                                اسم المنتج
                            </th>
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "90px" }}
                            >
                                الكمية
                            </th>
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "140px" }}
                            >
                                العبوة
                            </th>
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "130px" }}
                            >
                                سعر الشراء
                            </th>
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "170px" }}
                            >
                                سعر البيع للصيدلية
                            </th>

                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "160px" }}
                            >
                                سعر البيع للزبون
                            </th>
                            <th className={classes.head} scope="col">
                                تاريخ انتهاء الصلاحية
                            </th>
                            <th
                                className={classes.head}
                                scope="col"
                                style={{ width: "135px" }}
                            >
                                الباقى( لو فاتورة باثر رجعى)
                            </th>
                            <th className={classes.head} scope="col"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.rows.map((row, i) => (
                            <tr key={i}>
                                <th className={classes.item} scope="row">
                                    {i + 1}
                                </th>

                                {/* اسم المنتج */}
                                <td className={classes.item}>
                                    <Select
                                        className={classes["no-margin"]}
                                        title="اسم المنتج"
                                        value={row.name}
                                        onchange={(val) =>
                                            handleRowChange(i, "name", val)
                                        }
                                        options={products.map((p) => ({
                                            value: p._id,
                                            label: p.name,
                                        }))}
                                        disabled={false}
                                    />
                                    {rowErrors[i]?.name && (
                                        <div className={classes.error}>
                                            {rowErrors[i].name}
                                        </div>
                                    )}
                                </td>

                                {/* الكمية */}
                                <td className={classes.item}>
                                    <TextInput
                                        className={classes["no-margin"]}
                                        type="number"
                                        placeholder="الكمية"
                                        label="الكمية"
                                        id={`quantity` + i}
                                        value={row.quantity}
                                        onchange={(val) =>
                                            handleRowChange(i, "quantity", val)
                                        }
                                        disabled={false}
                                    />
                                    {rowErrors[i]?.quantity && (
                                        <div className={classes.error}>
                                            {rowErrors[i].quantity}
                                        </div>
                                    )}
                                </td>

                                {/* العبوة */}
                                <td className={classes.item}>
                                    <Select
                                        className={classes["no-margin"]}
                                        title="العبوة"
                                        value={row.volume}
                                        onchange={(val) =>
                                            handleRowChange(i, "volume", val)
                                        }
                                        options={
                                            row.name
                                                ? products
                                                      .find(
                                                          (p) =>
                                                              p._id === row.name
                                                      )
                                                      ?.values.map((v) => ({
                                                          value: v.id,
                                                          label: v.name,
                                                      })) ?? []
                                                : []
                                        }
                                        disabled={!row.name}
                                    />
                                    {rowErrors[i]?.volume && (
                                        <div className={classes.error}>
                                            {rowErrors[i].volume}
                                        </div>
                                    )}
                                </td>

                                {/* سعر الشراء */}
                                <td className={classes.item}>
                                    <TextInput
                                        className={classes["no-margin"]}
                                        type="number"
                                        placeholder="سعر الشراء"
                                        label="سعر الشراء"
                                        id={`buy_price` + i}
                                        value={row["buy_price"]}
                                        onchange={(val) =>
                                            handleRowChange(i, "buy_price", val)
                                        }
                                        disabled={false}
                                    />
                                    {rowErrors[i]?.buy_price && (
                                        <div className={classes.error}>
                                            {rowErrors[i].buy_price}
                                        </div>
                                    )}
                                </td>

                                {/* سعر البيع للصيدلية */}
                                <td className={classes.item}>
                                    <TextInput
                                        className={classes["no-margin"]}
                                        type="number"
                                        placeholder="سعر البيع للصيدلية"
                                        label="سعر البيع للصيدلية"
                                        id={`phar_price` + i}
                                        value={row["phar_price"]}
                                        onchange={(val) =>
                                            handleRowChange(
                                                i,
                                                "phar_price",
                                                val
                                            )
                                        }
                                        disabled={false}
                                    />
                                    {rowErrors[i]?.phar_price && (
                                        <div className={classes.error}>
                                            {rowErrors[i].phar_price}
                                        </div>
                                    )}
                                </td>

                                {/* سعر البيع للزبون */}
                                <td className={classes.item}>
                                    <TextInput
                                        className={classes["no-margin"]}
                                        type="number"
                                        placeholder="سعر البيع للزبون"
                                        label="سعر البيع للزبون"
                                        id={`cust_price` + i}
                                        value={row["cust_price"]}
                                        onchange={(val) =>
                                            handleRowChange(
                                                i,
                                                "cust_price",
                                                val
                                            )
                                        }
                                        disabled={false}
                                    />
                                    {rowErrors[i]?.cust_price && (
                                        <div className={classes.error}>
                                            {rowErrors[i].cust_price}
                                        </div>
                                    )}
                                </td>

                                {/* تاريخ الصلاحية */}
                                <td className={classes.item}>
                                    <TextInput
                                        className={classes["no-margin"]}
                                        type="date"
                                        placeholder="تاريخ الانتهاء"
                                        label="تاريخ الانتهاء"
                                        id={`expiry_date_${i}`}
                                        value={row.expiry_date}
                                        onchange={(val) =>
                                            handleRowChange(
                                                i,
                                                "expiry_date",
                                                val
                                            )
                                        }
                                        disabled={false}
                                    />
                                </td>

                                {/* الباقي */}
                                <td className={classes.item}>
                                    <TextInput
                                        className={classes["no-margin"]}
                                        type="number"
                                        placeholder="الباقى"
                                        label="الباقى"
                                        id={`rest_${i}`}
                                        value={row["rest"]}
                                        onchange={(val) =>
                                            handleRowChange(i, "rest", val)
                                        }
                                        disabled={false}
                                    />
                                </td>

                                {/* أدوات التحكم */}
                                <td
                                    className={`${classes.item} ${classes.tools}`}
                                >
                                    {i === invoice.rows.length - 1 && (
                                        <IoMdAddCircle
                                            onClick={addRow}
                                            className={classes.add}
                                        />
                                    )}
                                    {invoice.rows.length > 1 &&
                                        i !== invoice.rows.length - 1 && (
                                            <MdDelete
                                                onClick={() => removeRow(i)}
                                                className={classes.remove}
                                            />
                                        )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
