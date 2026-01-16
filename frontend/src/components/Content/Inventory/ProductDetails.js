import React, { useState, useEffect } from "react";
import axios from "axios";
import classes from "./ProductDetails.module.css";
import PrintBarcodeModal from "./PrintBarcodeModal";

export default function ProductDetails({ product, onBack }) {
    const [productData, setProductData] = useState(product);
    const [loading, setLoading] = useState(!product);
    const [printModal, setPrintModal] = useState({
        show: false,
        barcode: null,
        volumeName: null,
    });

    useEffect(() => {
        if (product) {
            const productId = product._id || product.id;
            if (productId) {
                // If product data is incomplete, fetch full details
                if (!product.values || product.values.length === 0) {
                    fetchProductDetails(productId);
                } else {
                    setProductData(product);
                    setLoading(false);
                }
            }
        }
    }, [product]);

    const fetchProductDetails = async (productId) => {
        try {
            setLoading(true);
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND}products/full/${productId}`
            );
            // Convert id to _id for consistency
            const data = response.data;
            if (data.id && !data._id) {
                data._id = data.id;
            }
            setProductData(data);
        } catch (error) {
            console.error("Failed to fetch product details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleClosePrintModal = () => {
        setPrintModal({
            show: false,
            barcode: null,
            volumeName: null,
        });
    };

    const handlePrintSuccess = () => {
        console.log("Barcode printed successfully");
    };

    if (loading) {
        return (
            <div className={classes.container}>
                <div className={classes.loading}>جاري التحميل...</div>
            </div>
        );
    }

    if (!productData) {
        return (
            <div className={classes.container}>
                <div className={classes.error}>المنتج غير موجود</div>
            </div>
        );
    }

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h1 className={classes.title}>تفاصيل المنتج</h1>
                <button className={classes.backButton} onClick={onBack}>
                    ← رجوع
                </button>
            </div>

            <div className={classes.content}>
                <div className={classes.section}>
                    <h2 className={classes.sectionTitle}>اسم المنتج</h2>
                    <p className={classes.sectionValue}>{productData.name}</p>
                </div>

                {productData["min-stock"] && (
                    <div className={classes.section}>
                        <h2 className={classes.sectionTitle}>
                            الحد الأدنى للمخزون
                        </h2>
                        <p className={classes.sectionValue}>
                            {productData["min-stock"]}
                        </p>
                    </div>
                )}

                <div className={classes.section}>
                    <h2 className={classes.sectionTitle}>الباقي حالياً</h2>
                    <p className={classes.sectionValue}>
                        {productData.total_remaining || 0}
                    </p>
                </div>

                {/* {productData.u_walkin_price && (
                    <div className={classes.section}>
                        <h2 className={classes.sectionTitle}>
                            سعر زبون (وحدة)
                        </h2>
                        <p className={classes.sectionValue}>
                            {productData.u_walkin_price.toFixed(2)} ج.م
                        </p>
                    </div>
                )}

                {productData.u_pharmacy_price && (
                    <div className={classes.section}>
                        <h2 className={classes.sectionTitle}>
                            سعر صيدلية (وحدة)
                        </h2>
                        <p className={classes.sectionValue}>
                            {productData.u_pharmacy_price.toFixed(2)} ج.م
                        </p>
                    </div>
                )}

                {productData.u_guidal_price && (
                    <div className={classes.section}>
                        <h2 className={classes.sectionTitle}>
                            السعر الاسترشادى (وحدة)
                        </h2>
                        <p className={classes.sectionValue}>
                            {productData.u_guidal_price.toFixed(2)} ج.م
                        </p>
                    </div>
                )} 

                <div className={classes.section}>
                    <h2 className={classes.sectionTitle}>العبوات</h2>
                    <div className={classes.volumesList}>
                        {productData.values && productData.values.length > 0 ? (
                            productData.values.map((volume, index) => (
                                <div key={index} className={classes.volumeItem}>
                                    <div className={classes.volumeInfo}>
                                        <span className={classes.volumeName}>
                                            {volume.name}
                                        </span>
                                        <span className={classes.volumeValue}>
                                            : {volume.val}
                                        </span>
                                    </div>
                                    {volume.barcode && (
                                        <div className={classes.barcodeSection}>
                                            <span
                                                className={classes.barcodeLabel}
                                            >
                                                الباركود:
                                            </span>
                                            <span
                                                className={classes.barcodeValue}
                                            >
                                                {volume.barcode}
                                            </span>
                                            <FaPrint
                                                className={classes.printIcon}
                                                onClick={() =>
                                                    handlePrintBarcode(
                                                        volume.barcode,
                                                        volume.name
                                                    )
                                                }
                                                title="طباعة الباركود"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className={classes.noData}>لا توجد عبوات</p>
                        )}
                    </div>
                </div>*/}

                {productData.values && productData.values.length > 0 && (
                    <div className={classes.section}>
                        <h2 className={classes.sectionTitle}>
                            أسعار البيع لكل عبوة
                        </h2>
                        <div className={classes.pricesTableWrapper}>
                            <table className={classes.pricesTable}>
                                <thead>
                                    <tr>
                                        <th>العبوة</th>
                                        <th>القيمة</th>
                                        <th>سعر الصيدلية</th>
                                        <th>سعر الزبون</th>
                                        <th>السعر الاسترشادى</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {productData.values.map((volume, index) => {
                                        const val = Number(volume.value) || 0;
                                        const pharmacy =
                                            productData.u_pharmacy_price && val
                                                ? (
                                                      productData.u_pharmacy_price *
                                                      val
                                                  ).toFixed(2)
                                                : null;
                                        const walkin =
                                            productData.u_walkin_price && val
                                                ? (
                                                      productData.u_walkin_price *
                                                      val
                                                  ).toFixed(2)
                                                : null;
                                        const guidal =
                                            productData.u_guidal_price && val
                                                ? (
                                                      productData.u_guidal_price *
                                                      val
                                                  ).toFixed(2)
                                                : null;

                                        return (
                                            <tr key={index}>
                                                <td>{volume.name}</td>
                                                <td>{volume.value}</td>
                                                <td>
                                                    {pharmacy
                                                        ? `${pharmacy} ج.م`
                                                        : "-"}
                                                </td>
                                                <td>
                                                    {walkin
                                                        ? `${walkin} ج.م`
                                                        : "-"}
                                                </td>
                                                <td>
                                                    {guidal
                                                        ? `${guidal} ج.م`
                                                        : "-"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
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
