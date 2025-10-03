import React from "react";
import classes from "./InputTable.module.css";

const InputTable = ({
    children,
    className = "",
    wrapperClassName = "",
    error = "",
}) => {
    return (
        <div className={`${classes.inputTableWrapper} ${wrapperClassName}`}>
            <table className={`${classes.inputTable} ${className}`}>
                {children}
            </table>
            {error && <div className={classes.errorText}>{error}</div>}
        </div>
    );
};

export default InputTable;
