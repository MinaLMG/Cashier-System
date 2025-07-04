import classes from "./ShowInventory.module.css";
import React, { useState, useEffect, Fragment } from "react";
import axios from "axios";

export default function ShowInventory() {
    const [inventory, setInventory] = useState([]);
    useEffect(() => {
        axios
            .get(process.env.REACT_APP_BACKEND + "products/full")
            .then((res) => {
                console.log(res.data);
                setInventory(res.data);
            })
            .catch((err) => console.error("Failed to fetch volumes:", err));
    }, []);
    return (
        <div style={{ width: "70%", margin: "100px auto " }}>
            <table
                className={`table  table-light table-hover table-bordered border-secondary ${classes.table}`}
            >
                <thead>
                    <tr>
                        <th className={classes.head} scope="col"></th>
                        <th className={classes.head} scope="col">
                            اسم المنتج
                        </th>
                        <th className={classes.head} scope="col">
                            العبوات
                        </th>
                        <th
                            scope="col"
                            style={{ width: "220px" }}
                            className={classes.head}
                        >
                            مش عاوزينها تقل عن
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {inventory.map((inv, i) => {
                        inv.values.sort((a, b) => a.val - b.val);
                        return (
                            <tr>
                                <Fragment key={i}>
                                    <td className={classes.item} scope="row">
                                        {i + 1}
                                    </td>
                                    <td className={classes.item}>
                                        {" "}
                                        {inv.name}
                                    </td>
                                    <td className={classes.item}>
                                        {inv.values.map((v) => (
                                            <div>
                                                {v.name} : {v.val}
                                            </div>
                                        ))}
                                    </td>
                                    <td className={classes.item}>
                                        {inv["min-stock"]
                                            ? inv["min-stock"]
                                            : ""}
                                    </td>
                                </Fragment>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
