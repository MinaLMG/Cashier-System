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

    // Add the handleEdit function
    const handleEdit = (invoice) => {
        if (props.onEdit) {
            props.onEdit(invoice);
        }
    };

    return (
        <div style={{ width: "70%", margin: "100px auto " }}>
            <table
                className={`table table-light table-hover table-bordered border-secondary ${classes.table}`}
            >
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">التاريخ</th>
                        <th scope="col">العميل</th>
                        <th scope="col">النوع</th>
                        <th scope="col">الإجمالي</th>
                        <th scope="col">الخصم</th>
                        <th scope="col">الصافي</th>
                        <th scope="col">التكلفة</th>
                        <th scope="col">الربح</th>
                        <th scope="col">العمليات</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.length === 0 ? (
                        <tr>
                            <td colSpan="10" className={classes.item}>
                                لا توجد فواتير بيع حتى الآن
                            </td>
                        </tr>
                    ) : (
                        invoices.map((invoice, index) => (
                            <tr key={invoice._id}>
                                <th scope="row">{index + 1}</th>
                                <td>{invoice.date}</td>
                                <td>
                                    {invoice.customer
                                        ? customers.find(
                                              (c) => c._id === invoice.customer
                                          )?.name || "غير معروف"
                                        : "بدون عميل"}
                                </td>
                                <td>
                                    {invoice.type === "walkin"
                                        ? "زبون"
                                        : "صيدلية"}
                                </td>
                                <td>
                                    {invoice.total_selling_price.toFixed(2)} ج.م
                                </td>
                                <td>{invoice.offer.toFixed(2)} ج.م</td>
                                <td>{invoice.final_amount.toFixed(2)} ج.م</td>
                                <td>
                                    {invoice.total_purchase_cost.toFixed(2)} ج.م
                                </td>
                                <td
                                    className={
                                        invoice.profit > 0
                                            ? "text-success"
                                            : "text-danger"
                                    }
                                >
                                    {invoice.profit.toFixed(2)} ج.م
                                </td>
                                <td>
                                    <div className="d-flex justify-content-around">
                                        <FaEdit
                                            className="text-primary"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => handleEdit(invoice)}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
