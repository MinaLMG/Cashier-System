import classes from "./ShowPurchaseInvoices.module.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import { FaEye } from "react-icons/fa";

export default function ShowPurchaseInvoices(props) {
    const [invoices, setInvoices] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    useEffect(() => {
        axios
            .get(process.env.REACT_APP_BACKEND + "purchase-invoices/full")
            .then((res) => {
                const sorted = res.data.sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                );
                setInvoices(sorted);
            })
            .catch((err) => console.error("Failed to fetch invoices:", err));

        axios
            .get(process.env.REACT_APP_BACKEND + "suppliers")
            .then((res) => {
                setSuppliers(res.data);
            })
            .catch((err) => console.error("Failed to fetch suppliers:", err));
    }, []);

    return (
        <div style={{ width: "70%", margin: "100px auto " }}>
            <table
                className={`table table-light table-hover table-bordered border-secondary ${classes.table}`}
            >
                <thead>
                    <tr>
                        <th className={classes.head}></th>
                        <th className={classes.head}>المورّد</th>
                        <th className={classes.head}>التاريخ</th>
                        <th className={classes.head}>الإجمالي</th>
                        <th
                            className={classes.head}
                            style={{ width: "220px" }}
                        ></th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.length === 0 ? (
                        <tr>
                            <td colSpan="5" className={classes.item}>
                                لا توجد فواتير شراء حتى الآن
                            </td>
                        </tr>
                    ) : (
                        invoices.map((inv, i) => (
                            <tr key={i}>
                                <th className={classes.item} scope="row">
                                    {i + 1}
                                </th>
                                <td className={classes.item}>
                                    {suppliers.find(
                                        (s) => s._id === inv.supplier
                                    )?.name || ""}
                                </td>
                                <td className={classes.item}>
                                    {
                                        inv.date
                                        // new Date(inv.date).toLocaleDateString(
                                        //     "ar-EG"
                                        // )
                                    }
                                </td>
                                <td className={classes.item}>
                                    {inv.total_cost}
                                </td>
                                <td className={classes.item}>
                                    <FaEye className={classes.view} />
                                    <FaEdit
                                        onClick={() => props.onEdit?.(inv)}
                                        className={classes.edit}
                                    />
                                    {/* <MdDelete
                                        onClick={() =>
                                            props.onDelete?.(inv._id)
                                        }
                                        className={classes.remove}
                                    /> */}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
