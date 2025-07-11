import React from "react";
import classes from "./Modal.module.css";

const Modal = ({ title, children, onClose, size = "md" }) => {
    return (
        <div className={classes.modalBackdrop} onClick={onClose}>
            <div
                className={`${classes.modalContent} ${classes[size]}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={classes.modalHeader}>
                    <h5 className={classes.modalTitle}>{title}</h5>
                    <button
                        type="button"
                        className={classes.closeButton}
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>
                <div className={classes.modalBody}>{children}</div>
            </div>
        </div>
    );
};

export default Modal;
