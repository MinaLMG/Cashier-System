import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import DateTimeInput from "../../Basic/DateTimeInput";
import Button from "../../Basic/Button";
import tableclasses from "../ShowInvoices/ShowPurchaseInvoices.module.css";
import classes from "./SalesInvoice.module.css";

const PERIODS = ["daily", "weekly", "monthly", "custom"];

export default function CombinedInvoices() {
    const [periodType, setPeriodType] = useState("daily");
    const [startDate, setStartDate] = useState(new Date().toISOString());
    const [endDate, setEndDate] = useState(new Date().toISOString());
    const [items, setItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [volumes, setVolumes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [totals, setTotals] = useState({ value: 0 });

    // Fetch product options and volumes on mount
    useEffect(() => {
        const fetchRefs = async () => {
            try {
                const [prodRes, volRes] = await Promise.all([
                    axios.get(
                        `${process.env.REACT_APP_BACKEND}products/options`
                    ),
                    axios.get(`${process.env.REACT_APP_BACKEND}volumes`),
                ]);
                setProducts(prodRes.data || []);
                setVolumes(volRes.data || []);
            } catch (err) {
                console.error("Failed to load reference data", err);
                setError("تعذر تحميل بيانات المنتجات/العبوات");
            }
        };
        fetchRefs();
    }, []);

    // Helpers
    const productNameById = useMemo(() => {
        const map = {};
        products.forEach((p) => (map[p._id] = p.name));
        return map;
    }, [products]);

    const volumeNameById = useMemo(() => {
        const map = {};
        volumes.forEach((v) => (map[v._id] = v.name));
        return map;
    }, [volumes]);

    const clampDatesForPeriod = (type, base = new Date()) => {
        const end = new Date(base);
        const start = new Date(base);
        if (type === "weekly") {
            start.setDate(start.getDate() - 7);
        } else if (type === "monthly") {
            start.setMonth(start.getMonth() - 1);
        } else if (type === "daily") {
            // same day
        }
        return {
            start: start.toISOString(),
            end: end.toISOString(),
        };
    };

    // Period handlers
    const handlePeriodChange = (type) => {
        setPeriodType(type);
        if (type === "custom") {
            // keep current but ensure ISO with time
            const nowIso = new Date().toISOString();
            setStartDate(nowIso);
            setEndDate(nowIso);
            return;
        }
        const { start, end } = clampDatesForPeriod(type);
        setStartDate(start);
        setEndDate(end);
    };

    const handleStartChange = (val) => {
        setStartDate(val);
        if (periodType === "daily") {
            setEndDate(val);
        } else if (periodType === "weekly") {
            const start = new Date(val);
            const end = new Date(start);
            end.setDate(start.getDate() + 7);
            setEndDate(end.toISOString());
        } else if (periodType === "monthly") {
            const start = new Date(val);
            const end = new Date(start);
            end.setMonth(start.getMonth() + 1);
            setEndDate(end.toISOString());
        }
    };

    const handleEndChange = (val) => {
        setEndDate(val);
        if (periodType === "daily") {
            setStartDate(val);
        } else if (periodType === "weekly") {
            const end = new Date(val);
            const start = new Date(end);
            start.setDate(end.getDate() - 7);
            setStartDate(start.toISOString());
        } else if (periodType === "monthly") {
            const end = new Date(val);
            const start = new Date(end);
            start.setMonth(end.getMonth() - 1);
            setStartDate(start.toISOString());
        }
    };

    const fetchItems = async () => {
        setIsLoading(true);
        setError("");
        try {
            const [salesRes, returnsRes] = await Promise.all([
                axios.get(
                    `${process.env.REACT_APP_BACKEND}sales-invoices/full?size=5000&exclude_credit=false`
                ),
                axios.get(`${process.env.REACT_APP_BACKEND}return-invoices/full`),
            ]);

            const salesInvoices = salesRes.data?.items || [];
            const returnInvoices = returnsRes.data?.items || [];

            // Filter by date range
            const start = new Date(startDate);
            const end = new Date(endDate);
            // normalize range
            if (periodType !== "custom") {
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
            }

            const filterByDate = (inv) => {
                const d = new Date(inv.date);
                return d >= start && d <= end;
            };

            const filteredSales = salesInvoices.filter(filterByDate);
            const filteredReturns = returnInvoices.filter(filterByDate);

            // Flatten sales items + offers
            const flatSales = filteredSales.flatMap((inv) => {
                const rows = (inv.rows || []).map((r) => ({
                    kind: "item",
                    date: inv.date,
                    product: r.product,
                    volume: r.volume,
                    quantity: r.quantity,
                    v_price: r.v_price,
                    value: Number(r.quantity || 0) * Number(r.v_price || 0),
                    isCredit: inv.isCredit,
                }));
                const offerRows =
                    Number(inv.offer || 0) > 0
                        ? [
                              {
                                  kind: "offer",
                                  date: inv.date,
                                  product: null,
                                  volume: null,
                                  quantity: null,
                                  v_price: inv.offer,
                                  value: -Number(inv.offer || 0),
                                  isCredit: inv.isCredit,
                              },
                          ]
                        : [];
                return [...rows, ...offerRows];
            });

            // Flatten return items
            const flatReturns = filteredReturns.flatMap((inv) => {
                return (inv.items || []).map((item) => ({
                    kind: "return",
                    date: inv.date,
                    product: item.product?._id || item.product,
                    volume: item.volume?._id || item.volume,
                    quantity: item.quantity,
                    v_price: item.v_price,
                    // Return value is negative revenue
                    value: -Number(item.quantity || 0) * Number(item.v_price || 0), 
                    isCredit: false, // Returns are usually cash adjustments or balance adjustments, assume not credit for simple view or handle logic if needed
                }));
            });

            const allItems = [...flatSales, ...flatReturns];

            // Sort: date desc
            allItems.sort((a, b) => {
                const dateDiff = new Date(b.date) - new Date(a.date);
                if (dateDiff !== 0) return dateDiff;
                // returns after items?
                return 0;
            });

            const totalValue = allItems.reduce((sum, item) => {
                // Exclude credit items from total
                if (item.isCredit) return sum;
                return sum + Number(item.value || 0);
            }, 0);

            setItems(allItems);
            setTotals({ value: totalValue });
        } catch (err) {
            console.error("Failed to fetch combined invoices", err);
            setError("فشل في تحميل بيانات الفواتير المجمعة");
        } finally {
            setIsLoading(false);
        }
    };

    const formatDateTime = (iso) => {
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        return d.toLocaleString("ar-EG");
    };

    return (
        <div className={classes.container} style={{ padding: "0 20px" }}>
            <h2 className={classes.formTitle}>فواتير مجمعة</h2>

            <div className={classes.periodSelector}>
                <div className={classes.periodTypes}>
                    {PERIODS.map((p) => (
                        <label key={p} className={classes.periodTypeLabel}>
                            <input
                                type="radio"
                                name="periodType"
                                value={p}
                                checked={periodType === p}
                                onChange={() => handlePeriodChange(p)}
                            />
                            <span>
                                {p === "daily"
                                    ? "يومي"
                                    : p === "weekly"
                                    ? "أسبوعي"
                                    : p === "monthly"
                                    ? "شهري"
                                    : "مخصص"}
                            </span>
                        </label>
                    ))}
                </div>

                <div className={classes.dateInputs}>
                    <div className={classes.dateInput}>
                        <DateTimeInput
                            label="من تاريخ"
                            id="start-date"
                            value={startDate}
                            onchange={handleStartChange}
                            includeTime={periodType === "custom"}
                        />
                    </div>
                    <div className={classes.dateInput}>
                        <DateTimeInput
                            label="إلى تاريخ"
                            id="end-date"
                            value={endDate}
                            onchange={handleEndChange}
                            includeTime={periodType === "custom"}
                            disabled={periodType === "daily"}
                        />
                    </div>
                </div>

                <Button
                    content="عرض النتائج"
                    onClick={fetchItems}
                    disabled={isLoading}
                />
            </div>

            {error && <div className={classes.error}>{error}</div>}

            {isLoading ? (
                <div className={classes.loading}>جاري تحميل البيانات...</div>
            ) : (
                <div
                    className={`table-responsive ${tableclasses.tableWrapper}`}
                    style={{ marginTop: "20px" }}
                >
                    <table
                        className={`table table-bordered ${tableclasses.table}`}
                    >
                        <thead>
                            <tr>
                                <th className={tableclasses.head}>#</th>
                                <th className={tableclasses.head}>التاريخ</th>
                                <th className={tableclasses.head}>النوع</th>
                                <th className={tableclasses.head}>المنتج</th>
                                <th className={tableclasses.head}>العبوة</th>
                                <th className={tableclasses.head}>الكمية</th>
                                <th className={tableclasses.head}>
                                    سعر العبوة
                                </th>
                                <th className={tableclasses.head}>القيمة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="8"
                                        className={tableclasses.item}
                                        style={{ textAlign: "center" }}
                                    >
                                        لا توجد بيانات في هذه الفترة
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, idx) => (
                                    <tr key={`${item.kind}-${idx}`}>
                                        <td className={tableclasses.item}>
                                            {idx + 1}
                                        </td>
                                        <td className={tableclasses.item}>
                                            {formatDateTime(item.date)}
                                        </td>
                                        <td className={tableclasses.item}>
                                            {item.kind === "item"
                                                ? "عنصر"
                                                : item.kind === "return"
                                                ? "مرتجع"
                                                : "خصم"}
                                        </td>
                                        <td className={tableclasses.item}>
                                            {item.kind === "item" || item.kind === "return"
                                                ? productNameById[
                                                      item.product
                                                  ] || "--"
                                                : "--"}
                                        </td>
                                        <td className={tableclasses.item}>
                                            {item.kind === "item" || item.kind === "return"
                                                ? volumeNameById[item.volume] ||
                                                  "--"
                                                : "--"}
                                        </td>
                                        <td className={tableclasses.item}>
                                            {item.kind === "item" || item.kind === "return"
                                                ? item.quantity
                                                : "--"}
                                        </td>
                                        <td className={tableclasses.item}>
                                            {item.kind === "item"
                                                ? Number(
                                                      item.v_price || 0
                                                  ).toFixed(2)
                                                : Number(
                                                      item.v_price || 0
                                                  ).toFixed(2)}
                                        </td>
                                        <td
                                            className={tableclasses.item}
                                            style={{
                                                color: item.isCredit
                                                    ? "var(--text-color-secondary)" // Grey out for credit
                                                    : item.value >= 0
                                                    ? "var(--success-color)"
                                                    : "var(--accent-red)",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {Number(item.value || 0).toFixed(2)}{" "}
                                            ج.م
                                            {item.isCredit && (
                                                <span
                                                    style={{
                                                        marginRight: "5px",
                                                        fontSize: "0.8em",
                                                        backgroundColor:
                                                            "var(--warning-color)",
                                                        color: "#fff",
                                                        padding: "2px 5px",
                                                        borderRadius: "4px",
                                                    }}
                                                >
                                                    آجل
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {items.length > 0 && (
                            <tfoot>
                                <tr
                                    style={{
                                        backgroundColor:
                                            "rgba(102, 126, 234, 0.1)",
                                    }}
                                >
                                    <td
                                        colSpan="7"
                                        className={tableclasses.item}
                                        style={{ textAlign: "center" }}
                                    >
                                        <strong>إجمالي القيمة</strong>
                                    </td>
                                    <td
                                        className={tableclasses.item}
                                        style={{
                                            color:
                                                totals.value >= 0
                                                    ? "var(--success-color)"
                                                    : "var(--accent-red)",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        <strong>
                                            {Number(totals.value || 0).toFixed(
                                                2
                                            )}{" "}
                                            ج.م
                                        </strong>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            )}
        </div>
    );
}
