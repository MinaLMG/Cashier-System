import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Modal from "../UI/Modal";
import Select from "../Basic/Select";
import TextInput from "../Basic/TextInput";
import Button from "../Basic/Button";
import FormMessage from "../Basic/FormMessage";
import classes from "./ReturnModal.module.css";

export default function ReturnModal({
    isOpen,
    onClose,
    salesItem,
    onReturnSuccess,
}) {
    const [selectedVolume, setSelectedVolume] = useState("");
    const [selectedQuantity, setSelectedQuantity] = useState(0);
    const [maxQuantity, setMaxQuantity] = useState(0);
    const [reason, setReason] = useState("customer_request");
    const [notes, setNotes] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [availableVolumes, setAvailableVolumes] = useState([]);
    const [availableBaseQuantity, setAvailableBaseQuantity] = useState(0);

    // Calculate return value considering volume conversion
    const calculateReturnValue = () => {
        console.log("calculateReturnValue called with:", {
            selectedQuantity,
            selectedVolume,
            availableVolumes: availableVolumes.length,
        });

        if (!selectedQuantity || !selectedVolume) {
            console.log("Missing selectedQuantity or selectedVolume");
            return 0;
        }

        // Find the selected volume data
        const selectedVolumeData = availableVolumes.find(
            (vol) => vol.volume._id === selectedVolume
        );

        console.log("selectedVolumeData:", selectedVolumeData);

        if (!selectedVolumeData) {
            console.log("No selectedVolumeData found");
            return 0;
        }

        // Calculate unit price based on volume conversion
        // The original v_price is for the original volume, we need to adjust for the new volume
        const originalVolumeValue = salesItem?.salesItem?.soldVolumeValue || 1;
        const selectedVolumeValue = selectedVolumeData.value || 1;

        // Calculate the unit price (price per base unit)
        const unitPrice =
            (salesItem?.salesItem?.v_price || 0) / originalVolumeValue;

        // Calculate the price for the selected volume
        const volumePrice = unitPrice * selectedVolumeValue;

        const result = selectedQuantity * volumePrice;

        console.log("Calculation:", {
            originalVPrice: salesItem?.salesItem?.v_price,
            originalVolumeValue,
            selectedVolumeValue,
            unitPrice,
            volumePrice,
            selectedQuantity,
            result,
        });

        return result;
    };

    const returnValue = calculateReturnValue();

    const fetchAvailableVolumes = useCallback(async () => {
        try {
            setError("");

            // Always use the new endpoint with salesItemId
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND}sales-invoices/available-return-volumes-for-invoice-item/${salesItem.salesItem._id}`
            );

            console.log("API Response:", response.data);
            console.log("Available Volumes:", response.data.availableVolumes);

            setAvailableVolumes(response.data.availableVolumes);
            setSelectedVolume(response.data.availableVolumes[0].volume._id);
            setAvailableBaseQuantity(response.data.availableBaseQuantity);
        } catch (err) {
            console.error("Error fetching available volumes:", err);
            setError("حدث خطأ أثناء جلب الأحجام المتاحة للإرجاع");
        }
    }, [salesItem]);

    // Fetch available volumes when modal opens
    useEffect(() => {
        if (isOpen && salesItem) {
            fetchAvailableVolumes();
        }
    }, [isOpen, salesItem, fetchAvailableVolumes]);

    // Update max quantity when volume changes
    useEffect(() => {
        if (selectedVolume && availableVolumes.length > 0) {
            const volume = availableVolumes.find(
                (v) => v.volume._id === selectedVolume
            );
            if (volume) {
                setMaxQuantity(volume.maxQuantity);
                if (selectedQuantity > volume.maxQuantity) {
                    setSelectedQuantity(volume.maxQuantity);
                }
            }
        }
    }, [selectedVolume, availableVolumes, selectedQuantity]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedVolume || !selectedQuantity) {
            setError("يرجى اختيار الحجم والكمية للإرجاع");
            return;
        }

        if (selectedQuantity <= 0) {
            setError("يجب أن تكون الكمية أكبر من صفر");
            return;
        }

        if (selectedQuantity > maxQuantity) {
            setError(
                `الكمية المحددة (${selectedQuantity}) أكبر من المتاح للإرجاع (${maxQuantity})`
            );
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Use the new return-invoices endpoint with invoice_id and sales_item_id
            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND}return-invoices/from-invoice`,
                {
                    invoice_id: salesItem.invoice_id, // Pass invoice ID from SalesInvoice component
                    sales_item_id: salesItem.salesItem._id, // Real SalesItem ID (no underscores)
                    return_volume_id: selectedVolume,
                    quantity: selectedQuantity,
                    reason: reason,
                    notes: notes.trim(),
                }
            );

            if (response.data.message) {
                onReturnSuccess(response.data);
                handleClose();
            }
        } catch (err) {
            console.error("Error creating return:", err);
            setError(
                err.response?.data?.error || "حدث خطأ أثناء إنشاء الإرجاع"
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedVolume("");
        setSelectedQuantity("");
        setMaxQuantity(0);
        setReason("customer_request");
        setNotes("");
        setError("");
        onClose();
    };

    if (!isOpen || !salesItem) {
        return null;
    }

    return (
        <Modal title="إرجاع المنتج" onClose={handleClose} size="md">
            <div className={classes.modalContent}>
                <div className={classes.productInfo}>
                    <h4>{salesItem.product?.name || "منتج غير معروف"}</h4>

                    {salesItem.salesItem?.to_return && (
                        <p>
                            الكمية المتاحة للإرجاع: {availableBaseQuantity} وحدة
                            أساسية
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className={classes.form}>
                    <div className={classes.formGroup}>
                        <label className={classes.label}>
                            الحجم المراد إرجاعه:
                        </label>
                        <Select
                            value={selectedVolume}
                            options={availableVolumes.map((vol) => ({
                                value: vol.volume._id,
                                label: vol.volume.name,
                            }))}
                            onchange={(value) => {
                                setSelectedVolume(value);
                            }}
                            placeholder="اختر الحجم"
                        />
                    </div>

                    <div className={classes.formGroup}>
                        <label className={classes.label}>
                            الكمية المراد إرجاعها:
                        </label>
                        <TextInput
                            type="number"
                            value={selectedQuantity}
                            onchange={(value) => {
                                setSelectedQuantity(value);
                            }}
                            placeholder={`الحد الأقصى: ${maxQuantity}`}
                            min="1"
                            max={maxQuantity}
                        />
                        {maxQuantity > 0 && (
                            <small className={classes.maxQuantityHighlight}>
                                الحد الأقصى للإرجاع:{" "}
                                <strong>{maxQuantity}</strong> وحدة
                            </small>
                        )}

                        {/* Return Value Display */}
                        {selectedQuantity > 0 && (
                            <div className={classes.returnValueHighlight}>
                                <span className={classes.returnValueLabel}>
                                    قيمة المرتجع:
                                </span>
                                <span className={classes.returnValueAmount}>
                                    {returnValue > 0
                                        ? `${returnValue.toFixed(2)} ج.م`
                                        : "غير محدد"}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className={classes.formGroup}>
                        <label className={classes.label}>سبب الإرجاع:</label>
                        <Select
                            value={reason}
                            options={[
                                {
                                    value: "customer_request",
                                    label: "طلب العميل",
                                },
                                { value: "defective", label: "منتج معيب" },
                                {
                                    value: "expired",
                                    label: "منتج منتهي الصلاحية",
                                },
                                { value: "wrong_item", label: "منتج خاطئ" },
                                { value: "other", label: "أخرى" },
                            ]}
                            onchange={(value) => {
                                setReason(value);
                            }}
                        />
                    </div>

                    <div className={classes.formGroup}>
                        <label className={classes.label}>ملاحظات:</label>
                        <TextInput
                            type="textarea"
                            value={notes}
                            onchange={(value) => {
                                setNotes(value);
                            }}
                            placeholder="ملاحظات إضافية (اختياري)"
                            rows={3}
                        />
                    </div>

                    {error && <FormMessage type="error" message={error} />}

                    <div className={classes.buttonGroup}>
                        <Button
                            type="button"
                            onClick={handleClose}
                            variant="secondary"
                            disabled={isLoading}
                            className={classes.cancelButton}
                            content="إلغاء"
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={
                                isLoading ||
                                !selectedVolume ||
                                !selectedQuantity
                            }
                            className={classes.submitButton}
                            loading={isLoading}
                            content="تأكيد الإرجاع"
                        />
                    </div>
                </form>
            </div>
        </Modal>
    );
}
