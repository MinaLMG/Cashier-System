import React, { useState, useEffect } from "react";
import axios from "axios";
import Button from "../../Basic/Button";
import TextInput from "../../Basic/TextInput";
import Select from "../../Basic/Select";
import FormMessage from "../../Basic/FormMessage";
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
    const [fieldErrors, setFieldErrors] = useState({});
    const [formError, setFormError] = useState(""); // Form-level error below submit button
    const [hasUserInteracted, setHasUserInteracted] = useState(false); // Track if user has started interacting
    const [submitMessage, setSubmitMessage] = useState({
        text: "",
        isError: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validate form on every change
    useEffect(() => {
        // Only validate if user has interacted or we're in edit mode
        if (!hasUserInteracted && !isEditing) {
            setFormError("");
            setFieldErrors({});
            return;
        }

        const newErrors = {};
        let hasErrors = false;

        if (!formData.name.trim()) {
            newErrors.name = "اسم العميل مطلوب";
            hasErrors = true;
        }

        // Validate phone number format if provided
        if (formData.phone && !/^[\d\+\-\(\) ]{11}$/.test(formData.phone)) {
            newErrors.phone = "صيغة رقم الهاتف غير صحيحة";
            hasErrors = true;
        }

        // Validate type
        if (!formData.type) {
            newErrors.type = "نوع العميل مطلوب";
            hasErrors = true;
        } else if (formData.type !== "walkin" && formData.type !== "pharmacy") {
            newErrors.type = "نوع العميل غير صالح";
            hasErrors = true;
        }

        setFieldErrors(newErrors);
        setFormError(hasErrors ? "يرجى إصلاح الأخطاء أعلاه" : "");
    }, [formData, hasUserInteracted, isEditing]);

    const handleChange = (field, value) => {
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
        if (isEditing && customer) {
            setHasUserInteracted(true); // Enable validation for edit mode
        }
    }, [isEditing, customer]);

    const handleSubmit = async (e) => {
        e.preventDefault();

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
            if (isEditing) {
                await axios.put(
                    `${process.env.REACT_APP_BACKEND}customers/${customer._id}`,
                    formData
                );
                setSubmitMessage({
                    text: "✅ تم تحديث العميل بنجاح",
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
                    `${process.env.REACT_APP_BACKEND}customers`,
                    formData
                );
                setSubmitMessage({
                    text: "✅ تم إضافة العميل بنجاح",
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
                    phone: "",
                    address: "",
                    type: "walkin",
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
                <TextInput
                    type="text"
                    placeholder="اسم العميل"
                    label="اسم العميل"
                    id="name"
                    value={formData.name}
                    onchange={(value) => handleChange("name", value)}
                    width="300px"
                    error={fieldErrors.name || ""}
                />

                <Select
                    title="نوع العميل"
                    value={formData.type}
                    onchange={(value) => handleChange("type", value)}
                    options={[
                        { value: "walkin", label: "زبون" },
                        { value: "pharmacy", label: "صيدلية" },
                    ]}
                    width="58px"
                    error={fieldErrors.type || ""}
                />

                <TextInput
                    type="text"
                    placeholder="رقم الهاتف"
                    label="رقم الهاتف"
                    id="phone"
                    value={formData.phone}
                    onchange={(value) => handleChange("phone", value)}
                    width="300px"
                    error={fieldErrors.phone || ""}
                />

                <TextInput
                    type="text"
                    placeholder="العنوان"
                    label="العنوان"
                    id="address"
                    value={formData.address}
                    onchange={(value) => handleChange("address", value)}
                    width="300px"
                    error={fieldErrors.address || ""}
                />
                <div className={formStyles.formActions}>
                    <Button
                        content={isEditing ? "تحديث" : "إضافة"}
                        onClick={handleSubmit}
                        disabled={
                            Object.keys(fieldErrors).some(
                                (key) => fieldErrors[key]
                            ) ||
                            formError ||
                            isSubmitting
                        }
                        className={formStyles.primaryButton}
                    />
                    <Button
                        content="إلغاء"
                        onClick={onCancel}
                        className={formStyles.secondaryButton}
                    />
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
