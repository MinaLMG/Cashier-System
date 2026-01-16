import React from "react";
import Modal from "./Modal";
import Button from "../Basic/Button";

const ConfirmModal = ({ 
    isOpen, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = "تأكيد", 
    cancelText = "إلغاء",
    type = "danger" 
}) => {
    if (!isOpen) return null;

    return (
        <Modal title={title} onClose={onCancel} size="sm">
            <div style={{ textAlign: "center", padding: "10px" }}>
                <p style={{ fontSize: "1.1rem", marginBottom: "20px" }}>{message}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                    <Button 
                        content={confirmText} 
                        onClick={onConfirm} 
                        style={{ 
                            backgroundColor: type === "danger" ? "var(--accent-red)" : "var(--secondary-color)",
                            color: "white"
                        }}
                    />
                    <Button 
                        content={cancelText} 
                        onClick={onCancel} 
                        style={{ 
                            backgroundColor: "#ccc",
                            color: "black"
                        }}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
