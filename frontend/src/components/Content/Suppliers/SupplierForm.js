import React, { useState, useEffect } from "react";
import axios from "axios";
import classes from "../PurchaseInvoice/PurchaseInvoice.module.css";
import Button from "../../Basic/Button";
import TextInput from "../../Basic/TextInput";

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
    const [errors, setErrors] = useState({});
    const [isFormValid, setIsFormValid] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({
        text: "",
        isError: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validate form on every change
    useEffect(() => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "اسم المورد مطلوب";
        }

        setErrors(newErrors);
        setIsFormValid(Object.keys(newErrors).length === 0);
    }, [formData]);

    const handleChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isFormValid) {
            return;
        }

        setIsSubmitting(true);

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
            setSubmitMessage({
                text:
                    "❌ " +
                    (error.response?.data?.error ||
                        "حدث خطأ أثناء حفظ البيانات"),
                isError: true,
            });
            console.error("Error saving supplier:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={classes.container}>
            <h2 className={classes.formTitle}>
                {isEditing ? "تعديل مورد" : "إضافة مورد جديد"}
            </h2>
            <form onSubmit={handleSubmit} className={classes.form}>
                <div className="mb-3">
                    <TextInput
                        type="text"
                        placeholder="اسم المورد"
                        label="اسم المورد"
                        id="name"
                        value={formData.name}
                        onchange={(value) => handleChange("name", value)}
                        error={errors.name}
                    />
                </div>
                <div className="mb-3">
                    <TextInput
                        type="text"
                        placeholder="رقم الهاتف"
                        label="رقم الهاتف"
                        id="phone"
                        value={formData.phone}
                        onchange={(value) => handleChange("phone", value)}
                    />
                </div>
                <div className={classes.actions}>
                    <Button
                        content={isEditing ? "تحديث" : "إضافة"}
                        onClick={() => {}}
                        type="submit"
                        disabled={!isFormValid || isSubmitting}
                    />
                    <Button content="إلغاء" onClick={onCancel} type="button" />
                </div>
                {submitMessage.text && (
                    <div
                        className={`${
                            submitMessage.isError
                                ? classes.error
                                : classes.success
                        } mt-3`}
                    >
                        {submitMessage.text}
                    </div>
                )}
            </form>
        </div>
    );
}
