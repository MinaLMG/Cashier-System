import React, { useState, useEffect, useRef } from "react";
import classes from "./SearchableSelect.module.css";

export default function SearchableSelect({
    value,
    options = [],
    onchange,
    placeholder = "اختر...",
    disabled = false,
    error = "",
    label = "",
    className = "",
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredOptions, setFilteredOptions] = useState(options);
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    // Get the label for the selected value
    const selectedOption = options.find((opt) => opt.value === value);
    const displayValue = selectedOption ? selectedOption.label : placeholder;

    // Filter options based on search term
    useEffect(() => {
        if (searchTerm) {
            const filtered = options.filter((option) =>
                option.label.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredOptions(filtered);
        } else {
            setFilteredOptions(options);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, JSON.stringify(options)]); // Fix: Use stringified options to avoid infinite loop on new array reference

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
                setSearchTerm("");
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Toggle dropdown
    const handleToggle = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
            setSearchTerm("");
        }
    };

    const handleSelect = (optionValue) => {
        onchange(optionValue);
        setIsOpen(false);
        setSearchTerm("");
    };

    const handleKeyDown = (e, optionValue) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelect(optionValue);
        }
    };

    return (
        <div className={`${classes.container} ${className}`} ref={containerRef}>
            {label && <label className={classes.label}>{label}</label>}

            <div
                className={`${classes.selectBox} ${
                    disabled ? classes.disabled : ""
                } ${error ? classes.error : ""} ${isOpen ? classes.open : ""}`}
                onClick={handleToggle}
                role="button"
                tabIndex={disabled ? -1 : 0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleToggle();
                    }
                }}
            >
                <span
                    className={`${classes.displayValue} ${
                        !selectedOption ? classes.placeholder : ""
                    }`}
                >
                    {displayValue}
                </span>
                <span
                    className={`${classes.arrow} ${isOpen ? classes.open : ""}`}
                >
                    ▼
                </span>
            </div>

            {isOpen && !disabled && (
                <div className={classes.dropdown}>
                    <div className={classes.searchContainer}>
                        <input
                            ref={searchInputRef}
                            type="text"
                            className={classes.searchInput}
                            placeholder="ابحث..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className={classes.optionsList}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={`${classes.option} ${
                                        option.value === value
                                            ? classes.selected
                                            : ""
                                    }`}
                                    onClick={() => handleSelect(option.value)}
                                    onKeyDown={(e) =>
                                        handleKeyDown(e, option.value)
                                    }
                                    role="option"
                                    aria-selected={option.value === value}
                                    tabIndex={0}
                                >
                                    {option.label}
                                </div>
                            ))
                        ) : (
                            <div className={classes.noResults}>
                                لا توجد نتائج
                            </div>
                        )}
                    </div>
                </div>
            )}

            {error && <div className={classes.errorMessage}>{error}</div>}
        </div>
    );
}
