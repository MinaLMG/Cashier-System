import React, { useState, useEffect } from "react";
import axios from "axios";
import TextInput from "../../Basic/TextInput";
import Button from "../../Basic/Button";
import { FaEdit } from "react-icons/fa";
import classes from "./Revenue.module.css";

export default function Revenue(props) {
    // State for period selection
    const [periodType, setPeriodType] = useState("daily");

    // State for date range
    const [startDate, setStartDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [endDate, setEndDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    // State for data
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    // State for totals
    const [totals, setTotals] = useState({
        total: 0,
        offer: 0,
        finalTotal: 0,
        base: 0,
        profit: 0,
    });

    // Fetch customers on component mount
    useEffect(() => {
        axios
            .get(process.env.REACT_APP_BACKEND + "customers")
            .then((res) => {
                setCustomers(res.data);
            })
            .catch((err) => {
                console.error("Failed to fetch customers:", err);
                setError("فشل في تحميل بيانات العملاء");
            });
    }, []);

    // Update end date when period type or start date changes
    useEffect(() => {
        if (periodType === "daily") {
            setEndDate(startDate);
        } else if (periodType === "monthly") {
            const start = new Date(startDate);
            const end = new Date(start);
            end.setMonth(start.getMonth() + 1);
            end.setDate(end.getDate() - 1);
            setEndDate(end.toISOString().split("T")[0]);
        } else if (periodType === "yearly") {
            const start = new Date(startDate);
            const end = new Date(start);
            end.setFullYear(start.getFullYear() + 1);
            end.setDate(end.getDate() - 1);
            setEndDate(end.toISOString().split("T")[0]);
        }
        // For custom period, we don't update the end date automatically
    }, [periodType, startDate]);

    // Handle period type change
    const handlePeriodTypeChange = (type) => {
        setPeriodType(type);

        // Reset dates to today when changing period type
        const today = new Date().toISOString().split("T")[0];
        setStartDate(today);

        // End date will be updated by the useEffect
    };

    // Handle date changes
    const handleStartDateChange = (date) => {
        setStartDate(date);

        // If custom period and end date is before start date, update end date
        if (periodType === "custom" && new Date(endDate) < new Date(date)) {
            setEndDate(date);
        }
    };

    const handleEndDateChange = (date) => {
        // Only allow end date changes in custom period
        if (periodType === "custom") {
            setEndDate(date);
        }
    };

    // Fetch invoices for the selected period
    const fetchInvoices = async () => {
        setIsLoading(true);
        setError("");

        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND}sales-invoices/full`
            );

            // Filter invoices by date range
            const filteredInvoices = response.data.filter((invoice) => {
                const invoiceDate = new Date(invoice.date);
                const start = new Date(startDate);
                const end = new Date(endDate);

                // Set hours to ensure proper comparison
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);

                return invoiceDate >= start && invoiceDate <= end;
            });

            // Sort by date (newest first)
            const sortedInvoices = filteredInvoices.sort(
                (a, b) => new Date(b.date) - new Date(a.date)
            );

            setInvoices(sortedInvoices);

            // Calculate totals
            const newTotals = sortedInvoices.reduce(
                (acc, invoice) => {
                    acc.total += invoice.total || 0;
                    acc.offer += invoice.offer || 0;
                    acc.finalTotal += invoice.finalTotal || 0;
                    acc.base += invoice.base || 0;
                    acc.profit += invoice.profit || 0;
                    return acc;
                },
                { total: 0, offer: 0, finalTotal: 0, base: 0, profit: 0 }
            );

            setTotals(newTotals);
        } catch (err) {
            console.error("Failed to fetch sales invoices:", err);
            setError("فشل في تحميل بيانات الفواتير");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle edit invoice
    const handleEdit = (invoice) => {
        if (props.onEdit) {
            props.onEdit(invoice);
        }
    };

    return (
        <div className={classes.container}>
            <h2 className={classes.title}>تقرير الإيرادات</h2>

            <div className={classes.periodSelector}>
                <div className={classes.periodTypes}>
                    <label className={classes.periodTypeLabel}>
                        <input
                            type="radio"
                            name="periodType"
                            value="daily"
                            checked={periodType === "daily"}
                            onChange={() => handlePeriodTypeChange("daily")}
                        />
                        <span>يومي</span>
                    </label>

                    <label className={classes.periodTypeLabel}>
                        <input
                            type="radio"
                            name="periodType"
                            value="monthly"
                            checked={periodType === "monthly"}
                            onChange={() => handlePeriodTypeChange("monthly")}
                        />
                        <span>شهري</span>
                    </label>

                    <label className={classes.periodTypeLabel}>
                        <input
                            type="radio"
                            name="periodType"
                            value="yearly"
                            checked={periodType === "yearly"}
                            onChange={() => handlePeriodTypeChange("yearly")}
                        />
                        <span>سنوي</span>
                    </label>

                    <label className={classes.periodTypeLabel}>
                        <input
                            type="radio"
                            name="periodType"
                            value="custom"
                            checked={periodType === "custom"}
                            onChange={() => handlePeriodTypeChange("custom")}
                        />
                        <span>مخصص</span>
                    </label>
                </div>

                <div className={classes.dateInputs}>
                    <div className={classes.dateInput}>
                        <TextInput
                            type="date"
                            label="من تاريخ"
                            id="start-date"
                            value={startDate}
                            onchange={handleStartDateChange}
                        />
                    </div>

                    {periodType !== "daily" && (
                        <div className={classes.dateInput}>
                            <TextInput
                                type="date"
                                label="إلى تاريخ"
                                id="end-date"
                                value={endDate}
                                onchange={handleEndDateChange}
                                disabled={periodType !== "custom"}
                            />
                        </div>
                    )}
                </div>

                <Button
                    content="عرض النتائج"
                    onClick={fetchInvoices}
                    className={classes.searchButton}
                    disabled={isLoading}
                />
            </div>

            {error && <div className={classes.error}>{error}</div>}

            {isLoading ? (
                <div className={classes.loading}>جاري تحميل البيانات...</div>
            ) : (
                <>
                    <div className={classes.resultsInfo}>
                        <h3>
                            نتائج الفترة من {startDate} إلى {endDate}
                        </h3>
                        <p>عدد الفواتير: {invoices.length}</p>
                    </div>

                    <div className={classes.tableContainer}>
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
                                        <td
                                            colSpan="10"
                                            className={classes.noData}
                                        >
                                            لا توجد فواتير في هذه الفترة
                                        </td>
                                    </tr>
                                ) : (
                                    <>
                                        {invoices.map((invoice, index) => (
                                            <tr key={invoice._id}>
                                                <th scope="row">{index + 1}</th>
                                                <td>{invoice.date}</td>
                                                <td>
                                                    {invoice.customer
                                                        ? customers.find(
                                                              (c) =>
                                                                  c._id ===
                                                                  invoice.customer
                                                          )?.name || "غير معروف"
                                                        : "بدون عميل"}
                                                </td>
                                                <td>
                                                    {invoice.type === "walkin"
                                                        ? "زبون"
                                                        : "صيدلية"}
                                                </td>
                                                <td>
                                                    {invoice.total.toFixed(2)}{" "}
                                                    ج.م
                                                </td>
                                                <td>
                                                    {invoice.offer.toFixed(2)}{" "}
                                                    ج.م
                                                </td>
                                                <td>
                                                    {invoice.finalTotal.toFixed(
                                                        2
                                                    )}{" "}
                                                    ج.م
                                                </td>
                                                <td>
                                                    {invoice.base.toFixed(2)}{" "}
                                                    ج.م
                                                </td>
                                                <td
                                                    className={
                                                        invoice.profit > 0
                                                            ? "text-success"
                                                            : "text-danger"
                                                    }
                                                >
                                                    {invoice.profit.toFixed(2)}{" "}
                                                    ج.م
                                                </td>
                                                <td>
                                                    <div className="d-flex justify-content-around">
                                                        <FaEdit
                                                            className="text-primary"
                                                            style={{
                                                                cursor: "pointer",
                                                            }}
                                                            onClick={() =>
                                                                handleEdit(
                                                                    invoice
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Totals row */}
                                        <tr className={classes.totalsRow}>
                                            <td
                                                colSpan="4"
                                                className={classes.totalsLabel}
                                            >
                                                <strong>الإجمالي</strong>
                                            </td>
                                            <td>
                                                <strong>
                                                    {totals.total.toFixed(2)}{" "}
                                                    ج.م
                                                </strong>
                                            </td>
                                            <td>
                                                <strong>
                                                    {totals.offer.toFixed(2)}{" "}
                                                    ج.م
                                                </strong>
                                            </td>
                                            <td>
                                                <strong>
                                                    {totals.finalTotal.toFixed(
                                                        2
                                                    )}{" "}
                                                    ج.م
                                                </strong>
                                            </td>
                                            <td>
                                                <strong>
                                                    {totals.base.toFixed(2)} ج.م
                                                </strong>
                                            </td>
                                            <td
                                                className={
                                                    totals.profit > 0
                                                        ? "text-success"
                                                        : "text-danger"
                                                }
                                            >
                                                <strong>
                                                    {totals.profit.toFixed(2)}{" "}
                                                    ج.م
                                                </strong>
                                            </td>
                                            <td></td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
