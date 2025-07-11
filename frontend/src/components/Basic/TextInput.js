import { Fragment } from "react";
import classes from "./TextInput.module.css";

// Use the classes import if needed, otherwise remove it
export default function TextInput({
    type,
    placeholder,
    label,
    id,
    value,
    onchange,
    disabled = false,
    className = "",
    min,
}) {
    // Only add min attribute if it's explicitly provided
    const minProps = min !== undefined ? { min } : {};

    return (
        <div
            className={`form-floating mb-3 ${className ? className : ""}`}
            dir="rtl"
        >
            <input
                type={type}
                placeholder={placeholder}
                id={id}
                value={value}
                onChange={(e) => onchange(e.currentTarget.value)}
                disabled={disabled}
                className="form-control"
                {...minProps}
                min={min !== undefined ? min : ""}
            />
            <label htmlFor={id}>{label}</label>
        </div>
    );
}
