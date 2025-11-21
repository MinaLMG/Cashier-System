import classes from "./ShowPurchaseInvoices.module.css";
import commonStyles from "../../../styles/common.module.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaEye, FaPrint } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import SortableTable from "../../Basic/SortableTable";
import Pagination from "../../Basic/Pagination";

export default function ShowPurchaseInvoices(props) {
    const [invoices, setInvoices] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(50);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchInvoices = async (currentPage) => {
        try {
            setLoading(true);
            const offset = (currentPage - 1) * pageSize;
            const res = await axios.get(
                `${process.env.REACT_APP_BACKEND}purchase-invoices/full`,
                {
                    params: {
                        offset,
                        size: pageSize,
                    },
                }
            );
            setInvoices(res.data.items || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error("Failed to fetch invoices:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices(page);

        axios
            .get(process.env.REACT_APP_BACKEND + "suppliers")
            .then((res) => {
                setSuppliers(res.data);
            })
            .catch((err) => console.error("Failed to fetch suppliers:", err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchInvoices(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    const handleView = (invoice) => {
        if (props.onView) {
            props.onView(invoice);
        }
    };

    // Define table columns
    const columns = [
        { key: "index", title: "#", sortable: false },
        { field: "date", title: "التاريخ" },
        { field: "supplier", title: "المورد" },
        { field: "total_cost", title: "الإجمالي" },
        { key: "actions", title: "العمليات", sortable: false },
    ];

    // Render row function for the SortableTable
    const renderRow = (invoice, index) => {
        const supplierName = invoice.supplier
            ? suppliers.find((s) => s._id === invoice.supplier)?.name
            : "--";

        return (
            <tr key={invoice._id}>
                <td className={classes.item}>{index + 1}</td>
                <td className={classes.item}>{invoice.date}</td>
                <td className={classes.item}>{supplierName}</td>
                <td className={classes.item}>
                    {invoice.total_cost?.toFixed(2)} ج.م
                </td>
                <td className={classes.item}>
                    <div className="d-flex justify-content-around">
                        <FaEdit
                            onClick={() => props.onEdit?.(invoice)}
                            className={classes.edit}
                        />
                        <FaEye
                            onClick={() => handleView(invoice)}
                            className={classes.view}
                        />
                        <FaPrint
                            className={`${classes.print} ${commonStyles.disabledIcon}`}
                            title="طباعة الفاتورة غير متاح حاليًا"
                        />
                        <MdDelete
                            className={`${classes.remove} ${commonStyles.disabledIcon}`}
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
                emptyMessage={
                    loading
                        ? "جاري تحميل الفواتير..."
                        : "لا توجد فواتير مشتريات حتى الآن"
                }
            />
            <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={setPage}
            />
        </div>
    );
}
