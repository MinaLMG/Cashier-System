import React from "react";

export default function Pagination({
    page,
    pageSize,
    total,
    onPageChange,
    className = "",
}) {
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;

    const handleSetPage = (nextPage) => {
        if (!onPageChange) return;
        const clamped = Math.min(Math.max(nextPage, 1), totalPages || 1);
        onPageChange(clamped);
    };

    return (
        <div
            className={className}
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "12px",
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
                    onClick={() => handleSetPage(1)}
                >
                    الأولى
                </button>
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={page <= 1}
                    onClick={() => handleSetPage(page - 1)}
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
                        max={totalPages}
                        value={page}
                        onChange={(e) => {
                            const raw = e.target.value;
                            const num = parseInt(raw, 10);
                            if (Number.isNaN(num)) {
                                handleSetPage(1);
                            } else {
                                handleSetPage(num);
                            }
                        }}
                        style={{
                            width: "60px",
                            textAlign: "center",
                        }}
                        className="form-control form-control-sm"
                    />
                    <span>من {totalPages}</span>
                </div>
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={page >= totalPages || total === 0}
                    onClick={() => handleSetPage(page + 1)}
                >
                    التالى
                </button>
                <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={page >= totalPages || total === 0}
                    onClick={() => handleSetPage(totalPages)}
                >
                    الأخيرة
                </button>
            </div>
        </div>
    );
}
