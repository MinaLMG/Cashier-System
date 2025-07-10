import React, { useState, useEffect } from "react";
import axios from "axios";
import classes from "../PurchaseInvoice/PurchaseInvoice.module.css";
import Button from "../../Basic/Button";
import TextInput from "../../Basic/TextInput";
import formStyles from "../../../styles/forms.module.css";
import commonStyles from "../../../styles/common.module.css";

export default function VolumeForm({ volume, isEditing, onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        name: volume?.name || "",
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
            newErrors.name = "اسم العبوة مطلوب";
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
                    `${process.env.REACT_APP_BACKEND}volumes/${volume._id}`,
                    formData
                );
                setSubmitMessage({
                    text: "✅ تم تحديث العبوة بنجاح",
                    isError: false,
                });
            } else {
                await axios.post(
                    `${process.env.REACT_APP_BACKEND}volumes`,
                    formData
                );
                setSubmitMessage({
                    text: "✅ تم إضافة العبوة بنجاح",
                    isError: false,
                });

                // Reset form to initial state if not editing
                setFormData({
                    name: "",
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
            console.error("Error saving volume:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={formStyles.formContainer}>
            <h2 className={formStyles.formTitle}>
                {isEditing ? "تعديل العبوة" : "إضافة عبوة جديدة"}
            </h2>
            <form className={formStyles.formGrid}>
                <div className={formStyles.formGroup}>
                    <TextInput
                        type="text"
                        placeholder="اسم العبوة"
                        label="اسم العبوة"
                        id="name"
                        value={formData.name}
                        onchange={(value) => handleChange("name", value)}
                        error={errors.name}
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
