import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom hook for managing invoice rows with consistent validation
 *
 * @param {Object} initialRow - Template for a new empty row
 * @param {Function} validateRowFn - Function to validate a single row
 * @param {Array} dependencies - Dependencies that should trigger row validation
 * @returns {Object} Row management methods and state
 */
export default function useInvoiceRows(
    initialRow,
    validateRowFn,
    dependencies = []
) {
    const [rows, setRows] = useState([{ ...initialRow }]);
    const [rowErrors, setRowErrors] = useState([{}]); // Initialize with an empty object for the first row
    const [isFormValid, setIsFormValid] = useState(false);
    const isValidatingRef = useRef(false);

    // Validate all rows and update errors
    const validateRows = useCallback(() => {
        if (isValidatingRef.current) return;
        isValidatingRef.current = true;

        const totalRows = rows.length;

        // Validate all rows, but check if the last row is empty before validating it
        const updatedErrors = rows.map((row, index) => {
            // For the last row, only validate if it has some data entered
            if (index === totalRows - 1 && totalRows > 1) {
                // Check if the last row is empty (no data entered yet)
                const isEmpty = Object.keys(row).every((key) => {
                    // Skip _id field and check if other fields are empty
                    if (key === "_id") return true;
                    return !row[key] || row[key] === "";
                });

                // If the last row is completely empty, don't validate it
                if (isEmpty) return {};
            }

            // Validate the row
            const errors = validateRowFn(row, index, rows);
            return errors;
        });

        setRowErrors(updatedErrors);

        // Form is valid if all filled rows are valid
        const isEachFilledRowValid = rows.every((row, index) => {
            // Skip empty rows (typically the last one)
            const isEmpty = Object.keys(row).every((key) => {
                if (key === "_id") return true;
                return !row[key] || row[key] === "";
            });

            if (isEmpty && index === totalRows - 1) return true;

            return Object.keys(updatedErrors[index] || {}).length === 0;
        });

        const atLeastOneValidRow = rows.some(
            (row, index) =>
                Object.keys(validateRowFn(row, index, rows) || {}).length === 0
        );

        setIsFormValid(isEachFilledRowValid && atLeastOneValidRow);

        isValidatingRef.current = false;
        return updatedErrors;
    }, [rows, validateRowFn]);

    // Manual validation only - no automatic validation to prevent infinite loops
    // Validation will be triggered manually when needed

    // Handle row change
    const handleRowChange = useCallback(
        (index, key, value) => {
            setRows((prevRows) => {
                const updatedRows = [...prevRows];
                updatedRows[index][key] = value;

                // Trigger validation after state update
                setTimeout(() => {
                    validateRows();
                }, 0);

                return updatedRows;
            });
        },
        [validateRowFn, validateRows]
    );

    // Add a new row
    const addRow = useCallback(() => {
        setRows((prev) => {
            const newRows = [...prev, { ...initialRow }];
            // Trigger validation after adding row
            setTimeout(() => {
                validateRows();
            }, 0);
            return newRows;
        });
        setRowErrors((prev) => [...prev, {}]);
    }, [initialRow, validateRows]);

    // Remove a row
    const removeRow = useCallback(
        (index) => {
            setRows((prev) => {
                if (prev.length <= 1) return prev; // Don't remove the last row
                const newRows = prev.filter((_, i) => i !== index);
                // Trigger validation after removing row
                setTimeout(() => {
                    validateRows();
                }, 0);
                return newRows;
            });

            setRowErrors((prev) => {
                if (prev.length <= 1) return prev; // Don't remove the last row
                return prev.filter((_, i) => i !== index);
            });
        },
        [validateRows]
    );

    return {
        rows,
        rowErrors,
        isFormValid,
        handleRowChange,
        addRow,
        removeRow,
        setRows,
        validateRows,
        setRowErrors, // Export setRowErrors function
    };
}
