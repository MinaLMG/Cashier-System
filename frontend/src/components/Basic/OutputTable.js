import React from "react";
import classes from "./OutputTable.module.css";

const OutputTable = ({
    children,
    className = "",
    wrapperClassName = "",
    error = "",
}) => {
    return (
        <div className={`${classes.outputTableWrapper} ${wrapperClassName}`}>
            <table className={`${classes.outputTable} ${className}`}>
                {children}
            </table>
            {error && <div className={classes.errorText}>{error}</div>}
        </div>
    );
};

export default OutputTable;
