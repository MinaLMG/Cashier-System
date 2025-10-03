import classes from "./ShowPurchaseInvoices.module.css"; // reuse same styles
import commonStyles from "../../../styles/common.module.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaEye, FaPrint } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import SortableTable from "../../Basic/SortableTable";

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

    // Add the handleView function
    const handleView = (invoice) => {
        if (props.onView) {
            props.onView(invoice);
        }
    };

    // Define table columns
    const columns = [
        { key: "index", title: "#", sortable: false },
        { field: "date", title: "التاريخ" },
        { field: "customer", title: "العميل" },
        { field: "type", title: "النوع" },
        { field: "total_selling_price", title: "الإجمالي" },
        { field: "offer", title: "الخصم" },
        { field: "final_amount", title: "الصافي" },
        { field: "total_purchase_cost", title: "التكلفة" },
        { field: "profit", title: "الربح" },
        { key: "actions", title: "العمليات", sortable: false },
    ];

    // Render row function for the SortableTable
    const renderRow = (invoice, index) => {
        const customerName = invoice.customer
            ? customers.find((c) => c._id === invoice.customer)?.name
            : "--";

        const typeLabel = invoice.type === "walkin" ? "زبون" : "صيدلية";

        // Format date and time
        const formatDateTime = (dateString) => {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;

            // Format as DD/MM/YYYY HH:MM
            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");

            return `${day}/${month}/${year} ${hours}:${minutes}`;
        };

        return (
            <tr key={invoice._id}>
                <td>{index + 1}</td>
                <td>{formatDateTime(invoice.date)}</td>
                <td>{customerName}</td>
                <td>{typeLabel}</td>
                <td>{invoice.total_selling_price?.toFixed(2)} ج.م</td>
                <td>{invoice.offer?.toFixed(2)} ج.م</td>
                <td>{invoice.final_amount?.toFixed(2)} ج.م</td>
                <td>{invoice.total_purchase_cost?.toFixed(2)} ج.م</td>
                <td
                    style={{
                        color:
                            invoice.profit >= 0
                                ? "var(--success-color)"
                                : "var(--accent-red)",
                        fontWeight: "bold",
                    }}
                >
                    {invoice.profit?.toFixed(2)} ج.م
                </td>
                <td>
                    <div className="d-flex justify-content-around">
                        <FaEdit
                            className={classes.edit}
                            style={{
                                cursor: "pointer",
                                color: "var(--secondary-color)",
                            }}
                            onClick={() => handleEdit(invoice)}
                        />
                        <FaEye
                            className={classes.view}
                            style={{
                                cursor: "pointer",
                                color: "var(--text-color)",
                            }}
                            onClick={() => handleView(invoice)}
                        />
                        <FaPrint
                            className={`${classes.print} ${commonStyles.disabledIcon}`}
                            style={{ color: "var(--text-light)" }}
                            title="طباعة الفاتورة غير متاح حاليًا"
                        />
                        <MdDelete
                            className={`${classes.remove} ${commonStyles.disabledIcon}`}
                            style={{ color: "var(--text-light)" }}
                            title="حذف الفاتورة غير متاح حاليًا"
                        />
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div>
            <SortableTable
                columns={columns}
                data={invoices}
                initialSortField="date"
                initialSortDirection="desc"
                tableClassName={`table table-bordered ${classes.table}`}
                renderRow={renderRow}
                emptyMessage="لا توجد فواتير بيع حتى الآن"
            />
        </div>
    );
}
