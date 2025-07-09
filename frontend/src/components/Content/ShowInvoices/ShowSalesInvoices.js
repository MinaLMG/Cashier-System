import classes from "./ShowPurchaseInvoices.module.css"; // reuse same styles
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaEye } from "react-icons/fa";
import { MdDelete } from "react-icons/md";

export default function ShowSalesInvoices(props) {
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        axios
            .get(process.env.REACT_APP_BACKEND + "sales-invoices/full")
            .then((res) => {
                const sorted = res.data.sort(
                    (a, b) => new Date(b.date) - new Date(a.date)
                );
                setInvoices(sorted);
            })
            .catch((err) =>
                console.error("Failed to fetch sales invoices:", err)
            );

        axios
            .get(process.env.REACT_APP_BACKEND + "customers")
            .then((res) => {
                setCustomers(res.data);
            })
            .catch((err) => console.error("Failed to fetch customers:", err));
    }, []);

    return (
        <div style={{ width: "70%", margin: "100px auto " }}>
            <table
                className={`table table-light table-hover table-bordered border-secondary ${classes.table}`}
            >
                <thead>
                    <tr>
                        <th className={classes.head}></th>
                        <th className={classes.head}>العميل</th>
                        <th className={classes.head}>النوع</th>
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
                            <td colSpan="6" className={classes.item}>
                                لا توجد فواتير بيع حتى الآن
                            </td>
                        </tr>
                    ) : (
                        invoices.map((inv, i) => (
                            <tr key={i}>
                                <th className={classes.item} scope="row">
                                    {i + 1}
                                </th>
                                <td className={classes.item}>
                                    {customers.find(
                                        (c) => c._id === inv.customer
                                    )?.name || "--"}
                                </td>
                                <td className={classes.item}>
                                    {inv.type === "walkin" ? "جمهور" : "صيدلية"}
                                </td>
                                <td className={classes.item}>{inv.date}</td>
                                <td className={classes.item}>
                                    {inv.finalTotal}
                                </td>
                                <td className={classes.item}>
                                    <FaEye className={classes.view} />
                                    <FaEdit
                                        // onClick={() => props.onEdit?.(inv)}
                                        className={classes.edit}
                                    />
                                    {/* <MdDelete
                                        onClick={() => props.onDelete?.(inv._id)}
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
