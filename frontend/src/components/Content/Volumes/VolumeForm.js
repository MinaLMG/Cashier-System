import React, { useState, useEffect } from "react";
import axios from "axios";
import Button from "../../Basic/Button";
import TextInput from "../../Basic/TextInput";
import FormMessage from "../../Basic/FormMessage";
import formStyles from "../../../styles/forms.module.css";

export default function VolumeForm({
    volume,
    isEditing,
    mode = "add",
    onSubmit,
    onCancel,
}) {
    const [formData, setFormData] = useState({
        name: volume?.name || "",
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState(""); // Form-level error below submit button
    const [hasUserInteracted, setHasUserInteracted] = useState(false); // Track if user has started interacting
    const [submitMessage, setSubmitMessage] = useState({
        text: "",
        isError: false,
    });
    const isViewMode = mode === "view";
    const isEditMode = mode === "edit" || isEditing;
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validate form on every change
    useEffect(() => {
        // Only validate if user has interacted or we're in edit mode, but not in view mode
        if (!hasUserInteracted && !isEditMode) {
            setFormError("");
            setFieldErrors({});
            return;
        }

        const newErrors = {};
        let hasErrors = false;

        if (!formData.name.trim()) {
            newErrors.name = "اسم العبوة مطلوب";
            hasErrors = true;
        }

        setFieldErrors(newErrors);
        setFormError(hasErrors ? "يرجى إصلاح الأخطاء أعلاه" : "");
    }, [formData, hasUserInteracted, isEditing]);

    const handleChange = (field, value) => {
        // Don't allow changes in view mode
        if (isViewMode) return;

        // Mark that user has started interacting
        if (!hasUserInteracted) {
            setHasUserInteracted(true);
        }

        setFormData({
            ...formData,
            [field]: value,
        });

        // Clear field-specific error when user types
        if (fieldErrors[field]) {
            setFieldErrors((prev) => ({ ...prev, [field]: "" }));
        }
    };

    // Initialize form for edit mode
    useEffect(() => {
        if (isEditMode && volume) {
            setHasUserInteracted(true); // Enable validation for edit mode
        }
    }, [isEditMode, volume]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // In view mode, just call onCancel to close
        if (isViewMode) {
            onCancel();
            return;
        }

        // Check if form has errors
        const hasErrors = Object.keys(fieldErrors).some(
            (key) => fieldErrors[key]
        );
        if (hasErrors || formError) {
            setSubmitMessage({
                text: "يرجى إصلاح الأخطاء قبل الإرسال",
                isError: true,
            });

            // Clear error after 10 seconds
            setTimeout(() => {
                setSubmitMessage({
                    text: "",
                    isError: false,
                });
            }, 10000);
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditMode) {
                await axios.put(
                    `${process.env.REACT_APP_BACKEND}volumes/${volume._id}`,
                    formData
                );
                setSubmitMessage({
                    text: "✅ تم تحديث العبوة بنجاح",
                    isError: false,
                });

                // Clear success message after 5 seconds
                setTimeout(() => {
                    setSubmitMessage({
                        text: "",
                        isError: false,
                    });
                }, 5000);
            } else {
                await axios.post(
                    `${process.env.REACT_APP_BACKEND}volumes`,
                    formData
                );
                setSubmitMessage({
                    text: "✅ تم إضافة العبوة بنجاح",
                    isError: false,
                });

                // Clear success message after 5 seconds
                setTimeout(() => {
                    setSubmitMessage({
                        text: "",
                        isError: false,
                    });
                }, 5000);

                // Reset form to initial state if not editing
                setFormData({
                    name: "",
                });
                setFieldErrors({});
                setFormError("");
                setHasUserInteracted(false);
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

            // Clear error after 10 seconds
            setTimeout(() => {
                setSubmitMessage({
                    text: "",
                    isError: false,
                });
            }, 10000);

            console.error("Error saving volume:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={formStyles.formContainer}>
            <h2 className={formStyles.formTitle}>
                {isViewMode
                    ? "عرض تفاصيل العبوة"
                    : isEditMode
                    ? "تعديل العبوة"
                    : "إضافة عبوة جديدة"}
            </h2>
            <form className={formStyles.formGrid}>
                <TextInput
                    type="text"
                    placeholder="اسم العبوة"
                    label="اسم العبوة"
                    id="name"
                    value={formData.name}
                    onchange={(value) => handleChange("name", value)}
                    width="300px"
                    error={fieldErrors.name || ""}
                    disabled={isViewMode}
                />

                <div className={formStyles.formActions}>
                    <Button
                        content={
                            isViewMode
                                ? "إغلاق"
                                : isEditMode
                                ? "تحديث"
                                : "إضافة"
                        }
                        onClick={handleSubmit}
                        disabled={
                            isViewMode
                                ? false
                                : Object.keys(fieldErrors).some(
                                      (key) => fieldErrors[key]
                                  ) ||
                                  formError ||
                                  isSubmitting
                        }
                        className={formStyles.primaryButton}
                    />
                    {!isViewMode && (
                        <Button
                            content="إلغاء"
                            onClick={onCancel}
                            className={formStyles.secondaryButton}
                        />
                    )}
                </div>

                {/* Form-level error below submit button */}
                {formError && (
                    <div
                        style={{
                            color: "var(--accent-red)",
                            marginTop: "10px",
                            fontSize: "14px",
                            textAlign: "right",
                        }}
                    >
                        ⚠️ {formError}
                    </div>
                )}

                {/* Submit success/error message */}
                <FormMessage
                    text={submitMessage.text}
                    isError={submitMessage.isError}
                />
            </form>
        </div>
    );
}
