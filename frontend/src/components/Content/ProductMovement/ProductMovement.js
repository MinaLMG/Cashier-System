import React, { useState, useEffect } from "react";
import Select from "../../Basic/Select";
import SortableTable from "../../Basic/SortableTable";
import classes from "./ProductMovement.module.css";

const ProductMovement = () => {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch products on component mount
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND}products`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch products");
            }

            const data = await response.json();
            const productOptions = data.map((product) => ({
                value: product._id,
                label: product.name,
            }));
            setProducts(productOptions);
        } catch (error) {
            console.error("Error fetching products:", error);
            setError("فشل في تحميل قائمة المنتجات");
        }
    };

    const fetchProductMovement = async (productId) => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND}product-movements/${productId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch product movement");
            }

            const data = await response.json();
            setMovements(data);
        } catch (error) {
            console.error("Error fetching product movement:", error);
            setError("فشل في تحميل تاريخ حركة المنتج");
            setMovements([]);
        } finally {
            setLoading(false);
        }
    };

    const handleProductChange = (productId) => {
        setSelectedProduct(productId);
        if (productId) {
            fetchProductMovement(productId);
        } else {
            setMovements([]);
        }
    };

    // Table columns configuration
    const columns = [
        {
            field: "rowNumber",
            title: "#",
            sortable: true,
        },
        {
            field: "date",
            title: "التاريخ",
            sortable: true,
        },
        {
            field: "type",
            title: "نوع العملية",
            sortable: true,
        },
        {
            field: "quantity",
            title: "الكمية (وحدة أساسية)",
            sortable: true,
        },
        {
            field: "remaining",
            title: "المتبقي (وحدة أساسية)",
            sortable: true,
        },
    ];

    // Render table row
    const renderRow = (movement, index) => {
        const getTypeLabel = (type) => {
            switch (type) {
                case "purchase":
                    return "شراء";
                case "sale":
                    return "بيع";
                case "return":
                    return "إرجاع";
                default:
                    return type;
            }
        };

        const getTypeClass = (type) => {
            switch (type) {
                case "purchase":
                    return classes.purchaseRow;
                case "sale":
                    return classes.saleRow;
                case "return":
                    return classes.returnRow;
                default:
                    return "";
            }
        };

        return (
            <tr key={index} className={getTypeClass(movement.type)}>
                <td className={classes.rowNumber}>{movement.rowNumber}</td>
                <td>{movement.date}</td>
                <td>{getTypeLabel(movement.type)}</td>
                <td>{movement.quantity}</td>
                <td>{movement.remaining}</td>
            </tr>
        );
    };

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h2>حركة المنتج</h2>
            </div>

            <div className={classes.controls}>
                <Select
                    title="اختر المنتج"
                    options={products}
                    value={selectedProduct}
                    onchange={handleProductChange}
                    width="300px"
                />
            </div>

            {error && <div className={classes.error}>{error}</div>}

            {loading && (
                <div className={classes.loading}>
                    <p>جاري التحميل...</p>
                </div>
            )}

            {selectedProduct && !loading && (
                <div className={classes.tableContainer}>
                    <SortableTable
                        columns={columns}
                        data={movements}
                        renderRow={renderRow}
                        initialSortField="rowNumber"
                        initialSortDirection="asc"
                        emptyMessage="لا توجد حركات لهذا المنتج"
                    />
                </div>
            )}
        </div>
    );
};

export default ProductMovement;
