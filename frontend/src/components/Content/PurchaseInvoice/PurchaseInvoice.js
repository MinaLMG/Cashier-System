import { useEffect, useState } from "react";
import axios from "axios";
import TextInput from "../../Basic/TextInput";
import classes from "./PurchaseInvoice.module.css";
import Select from "../../Basic/Select";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import { IoMdAddCircle } from "react-icons/io";
export default function PurchaseInvoice() {
    const [suppliers, setSuppliers] = useState([]);
    const [volumes, setVolumes] = useState([]);
    const [products, setProducts] = useState([]);
    const [invoice, setInvoice] = useState({
        date: new Date(Date.now()).toISOString().split("T")[0],
        supplier: null,
        rows: [{}],
    });
    useEffect(() => {
        axios
            .get(process.env.REACT_APP_BACKEND + "suppliers")
            .then((res) => {
                console.log(res.data);
                setSuppliers(res.data);
            })
            .catch((err) => console.error("Failed to fetch suppliers:", err));
        axios
            .get(process.env.REACT_APP_BACKEND + "volumes")
            .then((res) => {
                console.log(res.data);
                setVolumes(res.data);
            })
            .catch((err) => console.error("Failed to fetch volumes:", err));
        axios
            .get(process.env.REACT_APP_BACKEND + "products/full")
            .then((res) => {
                console.log(res.data);
                setProducts(res.data);
            })
            .catch((err) => console.error("Failed to fetch products:", err));
    }, []);

    return (
        <div className={classes.container}>
            <div style={{ width: "10%", marginRight: "2.5%" }}>
                <TextInput
                    type="date"
                    placeholder="تاريخ الفاتورة"
                    label="تاريخ الفاتورة"
                    id={`date`}
                    value={invoice.date}
                    onchange={(e) => {
                        setInvoice((prev) => ({
                            ...prev,
                            date: e,
                        }));
                    }}
                    disabled={false}
                ></TextInput>
            </div>
            <div style={{ width: "50%", marginRight: "2.5%" }}>
                <Select
                    title="المورّد"
                    value={invoice.supplier}
                    onchange={(val) => {
                        setInvoice((prev) => ({ ...prev, supplier: val }));
                    }}
                    options={suppliers.map((s) => ({
                        value: s._id,
                        label: s.name,
                    }))}
                    disabled={false}
                />
            </div>
            <div style={{ width: "95%", margin: "20px auto " }}>
                <table
                    className={`table  table-light table-hover table-bordered border-secondary ${classes.table}`}
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
                        {invoice.rows.map((row, i) => {
                            return (
                                <tr key={i}>
                                    <th className={classes.item} scope="row">
                                        {i + 1}
                                    </th>
                                    <td className={classes.item}>
                                        <Select
                                            className={classes["no-margin"]}
                                            title="اسم المنتج"
                                            value={row.name}
                                            onchange={(val) => {}}
                                            options={products.map((p) => ({
                                                value: p._id,
                                                label: p.name,
                                            }))}
                                            disabled={false}
                                        />
                                    </td>
                                    <td className={classes.item}>
                                        <TextInput
                                            className={classes["no-margin"]}
                                            type="number"
                                            placeholder="الكمية"
                                            label="الكمية"
                                            id={`quantity` + i}
                                            value={row.quantity}
                                            onchange={() => {}}
                                            disabled={false}
                                        ></TextInput>
                                    </td>
                                    <td className={classes.item}>
                                        <Select
                                            className={classes["no-margin"]}
                                            title="العبوات"
                                            value={row.volume}
                                            onchange={(val) => {}}
                                            options={volumes.map((v) => ({
                                                value: v._id,
                                                label: v.name,
                                            }))}
                                            disabled={false}
                                        />
                                    </td>
                                    <td className={classes.item}>
                                        <TextInput
                                            className={classes["no-margin"]}
                                            type="number"
                                            placeholder="سعر الشراء"
                                            label="سعر الشراء"
                                            id={`buy_price` + i}
                                            value={row["buy_price"]}
                                            onchange={() => {}}
                                            disabled={false}
                                        ></TextInput>
                                    </td>
                                    <td className={classes.item}>
                                        <TextInput
                                            className={classes["no-margin"]}
                                            type="number"
                                            placeholder="سعر البع للصيدلة"
                                            label="سعر البيع للصيدلية"
                                            id={`phar_price` + i}
                                            value={row["phar_price"]}
                                            onchange={() => {}}
                                            disabled={false}
                                        ></TextInput>
                                    </td>
                                    <td className={classes.item}>
                                        <TextInput
                                            className={classes["no-margin"]}
                                            type="number"
                                            placeholder="سعر البيع للزبون"
                                            label="سعر البيع للزبون"
                                            id={`cust_price` + i}
                                            value={row.cust_price}
                                            onchange={() => {}}
                                            disabled={false}
                                        ></TextInput>
                                    </td>
                                    <td className={classes.item}>
                                        <TextInput
                                            className={classes["no-margin"]}
                                            type="date"
                                            placeholder="تاريخ الفاتورة"
                                            label="تاريخ الفاتورة"
                                            id={`date`}
                                            value={invoice.date}
                                            onchange={(e) => {
                                                setInvoice((prev) => ({
                                                    ...prev,
                                                    date: e,
                                                }));
                                            }}
                                            disabled={false}
                                        ></TextInput>
                                    </td>
                                    <td className={classes.item}>
                                        <TextInput
                                            className={classes["no-margin"]}
                                            type="number"
                                            placeholder="الباقى"
                                            label="الباقى"
                                            id={`rest` + i}
                                            value={row["rest"]}
                                            onchange={() => {}}
                                            disabled={false}
                                        ></TextInput>
                                    </td>
                                    <td
                                        className={`${classes.item} ${classes.tools}`}
                                    >
                                        <IoMdAddCircle
                                            onClick={() => {}}
                                            className={classes.add}
                                        />
                                        {/* <FaEdit
                                            onClick={() => {}}
                                            className={classes.edit}
                                        /> */}
                                        <MdDelete
                                            onClick={() => {}}
                                            className={`${classes.remove}`}
                                        />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
