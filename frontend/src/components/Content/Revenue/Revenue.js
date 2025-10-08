import React, { useState, useEffect } from "react";
import axios from "axios";
import DateTimeInput from "../../Basic/DateTimeInput";
import Button from "../../Basic/Button";
import { FaEdit } from "react-icons/fa";
import classes from "./Revenue.module.css";
import tableclasses from "../ShowInvoices/ShowPurchaseInvoices.module.css";
import SortableTable from "../../Basic/SortableTable";
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
    const [includeReturns, setIncludeReturns] = useState(true);

    // State for totals
    const [totals, setTotals] = useState({
        total_selling_price: 0,
        offer: 0,
        final_amount: 0,
        total_purchase_cost: 0,
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
            // Fetch both sales and return invoices
            const [salesResponse, returnResponse] = await Promise.all([
                axios.get(
                    `${process.env.REACT_APP_BACKEND}sales-invoices/full`
                ),
                includeReturns
                    ? axios.get(
                          `${process.env.REACT_APP_BACKEND}return-invoices/reports`
                      )
                    : Promise.resolve({ data: [] }),
            ]);

            // Combine both types of invoices
            const allInvoices = [...salesResponse.data, ...returnResponse.data];

            // Filter invoices by date range
            const filteredInvoices = allInvoices.filter((invoice) => {
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
                    acc.total_selling_price += invoice.total_selling_price || 0;
                    // Only add offer for sales invoices, not returns
                    if (invoice.type !== "return") {
                        acc.offer += invoice.offer || 0;
                    }
                    acc.final_amount += invoice.final_amount || 0;
                    acc.total_purchase_cost += invoice.total_purchase_cost || 0;
                    acc.profit += invoice.profit || 0;
                    return acc;
                },
                {
                    total_selling_price: 0,
                    offer: 0,
                    final_amount: 0,
                    total_purchase_cost: 0,
                    profit: 0,
                }
            );

            setTotals(newTotals);
        } catch (err) {
            console.error("Failed to fetch invoices:", err);
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
        <div
            className={classes.container}
            style={{
                width: "100%",
                margin: "100px auto",
                padding: "0 20px",
            }}
        >
            <h2
                className={classes.title}
                style={{
                    color: "var(--text-color)",
                    fontWeight: "bold",
                    fontSize: "var(--font-size-xl)",
                    textAlign: "center",
                    marginBottom: "2rem",
                }}
            >
                تقرير الإيرادات
            </h2>

            <div
                className={classes.periodSelector}
                style={{
                    backgroundColor: "var(--background-color)",
                    padding: "1.5rem",
                    borderRadius: "var(--border-radius-md)",
                    marginBottom: "2rem",
                    boxShadow: "var(--shadow-md)",
                    border: "2px solid var(--secondary-color)",
                }}
            >
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

                <div className={classes.options}>
                    <label className={classes.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={includeReturns}
                            onChange={(e) =>
                                setIncludeReturns(e.target.checked)
                            }
                        />
                        <span>تضمين فواتير الإرجاع</span>
                    </label>
                </div>

                <Button
                    content="عرض النتائج"
                    onClick={fetchInvoices}
                    className={classes.searchButton}
                    disabled={isLoading}
                    style={{
                        background:
                            "linear-gradient(135deg, var(--secondary-color), var(--secondary-light))",
                        border: "none",
                        color: "white",
                        padding: "12px 24px",
                        borderRadius: "var(--border-radius-md)",
                        fontWeight: "bold",
                        boxShadow: "var(--shadow-md)",
                        transition: "all 0.3s ease",
                    }}
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

                    <SortableTable
                        columns={[
                            {
                                key: "index",
                                title: "#",
                                sortable: false,
                                width: "50px",
                            },
                            {
                                field: "date",
                                title: "التاريخ",
                                width: "200px",
                            },
                            { field: "customer", title: "العميل" },
                            { field: "type", title: "النوع" },
                            { field: "total_selling_price", title: "الإجمالي" },
                            { field: "offer", title: "الخصم" },
                            { field: "final_amount", title: "الصافي" },
                            { field: "total_purchase_cost", title: "التكلفة" },
                            { field: "profit", title: "الربح" },
                            // {
                            //     key: "actions",
                            //     title: "العمليات",
                            //     sortable: false,
                            // },
                        ]}
                        data={invoices}
                        initialSortField="date"
                        initialSortDirection="desc"
                        tableClassName={`table table-bordered ${tableclasses.table}`}
                        renderRow={(invoice, index) => (
                            <tr key={invoice._id}>
                                <td className={tableclasses.item}>
                                    {index + 1}
                                </td>
                                <td className={tableclasses.item}>
                                    {invoice.date}
                                </td>
                                <td className={tableclasses.item}>
                                    {invoice.customer
                                        ? customers.find(
                                              (c) => c._id === invoice.customer
                                          )?.name || "--"
                                        : "بدون عميل"}
                                </td>
                                <td className={tableclasses.item}>
                                    {invoice.type === "return"
                                        ? "مرتجع"
                                        : invoice.type === "walkin"
                                        ? "زبون"
                                        : "صيدلية"}
                                </td>
                                <td className={tableclasses.item}>
                                    {invoice.total_selling_price.toFixed(2)} ج.م
                                </td>
                                <td className={tableclasses.item}>
                                    {invoice.type === "return"
                                        ? "--"
                                        : `${invoice.offer.toFixed(2)} ج.م`}
                                </td>
                                <td className={tableclasses.item}>
                                    {invoice.final_amount.toFixed(2)} ج.م
                                </td>
                                <td className={tableclasses.item}>
                                    {invoice.total_purchase_cost.toFixed(2)} ج.م
                                </td>
                                <td
                                    className={tableclasses.item}
                                    style={{
                                        color:
                                            invoice.profit >= 0
                                                ? "var(--success-color)"
                                                : "var(--accent-red)",
                                        fontWeight: "bold",
                                    }}
                                >
                                    {invoice.profit.toFixed(2)} ج.م
                                </td>
                                {/* <td className={tableclasses.item}>
                                    <div className="d-flex justify-content-around">
                                        <FaEdit
                                            onClick={() => handleEdit(invoice)}
                                            className={tableclasses.edit}
                                        />
                                    </div>
                                </td> */}
                            </tr>
                        )}
                        emptyMessage="لا توجد فواتير في هذه الفترة"
                        renderFooter={() =>
                            invoices.length > 0 && (
                                <tr
                                    style={{
                                        backgroundColor:
                                            "rgba(102, 126, 234, 0.1)",
                                    }}
                                >
                                    <td
                                        colSpan="4"
                                        className={tableclasses.item}
                                        style={{ textAlign: "center" }}
                                    >
                                        <strong>الإجمالي</strong>
                                    </td>
                                    <td className={tableclasses.item}>
                                        <strong>
                                            {totals.total_selling_price.toFixed(
                                                2
                                            )}{" "}
                                            ج.م
                                        </strong>
                                    </td>
                                    <td className={tableclasses.item}>
                                        <strong>
                                            {totals.offer.toFixed(2)} ج.م
                                        </strong>
                                    </td>
                                    <td className={tableclasses.item}>
                                        <strong>
                                            {totals.final_amount.toFixed(2)} ج.م
                                        </strong>
                                    </td>
                                    <td className={tableclasses.item}>
                                        <strong>
                                            {totals.total_purchase_cost.toFixed(
                                                2
                                            )}{" "}
                                            ج.م
                                        </strong>
                                    </td>
                                    <td
                                        className={tableclasses.item}
                                        style={{
                                            color:
                                                totals.profit >= 0
                                                    ? "var(--success-color)"
                                                    : "var(--accent-red)",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        <strong>
                                            {totals.profit.toFixed(2)} ج.م
                                        </strong>
                                    </td>
                                    {/* <td className={tableclasses.item}></td> */}
                                </tr>
                            )
                        }
                    />
                </>
            )}
        </div>
    );
}
