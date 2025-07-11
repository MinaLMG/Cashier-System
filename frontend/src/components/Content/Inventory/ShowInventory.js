import classes from "./ShowInventory.module.css";
import commonStyles from "../../../styles/common.module.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
export default function ShowInventory(props) {
    const [inventory, setInventory] = useState([]);
    useEffect(() => {
        axios
            .get(process.env.REACT_APP_BACKEND + "products/full")
            .then((res) => {
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
                        <th scope="col" className={classes.head}>
                            الباقى حاليا
                        </th>

                        <th
                            scope="col"
                            style={{ width: "220px" }}
                            className={classes.head}
                        >
                            مش عاوزينها تقل عن
                        </th>
                        <th
                            scope="col"
                            style={{ width: "220px" }}
                            className={classes.head}
                        ></th>
                    </tr>
                </thead>
                <tbody>
                    {inventory.length === 0 ? (
                        <tr>
                            <td colSpan="6" className={classes.item}>
                                لا توجد بضاعة شراء حتى الآن
                            </td>
                        </tr>
                    ) : (
                        inventory.map((inv, i) => {
                            inv.values.sort((a, b) => a.val - b.val);
                            return (
                                <tr key={i}>
                                    <th className={classes.item} scope="row">
                                        {i + 1}
                                    </th>
                                    <td className={classes.item}>{inv.name}</td>
                                    <td className={classes.item}>
                                        {inv.values.map((v, di) => (
                                            <div key={di}>
                                                {v.name} : {v.val}
                                            </div>
                                        ))}
                                    </td>
                                    <td className={classes.item}>
                                        {inv.total_remaining}
                                    </td>
                                    <td className={classes.item}>
                                        {inv["min-stock"]
                                            ? inv["min-stock"]
                                            : ""}
                                    </td>
                                    <td className={classes.item}>
                                        <FaEdit
                                            onClick={() => {
                                                props.onEdit(inv);
                                            }}
                                            className={classes.edit}
                                        />
                                        <MdDelete
                                            className={`${classes.remove} ${commonStyles.disabledIcon}`}
                                            title="حذف المنتج غير متاح حاليًا"
                                        />
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}
