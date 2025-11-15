import React, { useState } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import classes from "./PrintBarcodeModal.module.css";

const Background = ({ onHide }) => {
    return <div className={classes.background} onClick={onHide}></div>;
};

const Body = ({ barcode, volumeName, onHide, onSuccess }) => {
    const [copies, setCopies] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handlePrint = async () => {
        if (copies < 1 || copies > 100) {
            setError("عدد النسخ يجب أن يكون بين 1 و 100");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND}printer/print-barcode`,
                {
                    barcode: barcode,
                    copies: parseInt(copies, 10),
                }
            );

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess && onSuccess();
                    onHide();
                }, 1500);
            } else {
                setError(response.data.error || "فشلت عملية الطباعة");
            }
        } catch (err) {
            setError(
                err.response?.data?.error ||
                    err.response?.data?.message ||
                    "حدث خطأ أثناء الطباعة"
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCopiesChange = (e) => {
        const value = e.target.value;
        if (value === "" || (value >= 1 && value <= 100)) {
            setCopies(value === "" ? "" : parseInt(value, 10));
            setError("");
        }
    };

    return (
        <div className={classes.body}>
            <div className={classes.header}>
                <h2>طباعة الباركود</h2>
                <button className={classes.closeButton} onClick={onHide}>
                    ×
                </button>
            </div>
            <div className={classes.content}>
                {volumeName && (
                    <div className={classes.infoSection}>
                        <p className={classes.infoLabel}>العبوة:</p>
                        <p className={classes.infoValue}>{volumeName}</p>
                    </div>
                )}
                <div className={classes.infoSection}>
                    <p className={classes.infoLabel}>الباركود:</p>
                    <p className={classes.barcodeValue}>{barcode}</p>
                </div>

            </div>
        </div>
    );
};

function PrintBarcodeModal({ barcode, volumeName, onHide, onSuccess }) {
    if (!barcode) return null;

    return (
        <React.Fragment>
            {ReactDOM.createPortal(
                <Background onHide={onHide} />,
                document.getElementById("background")
            )}
            {ReactDOM.createPortal(
                <Body
                    barcode={barcode}
                    volumeName={volumeName}
                    onHide={onHide}
                    onSuccess={onSuccess}
                />,
                document.getElementById("body")
            )}
        </React.Fragment>
    );
}

export default PrintBarcodeModal;
