import React, { useState } from "react";
import axios from "axios";
import classes from "../PurchaseInvoice/PurchaseInvoice.module.css";
import Button from "../../Basic/Button";

export default function SupplierForm({
    supplier,
    isEditing,
    onSubmit,
    onCancel,
}) {
    const [formData, setFormData] = useState({
        name: supplier?.name || "",
        phone: supplier?.phone || "",
    });
    const [error, setError] = useState("");
    const [submitMessage, setSubmitMessage] = useState({
        text: "",
        isError: false,
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.name.trim()) {
            setError("اسم المورد مطلوب");
            return;
        }

        try {
            if (isEditing) {
                await axios.put(
                    `${process.env.REACT_APP_BACKEND}suppliers/${supplier._id}`,
                    formData
                );
                setSubmitMessage({
                    text: "✅ تم تحديث المورد بنجاح",
                    isError: false,
                });
            } else {
                await axios.post(
                    `${process.env.REACT_APP_BACKEND}suppliers`,
                    formData
                );
                setSubmitMessage({
                    text: "✅ تم إضافة المورد بنجاح",
                    isError: false,
                });
            }
            setTimeout(() => {
                onSubmit();
            }, 1500);
        } catch (error) {
            setError("حدث خطأ أثناء حفظ البيانات");
            setSubmitMessage({
                text:
                    "❌ " +
                    (error.response?.data?.error ||
                        "حدث خطأ أثناء حفظ البيانات"),
                isError: true,
            });
            console.error("Error saving supplier:", error);
        }
    };

    return (
        <div className={classes.container}>
            <h2 className={classes.formTitle}>
                {isEditing ? "تعديل مورد" : "إضافة مورد جديد"}
            </h2>
            {error && <div className={classes.error}>{error}</div>}
            {submitMessage.text && (
                <div
                    className={
                        submitMessage.isError ? classes.error : classes.success
                    }
                >
                    {submitMessage.text}
                </div>
            )}
            <form onSubmit={handleSubmit} className={classes.form}>
                <div className="mb-3">
                    <label htmlFor="name" className="form-label">
                        اسم المورد
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-3">
                    <label htmlFor="phone" className="form-label">
                        رقم الهاتف
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                    />
                </div>
                <div className={classes.actions}>
                    <Button
                        content={isEditing ? "تحديث" : "إضافة"}
                        onClick={() => {}}
                        type="submit"
                    />
                    <Button content="إلغاء" onClick={onCancel} type="button" />
                </div>
            </form>
        </div>
    );
}
