import classes from "./ShowInventory.module.css";
import commonStyles from "../../../styles/common.module.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import SortableTable from "../../Basic/SortableTable";
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
        <div style={{ width: "90%", maxWidth: "1200px", margin: "100px auto" }}>
            <SortableTable
                columns={[
                    { key: "index", title: "#", sortable: false },
                    { field: "name", title: "اسم المنتج" },
                    { key: "volumes", title: "العبوات", sortable: false },
                    { field: "total_remaining", title: "الباقى حاليا" },
                    {
                        field: "min_stock",
                        title: "مش عاوزينها تقل عن",
                        sortable: false,
                    },
                    { key: "actions", title: "الإجراءات", sortable: false },
                ]}
                data={inventory}
                initialSortField="name"
                initialSortDirection="asc"
                tableClassName={`table table-bordered ${classes.table}`}
                renderRow={(inv, index) => {
                    inv.values.sort((a, b) => a.val - b.val);
                    return (
                        <tr key={inv._id || index}>
                            <td className={classes.item}>{index + 1}</td>
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
                                {inv["min-stock"] ? inv["min-stock"] : ""}
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
                }}
                emptyMessage="لا توجد بضاعة شراء حتى الآن"
            />
        </div>
    );
}
