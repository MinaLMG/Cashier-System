import React, { useState, useEffect } from "react";
import axios from "axios";
import Button from "../../Basic/Button";
import TextInput from "../../Basic/TextInput";
import Select from "../../Basic/Select";
import formStyles from "../../../styles/forms.module.css";
import commonStyles from "../../../styles/common.module.css";

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
        type: customer?.type || "walkin",
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
            newErrors.name = "اسم العميل مطلوب";
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

                // Reset form to initial state if not editing
                setFormData({
                    name: "",
                    phone: "",
                    address: "",
                    type: "walkin",
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
            console.error("Error saving customer:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={formStyles.formContainer}>
            <h2 className={formStyles.formTitle}>
                {isEditing ? "تعديل العميل" : "إضافة عميل جديد"}
            </h2>
            <form className={formStyles.formGrid}>
                <div className={formStyles.formGroup}>
                    <TextInput
                        type="text"
                        placeholder="اسم العميل"
                        label="اسم العميل"
                        id="name"
                        value={formData.name}
                        onchange={(value) => handleChange("name", value)}
                        error={errors.name}
                    />
                </div>
                <div className={formStyles.formGroup}>
                    <Select
                        title="نوع العميل"
                        value={formData.type}
                        onchange={(value) => handleChange("type", value)}
                        options={[
                            { value: "walkin", label: "زبون" },
                            { value: "pharmacy", label: "صيدلية" },
                        ]}
                    />
                </div>
                <div className={formStyles.formGroup}>
                    <TextInput
                        type="text"
                        placeholder="رقم الهاتف"
                        label="رقم الهاتف"
                        id="phone"
                        value={formData.phone}
                        onchange={(value) => handleChange("phone", value)}
                    />
                </div>
                <div className={formStyles.formGroup}>
                    <TextInput
                        type="text"
                        placeholder="العنوان"
                        label="العنوان"
                        id="address"
                        value={formData.address}
                        onchange={(value) => handleChange("address", value)}
                    />
                </div>
                <div className={formStyles.formActions}>
                    <Button
                        content={isEditing ? "تحديث" : "إضافة"}
                        onClick={handleSubmit}
                        disabled={!isFormValid || isSubmitting}
                        className={formStyles.primaryButton}
                    />
                    <Button
                        content="إلغاء"
                        onClick={onCancel}
                        className={formStyles.secondaryButton}
                    />
                </div>
                {submitMessage.text && (
                    <div
                        className={
                            submitMessage.isError
                                ? formStyles.errorMessage
                                : formStyles.successMessage
                        }
                    >
                        {submitMessage.text}
                    </div>
                )}
            </form>
        </div>
    );
}
