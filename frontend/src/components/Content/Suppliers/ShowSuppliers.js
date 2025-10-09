import classes from "../ShowInvoices/ShowPurchaseInvoices.module.css"; // reuse same styles
import commonStyles from "../../../styles/common.module.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaEye } from "react-icons/fa";
// Supplier deletion functionality disabled
// import { MdDelete } from "react-icons/md";
import SupplierForm from "./SupplierForm";
// Supplier deletion modal disabled
// import Modal from "../../general/Modal";
import SortableTable from "../../Basic/SortableTable";

export default function ShowSuppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    // Supplier deletion state disabled
    // const [showModal, setShowModal] = useState(false);
    // const [supplierToDelete, setSupplierToDelete] = useState(null);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const res = await axios.get(
                process.env.REACT_APP_BACKEND + "suppliers"
            );
            setSuppliers(res.data);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        }
    };

    const handleEdit = (supplier) => {
        setCurrentSupplier(supplier);
        setIsEditing(true);
        setIsViewing(false);
        setShowForm(true);
    };

    const handleView = (supplier) => {
        setCurrentSupplier(supplier);
        setIsEditing(false);
        setIsViewing(true);
        setShowForm(true);
    };

    // Supplier deletion functions disabled
    // const confirmDelete = (supplier) => {
    //     setSupplierToDelete(supplier);
    //     setShowModal(true);
    // };

    // const handleDelete = async () => {
    //     try {
    //         await axios.delete(
    //             `${process.env.REACT_APP_BACKEND}suppliers/${supplierToDelete._id}`
    //         );
    //         fetchSuppliers();
    //         setShowModal(false);
    //     } catch (error) {
    //         console.error("Error deleting supplier:", error);
    //     }
    // };

    const handleFormSubmit = () => {
        setShowForm(false);
        setCurrentSupplier(null);
        setIsEditing(false);
        setIsViewing(false);
        fetchSuppliers();
    };

    return (
        <div
            style={{
                width: "100%",
                maxWidth: "90%",
                margin: "100px auto",
                padding: "0 20px",
            }}
        >
            {/* Supplier deletion modal disabled */}
            {/* {showModal && (
                <Modal
                    onHide={() => setShowModal(false)}
                    data={{
                        header: "حذف المورد",
                        message: `هل أنت متأكد من حذف المورد "${supplierToDelete?.name}"؟`,
                        button: "حذف",
                    }}
                    onOk={handleDelete}
                />
            )} */}

            {showForm ? (
                <SupplierForm
                    supplier={currentSupplier}
                    isEditing={isEditing}
                    mode={isViewing ? "view" : isEditing ? "edit" : "add"}
                    onSubmit={handleFormSubmit}
                    onCancel={() => {
                        setShowForm(false);
                        setCurrentSupplier(null);
                        setIsEditing(false);
                        setIsViewing(false);
                    }}
                />
            ) : (
                <>
                    <div className="d-flex justify-content-between mb-3">
                        <h2
                            className={classes.title}
                            style={{
                                color: "var(--text-color)",
                                fontWeight: "bold",
                                fontSize: "var(--font-size-xl)",
                                margin: 0,
                            }}
                        >
                            الموردين
                        </h2>
                        <button
                            className={`btn ${classes.addButton}`}
                            style={{
                                background:
                                    "linear-gradient(135deg, var(--secondary-color), var(--secondary-light))",
                                border: "none",
                                color: "white",
                                padding: "12px 24px",
                                borderRadius: "var(--border-radius-md)",
                                fontWeight: "bold",
                                boxShadow: "var(--shadow-md)",
                                transition: "all 0.3s ease",
                            }}
                            onClick={() => {
                                setIsEditing(false);
                                setIsViewing(false);
                                setCurrentSupplier(null);
                                setShowForm(true);
                            }}
                        >
                            إضافة مورد جديد
                        </button>
                    </div>
                    <SortableTable
                        columns={[
                            { key: "index", title: "#", sortable: false },
                            { field: "name", title: "الاسم" },
                            { field: "phone", title: "رقم الهاتف" },
                            {
                                key: "actions",
                                title: "الإجراءات",
                                sortable: false,
                            },
                        ]}
                        data={suppliers}
                        initialSortField="name"
                        initialSortDirection="asc"
                        tableClassName={`table table-bordered ${classes.table}`}
                        renderRow={(supplier, index) => (
                            <tr key={supplier._id}>
                                <td className={classes.item}>{index + 1}</td>
                                <td className={classes.item}>
                                    {supplier.name}
                                </td>
                                <td className={classes.item}>
                                    {supplier.phone || "--"}
                                </td>
                                <td className={classes.item}>
                                    <div className="d-flex justify-content-around">
                                        <FaEdit
                                            onClick={() => handleEdit(supplier)}
                                            className={classes.edit}
                                        />
                                        <FaEye
                                            onClick={() => handleView(supplier)}
                                            className={classes.view}
                                            title="عرض تفاصيل المورد"
                                        />
                                        {/* Supplier deletion button disabled */}
                                        {/* <MdDelete
                                            onClick={() =>
                                                confirmDelete(supplier)
                                            }
                                            className={classes.remove}
                                        /> */}
                                    </div>
                                </td>
                            </tr>
                        )}
                        emptyMessage="لا يوجد موردين حتى الآن"
                    />
                </>
            )}
        </div>
    );
}
