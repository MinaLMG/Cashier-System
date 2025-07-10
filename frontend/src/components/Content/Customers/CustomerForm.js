import React, { useState } from "react";
import axios from "axios";
import classes from "../PurchaseInvoice/PurchaseInvoice.module.css";
import Button from "../../Basic/Button";

export default function CustomerForm({
    customer,
    isEditing,
    onSubmit,
    onCancel,
}) {
    const [formData, setFormData] = useState({
        name: customer?.name || "",
        phone: customer?.phone || "",
        address: customer?.address || "",
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
            setError("اسم العميل مطلوب");
            return;
        }

        try {
            if (isEditing) {
                await axios.put(
                    `${process.env.REACT_APP_BACKEND}customers/${customer._id}`,
                    formData
                );
                setSubmitMessage({
                    text: "✅ تم تحديث العميل بنجاح",
                    isError: false,
                });
            } else {
                await axios.post(
                    `${process.env.REACT_APP_BACKEND}customers`,
                    formData
                );
                setSubmitMessage({
                    text: "✅ تم إضافة العميل بنجاح",
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
            console.error("Error saving customer:", error);
        }
    };

    return (
        <div className={classes.container}>
            <h2 className={classes.formTitle}>
                {isEditing ? "تعديل عميل" : "إضافة عميل جديد"}
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
                        اسم العميل
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
                <div className="mb-3">
                    <label htmlFor="address" className="form-label">
                        العنوان
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        id="address"
                        name="address"
                        value={formData.address}
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
