import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import classes from "./DateTimeInput.module.css";

/**
 * DateTimeInput component using react-datepicker
 * @param {Object} props - Component props
 * @param {string} props.label - Input label
 * @param {string} props.id - Input ID
 * @param {string} props.value - Input value (ISO string)
 * @param {Function} props.onchange - Change handler function
 * @param {boolean} props.includeTime - Whether to include time input (default: false)
 * @param {boolean} props.disabled - Whether the input is disabled
 * @param {string} props.className - Additional CSS class
 */
export default function DateTimeInput({
    label,
    id,
    value,
    onchange,
    includeTime = false,
    disabled = false,
    className = "",
}) {
    // Convert ISO string to Date object for DatePicker
    const [selectedDate, setSelectedDate] = useState(
        value ? new Date(value) : new Date()
    );

    // Update selectedDate when value prop changes
    useEffect(() => {
        if (value) {
            setSelectedDate(new Date(value));
        }
    }, [value]);

    // Handle date change
    const handleDateChange = (date) => {
        setSelectedDate(date);

        // Convert back to ISO string for the parent component
        if (date) {
            onchange(date.toISOString());
        }
    };

    return (
        <div className={`${classes.container} ${className}`}>
            <div className={classes.inputGroup}>
                <DatePicker
                    id={id}
                    selected={selectedDate}
                    onChange={handleDateChange}
                    showTimeSelect={includeTime}
                    timeFormat="HH:mm"
                    timeIntervals={1}
                    timeCaption="وقت"
                    dateFormat={
                        includeTime ? "dd/MM/yyyy h:mm aa" : "dd/MM/yyyy"
                    }
                    disabled={disabled}
                    className={classes.datePicker}
                />
            </div>
        </div>
    );
}
