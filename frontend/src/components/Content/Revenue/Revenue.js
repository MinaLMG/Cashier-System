import React, { useState, useEffect } from "react";
import axios from "axios";
import DateTimeInput from "../../Basic/DateTimeInput";
import Button from "../../Basic/Button";
import { FaEdit } from "react-icons/fa";
import classes from "./Revenue.module.css";
import { addMonths, startOfMonth, startOfYear } from "date-fns";

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

    // Handle period type change
    const handlePeriodTypeChange = (type) => {
        setPeriodType(type);

        const today = new Date();
        // Always set end date to today for all period types
        const todayStr = today.toISOString().split("T")[0];
        setEndDate(todayStr);

        if (type === "daily") {
            // For daily, set start date to today as well
            setStartDate(todayStr);
        } else if (type === "monthly") {
            // For monthly, set start date to one month ago from today
            const oneMonthAgo = addMonths(today, -1);
            setStartDate(oneMonthAgo.toISOString().split("T")[0]);
        } else if (type === "yearly") {
            // For yearly, set start date to one year ago from today
            const oneYearAgo = addMonths(today, -12);
            setStartDate(oneYearAgo.toISOString().split("T")[0]);
        } else if (type === "custom") {
            // For custom, default to today for both
            setStartDate(todayStr);
        }
    };

    // Handle date changes
    const handleStartDateChange = (date) => {
        setStartDate(date);

        // Update end date based on period type to maintain duration
        if (periodType === "daily") {
            // For daily, end date is always the same as start date
            setEndDate(date);
        } else if (periodType === "monthly") {
            // For monthly, set end date to one month after start date
            const startDateObj = new Date(date);
            const endDateObj = addMonths(startDateObj, 1);
            setEndDate(endDateObj.toISOString().split("T")[0]);
        } else if (periodType === "yearly") {
            // For yearly, set end date to one year after start date
            const startDateObj = new Date(date);
            const endDateObj = addMonths(startDateObj, 12);
            setEndDate(endDateObj.toISOString().split("T")[0]);
        } else if (
            periodType === "custom" &&
            new Date(endDate) < new Date(date)
        ) {
            // If custom period and end date is before start date, update end date
            setEndDate(date);
        }
    };

    const handleEndDateChange = (date) => {
        setEndDate(date);

        // Update start date based on period type to maintain duration
        if (periodType === "daily") {
            // For daily, start date is always the same as end date
            setStartDate(date);
        } else if (periodType === "monthly") {
            // For monthly, set start date to one month before end date
            const endDateObj = new Date(date);
            const startDateObj = addMonths(endDateObj, -1);
            setStartDate(startDateObj.toISOString().split("T")[0]);
        } else if (periodType === "yearly") {
            // For yearly, set start date to one year before end date
            const endDateObj = new Date(date);
            const startDateObj = addMonths(endDateObj, -12);
            setStartDate(startDateObj.toISOString().split("T")[0]);
        }
        // For custom, we don't automatically update start date
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

    // Add this function to format dates for display
    const formatDateForDisplay = (dateString) => {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        // Format as DD/MM/YYYY
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
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
                        <DateTimeInput
                            label="من تاريخ"
                            id="start-date"
                            value={startDate}
                            onchange={handleStartDateChange}
                            includeTime={false}
                        />
                    </div>

                    {periodType !== "daily" && (
                        <div className={classes.dateInput}>
                            <DateTimeInput
                                label="إلى تاريخ"
                                id="end-date"
                                value={endDate}
                                onchange={handleEndDateChange}
                                includeTime={false}
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
                            نتائج الفترة من {formatDateForDisplay(startDate)}{" "}
                            إلى {formatDateForDisplay(endDate)}
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
