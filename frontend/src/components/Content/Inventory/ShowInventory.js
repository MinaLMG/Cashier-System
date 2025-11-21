import classes from "./ShowInventory.module.css";
import commonStyles from "../../../styles/common.module.css";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaEdit, FaPrint } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import SortableTable from "../../Basic/SortableTable";
import PrintBarcodeModal from "./PrintBarcodeModal";
import TextInput from "../../Basic/TextInput";

export default function ShowInventory(props) {
    const [inventory, setInventory] = useState([]);
    const [total, setTotal] = useState(0);
    const [searchInput, setSearchInput] = useState("");
    const [appliedPattern, setAppliedPattern] = useState("");
    const [printModal, setPrintModal] = useState({
        show: false,
        barcode: null,
        volumeName: null,
    });

    const pageSize = 50;
    const [page, setPage] = useState(1);

    const fetchInventory = useCallback(async () => {
        try {
            const params = {
                offset: (page - 1) * pageSize,
                size: pageSize,
            };
            if (appliedPattern.trim()) {
                params.search = appliedPattern.trim();
            }

            const res = await axios.get(
                process.env.REACT_APP_BACKEND + "products/full",
                { params }
            );

            if (Array.isArray(res.data)) {
                // Fallback to old shape if backend returns plain array
                setInventory(res.data);
                setTotal(res.data.length);
            } else {
                setInventory(res.data.items || []);
                setTotal(res.data.total || 0);
            }
        } catch (err) {
            console.error("Failed to fetch inventory:", err);
        }
    }, [appliedPattern, page]);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handlePrintBarcode = (barcode, volumeName) => {
        setPrintModal({
            show: true,
            barcode: barcode,
            volumeName: volumeName,
        });
    };

    const handleClosePrintModal = () => {
        setPrintModal({
            show: false,
            barcode: null,
            volumeName: null,
        });
    };

    const handlePrintSuccess = () => {
        // Optionally refresh inventory or show success message
        console.log("Barcode printed successfully");
    };

    return (
        <div style={{ width: "90%", maxWidth: "1200px", margin: "100px auto" }}>
            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    marginBottom: "12px",
                    justifyContent: "center",
                }}
            >
                <TextInput
                    type="text"
                    placeholder="ابحث باسم المنتج (استخدم * كـ wildcard، مثلاً *ل*k)"
                    label="بحث فى المنتجات"
                    id="inventory-search"
                    value={searchInput}
                    onchange={(val) => setSearchInput(val)}
                    width="100%"
                />
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                        setPage(1);
                        setAppliedPattern(searchInput);
                    }}
                    style={{ whiteSpace: "nowrap" }}
                >
                    بحث
                </button>
            </div>
            <SortableTable
                columns={[
                    { key: "index", title: "#", sortable: false },
                    { field: "name", title: "اسم المنتج" },
                    { key: "volumes", title: "العبوات", sortable: false },
                    { field: "total_remaining", title: "الباقى حاليا" },
                    {
                        field: "min_stock",
                        title: "مش عاوزينها تقل عن",
                        sortable: false,
                    },
                    { key: "actions", title: "الإجراءات", sortable: false },
                ]}
                data={inventory}
                initialSortField="name"
                initialSortDirection="asc"
                tableClassName={`table table-bordered ${classes.table}`}
                renderRow={(inv, index) => {
                    inv.values.sort((a, b) => a.val - b.val);
                    return (
                        <tr key={inv._id || index}>
                            <td className={classes.item}>{index + 1}</td>
                            <td className={classes.item}>{inv.name}</td>
                            <td className={classes.item}>
                                {inv.values.map((v, di) => (
                                    <div key={di} className={classes.volumeRow}>
                                        <span>
                                            {v.name} : {v.val}
                                        </span>
                                        {v.barcode && (
                                            <FaPrint
                                                className={classes.printIcon}
                                                onClick={() =>
                                                    handlePrintBarcode(
                                                        v.barcode,
                                                        v.name
                                                    )
                                                }
                                                title="طباعة الباركود"
                                            />
                                        )}
                                    </div>
                                ))}
                            </td>
                            <td className={classes.item}>
                                {inv.total_remaining}
                            </td>
                            <td className={classes.item}>
                                {inv["min-stock"] ? inv["min-stock"] : ""}
                            </td>
                            <td className={classes.item}>
                                <div className={classes.actionsContainer}>
                                    <FaEdit
                                        onClick={() => {
                                            props.onEdit(inv);
                                        }}
                                        className={classes.edit}
                                        title="تعديل"
                                    />
                                    <MdDelete
                                        className={`${classes.remove} ${commonStyles.disabledIcon}`}
                                        title="حذف المنتج غير متاح حاليًا"
                                    />
                                </div>
                            </td>
                        </tr>
                    );
                }}
                emptyMessage="لا توجد بضاعة شراء حتى الآن"
            />
            {/* Pagination controls */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "12px",
                    gap: "8px",
                    flexWrap: "wrap",
                }}
            >
                <div>
                    {total > 0 && (
                        <span>
                            عرض {Math.min((page - 1) * pageSize + 1, total)}-
                            {Math.min(page * pageSize, total)} من {total}
                        </span>
                    )}
                </div>
                <div
                    style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={page <= 1}
                        onClick={() => setPage(1)}
                    >
                        الأولى
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        السابق
                    </button>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <span>صفحة</span>
                        <input
                            type="number"
                            min={1}
                            max={total > 0 ? Math.ceil(total / pageSize) : 1}
                            value={page}
                            onChange={(e) => {
                                const raw = e.target.value;
                                const num = parseInt(raw, 10);
                                const totalPages =
                                    total > 0 ? Math.ceil(total / pageSize) : 1;
                                if (Number.isNaN(num)) {
                                    setPage(1);
                                } else {
                                    const clamped = Math.min(
                                        Math.max(num, 1),
                                        totalPages || 1
                                    );
                                    setPage(clamped);
                                }
                            }}
                            style={{
                                width: "60px",
                                textAlign: "center",
                            }}
                            className="form-control form-control-sm"
                        />
                        <span>
                            من {total > 0 ? Math.ceil(total / pageSize) : 1}
                        </span>
                    </div>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={
                            page >= Math.ceil(total / pageSize) || total === 0
                        }
                        onClick={() =>
                            setPage((p) =>
                                Math.min(
                                    Math.ceil(total / pageSize) || 1,
                                    p + 1
                                )
                            )
                        }
                    >
                        التالى
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={
                            page >= Math.ceil(total / pageSize) || total === 0
                        }
                        onClick={() =>
                            setPage(Math.ceil(total / pageSize) || 1)
                        }
                    >
                        الأخيرة
                    </button>
                </div>
            </div>
            {printModal.show && (
                <PrintBarcodeModal
                    barcode={printModal.barcode}
                    volumeName={printModal.volumeName}
                    onHide={handleClosePrintModal}
                    onSuccess={handlePrintSuccess}
                />
            )}
        </div>
    );
}
