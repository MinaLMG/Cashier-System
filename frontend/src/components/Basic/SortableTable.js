import React, { useState } from "react";
import { FaSortDown, FaSortUp, FaSort } from "react-icons/fa";
import classes from "./SortableTable.module.css";
import OutputTable from "./OutputTable";

const SortableTable = ({
    columns,
    data,
    initialSortField = null,
    initialSortDirection = "asc",
    tableClassName = "",
    renderRow,
    emptyMessage = "لا توجد بيانات",
    width = "90%",
    containingErros = true,
}) => {
    const [sortField, setSortField] = useState(initialSortField);
    const [sortDirection, setSortDirection] = useState(initialSortDirection);

    // Handle sort click
    const handleSort = (field) => {
        if (sortField === field) {
            // Toggle direction or clear sort
            if (sortDirection === "asc") {
                setSortDirection("desc");
            } else if (sortDirection === "desc") {
                setSortField(null);
                setSortDirection("asc");
            }
        } else {
            // New sort field
            setSortField(field);
            setSortDirection("asc");
        }
    };

    // Get sort icon
    const getSortIcon = (field) => {
        if (sortField !== field) {
            return <FaSort className={classes.sortIcon} />;
        }
        return sortDirection === "asc" ? (
            <FaSortUp className={classes.sortIcon} />
        ) : (
            <FaSortDown className={classes.sortIcon} />
        );
    };

    // Sort data
    const sortedData = [...data];
    if (sortField) {
        sortedData.sort((a, b) => {
            // Handle nested fields (e.g. "customer.name")
            const getNestedValue = (obj, path) => {
                return path
                    .split(".")
                    .reduce(
                        (o, key) => (o && o[key] !== undefined ? o[key] : null),
                        obj
                    );
            };

            let aValue = getNestedValue(a, sortField);
            let bValue = getNestedValue(b, sortField);

            // Handle different data types
            if (typeof aValue === "string" && typeof bValue === "string") {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            } else if (aValue instanceof Date && bValue instanceof Date) {
                aValue = aValue.getTime();
                bValue = bValue.getTime();
            } else if (aValue === null || aValue === undefined) {
                return sortDirection === "asc" ? 1 : -1;
            } else if (bValue === null || bValue === undefined) {
                return sortDirection === "asc" ? -1 : 1;
            }

            // Compare values
            if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
            if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
            return 0;
        });
    }

    return (
        <OutputTable className={tableClassName}>
            <thead>
                <tr>
                    {columns.map((column) => (
                        <th
                            key={column.field || column.key}
                            onClick={() =>
                                column.sortable !== false &&
                                handleSort(column.field)
                            }
                            className={
                                column.sortable !== false
                                    ? classes.sortableHeader
                                    : ""
                            }
                            style={{
                                width:
                                    column.width || `${100 / columns.length}%`,
                            }}
                        >
                            <div className={classes.headerContent}>
                                <span>{column.title}</span>
                                {column.sortable !== false && (
                                    <span className={classes.sortIconContainer}>
                                        {getSortIcon(column.field)}
                                    </span>
                                )}
                            </div>
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {sortedData.length === 0 ? (
                    <tr>
                        <td
                            colSpan={columns.length}
                            className={classes.emptyMessage}
                        >
                            {emptyMessage}
                        </td>
                    </tr>
                ) : (
                    sortedData.map((item, index) => renderRow(item, index))
                )}
            </tbody>
        </OutputTable>
    );
};

export default SortableTable;
