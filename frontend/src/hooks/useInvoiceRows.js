import { useState, useEffect, useCallback } from "react";

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

    // Validate all rows and update errors
    const validateRows = useCallback(() => {
        const totalRows = rows.length;

        // For all rows except possibly the last one (unless it's the only row)
        const updatedErrors = rows.map((row, index) => {
            // Only validate the last row if it's the only row
            if (index === totalRows - 1 && totalRows > 1) {
                return {}; // Don't validate the last row if there are multiple rows
            }
            const errors = validateRowFn(row, index, rows);
            return errors;
        });

        setRowErrors(updatedErrors);

        // Form is valid if all non-last rows are valid and at least one row is valid
        const rowsToValidate = totalRows > 1 ? rows.slice(0, -1) : rows;

        const isEachRequiredRowValid = rowsToValidate.every(
            (row, index) => Object.keys(updatedErrors[index] || {}).length === 0
        );

        const atLeastOneValidRow = rows.some(
            (row, index) =>
                Object.keys(validateRowFn(row, index, rows) || {}).length === 0
        );

        setIsFormValid(isEachRequiredRowValid && atLeastOneValidRow);

        return updatedErrors;
    }, [rows, validateRowFn]);

    // Update row validation whenever dependencies change
    useEffect(() => {
        // Run validation immediately on mount and when dependencies change
        const timer = setTimeout(() => {
            validateRows();
        }, 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [validateRows, ...(dependencies || [])]);

    // Handle row change
    const handleRowChange = useCallback(
        (index, key, value) => {
            const updatedRows = [...rows];
            updatedRows[index][key] = value;

            // Immediately validate the current row
            const newError = validateRowFn(
                updatedRows[index],
                index,
                updatedRows
            );
            const updatedErrors = [...rowErrors];
            updatedErrors[index] = newError;

            setRows(updatedRows);
            setRowErrors(updatedErrors);
        },
        [rows, rowErrors, validateRowFn]
    );

    // Add a new row
    const addRow = useCallback(() => {
        // Check if all existing rows are valid before adding a new one
        const errors = validateRows();
        const allValid = errors.every((err, i) => {
            // Skip validation for the last row if there are multiple rows
            if (i === rows.length - 1 && rows.length > 1) return true;
            return Object.keys(err).length === 0;
        });

        if (!allValid) return;

        setRows((prev) => [...prev, { ...initialRow }]);
        setRowErrors((prev) => [...prev, {}]);
    }, [rows, initialRow, validateRows]);

    // Remove a row
    const removeRow = useCallback(
        (index) => {
            if (rows.length <= 1) return; // Don't remove the last row

            const updatedRows = rows.filter((_, i) => i !== index);
            const updatedErrors = rowErrors.filter((_, i) => i !== index);

            setRows(updatedRows);
            setRowErrors(updatedErrors);

            // Re-validate after removing a row
            setTimeout(validateRows, 0);
        },
        [rows, rowErrors, validateRows]
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
    };
}
