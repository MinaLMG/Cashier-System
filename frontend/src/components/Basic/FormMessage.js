import React from "react";
import formStyles from "../../styles/forms.module.css";

/**
 * FormMessage component for displaying success or error messages in forms
 * @param {Object} props - Component props
 * @param {string} props.text - The message text to display
 * @param {boolean} props.isError - Whether the message is an error (true) or success (false)
 * @param {string} [props.className] - Optional additional CSS class
 * @returns {JSX.Element|null} - The message component or null if no text
 */
export default function FormMessage({ text, isError, className = "" }) {
    if (!text) return null;

    return (
        <div
            className={`${
                isError ? formStyles.errorMessage : formStyles.successMessage
            } ${className}`}
        >
            {text}
        </div>
    );
}
