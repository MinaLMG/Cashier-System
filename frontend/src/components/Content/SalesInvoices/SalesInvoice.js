// SalesInvoice.js
import { useEffect, useState } from "react";
import Button from "../../Basic/Button";
import TextInput from "../../Basic/TextInput";
import Select from "../../Basic/Select";
import SalesInvoiceRow from "./SalesInvoiceRow";
import classes from "./SalesInvoice.module.css";
import axios from "axios";

export default function SalesInvoice() {
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [invoice, setInvoice] = useState({
        customer: "",
        type: "walk-in",
        date: new Date().toISOString().split("T")[0],
        offer: 0,
        rows: [{ barcode: "", product: "", volume: "", quantity: "" }],
    });
    const [rowErrors, setRowErrors] = useState([]);
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

    const handleRowChange = (index, key, value) => {
        const updatedRows = [...invoice.rows];
        updatedRows[index][key] = value;

        const updatedErrors = [...rowErrors];
        const newErrors = {};

        if (key === "product" && !value)
            newErrors.product = "الرجاء اختيار منتج";
        else newErrors.product = "";
        if (key === "volume" && !value) newErrors.volume = "الرجاء اختيار عبوة";
        else newErrors.volume = "";

        if (key === "quantity" && (!value || Number(value) <= 0))
            newErrors.quantity = "الكمية غير صحيحة";
        else newErrors.quantity = "";
        updatedErrors[index] = {
            ...updatedErrors[index],
            ...newErrors,
        };

        setInvoice((prev) => ({
            ...prev,
            rows: updatedRows,
        }));

        setRowErrors(updatedErrors);
    };

    const validateRows = () => {
        const errors = invoice.rows.map((row) => {
            const err = {};
            if (!row.product) err.product = "الرجاء اختيار منتج";
            if (!row.volume) err.volume = "الرجاء اختيار عبوة";
            if (!row.quantity || Number(row.quantity) <= 0)
                err.quantity = "الكمية غير صحيحة";
            return err;
        });

        setRowErrors(errors);

        return errors.every((err) => Object.keys(err).length === 0);
    };

    const addRow = () => {
        if (!validateRows()) return;

        setInvoice((prev) => ({
            ...prev,
            rows: [
                ...prev.rows,
                { barcode: "", product: "", volume: "", quantity: "" },
            ],
        }));
    };

    const removeRow = (index) => {
        // #TODO
    };

    const calculateTotal = () => {
        let total = 0;
        for (const row of invoice.rows) {
            const product = products.find((p) => p._id === row.product);
            const price =
                invoice.type === "walk-in"
                    ? product?.walkin_price
                    : product?.pharmacy_price;
            const q = Number(row.quantity);
            const p = Number(price);
            total += isNaN(q) || isNaN(p) ? 0 : q * p;
        }
        return total;
    };

    const finalTotal = calculateTotal() - Number(invoice.offer || 0);

    const handleSubmit = () => {
        const invoiceData = {
            ...invoice,
            total: calculateTotal(),
            finalTotal,
        };
        console.log("Submit Invoice:", invoiceData);
        // send to server if needed
    };

    return (
        <div className={classes.container}>
            <h2>فاتورة بيع</h2>

            {/* Supplier and Date */}
            <div style={{ display: "flex", margin: "20px 0" }}>
                <div style={{ width: "10%", marginRight: "2.5%" }}>
                    <TextInput
                        type="date"
                        label="تاريخ الفاتورة"
                        value={invoice.date}
                        onchange={(e) =>
                            setInvoice((prev) => ({ ...prev, date: e }))
                        }
                    />
                </div>
                <div style={{ width: "50%", marginRight: "2.5%" }}>
                    <Select
                        title="العميل"
                        value={invoice.customer}
                        onchange={(val) => {
                            const customerType = customers.find(
                                (c) => c._id === val
                            )?.type;
                            console.log(val);
                            setInvoice((prev) => ({
                                ...prev,
                                customer: val,
                                type:
                                    customerType === "walk-in"
                                        ? "walk-in"
                                        : "pharmacy",
                            }));
                        }}
                        options={customers.map((c) => ({
                            value: c._id,
                            label: c.name,
                        }))}
                    />
                </div>
            </div>
            <div style={{ width: "50%", marginRight: "2.5%" }}>
                <Select
                    title="نوع العميل"
                    value={
                        invoice.type === "walk-in"
                            ? "جمهور"
                            : invoice.type === "pharmacy"
                            ? "صيدلية"
                            : ""
                    }
                    disabled={invoice.customer}
                    onchange={(e) =>
                        setInvoice((prev) => ({ ...prev, type: e }))
                    }
                    options={[
                        { value: "صيدلية", label: "صيدلية" },
                        { value: "جمهور", label: "جمهور" },
                    ]}
                />
            </div>

            {/* Table */}
            <table
                className={`table table-light table-hover table-bordered border-secondary ${classes.table}`}
            >
                <thead>
                    <tr>
                        <th>#</th>
                        <th>المنتج</th>
                        <th>العبوة</th>
                        <th>الكمية</th>
                        <th>السعر</th>
                        <th>الإجمالي</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {invoice.rows.map((row, i) => (
                        <SalesInvoiceRow
                            key={i}
                            row={row}
                            index={i}
                            onChange={handleRowChange}
                            onRemove={removeRow}
                            onAdd={addRow}
                            isLastRow={i === invoice.rows.length - 1}
                            canRemove={
                                invoice.rows.length > 1 &&
                                i !== invoice.rows.length - 1
                            }
                            products={products}
                            salesType={invoice.type}
                            errors={rowErrors}
                        />
                    ))}

                    <tr>
                        <td colSpan={6}>
                            <TextInput
                                type="number"
                                label="خصم"
                                value={invoice.offer}
                                onchange={(val) =>
                                    setInvoice((prev) => ({
                                        ...prev,
                                        offer: val,
                                    }))
                                }
                            />
                        </td>
                        <td>
                            <strong>{finalTotal.toFixed(2)} ج.م</strong>
                        </td>
                    </tr>
                </tbody>
            </table>

            <Button content="حفظ الفاتورة" onClick={handleSubmit} />
        </div>
    );
}
