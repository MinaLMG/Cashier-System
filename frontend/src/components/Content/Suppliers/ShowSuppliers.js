import classes from "../ShowInvoices/ShowPurchaseInvoices.module.css"; // reuse same styles
import commonStyles from "../../../styles/common.module.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaEye } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import SupplierForm from "./SupplierForm";
import Modal from "../../general/Modal";

export default function ShowSuppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState(null);

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
        setShowForm(true);
    };

    const confirmDelete = (supplier) => {
        setSupplierToDelete(supplier);
        setShowModal(true);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(
                `${process.env.REACT_APP_BACKEND}suppliers/${supplierToDelete._id}`
            );
            fetchSuppliers();
            setShowModal(false);
        } catch (error) {
            console.error("Error deleting supplier:", error);
        }
    };

    const handleFormSubmit = () => {
        setShowForm(false);
        setCurrentSupplier(null);
        setIsEditing(false);
        fetchSuppliers();
    };

    return (
        <div style={{ width: "70%", margin: "100px auto" }}>
            {showModal && (
                <Modal
                    onHide={() => setShowModal(false)}
                    data={{
                        header: "حذف المورد",
                        message: `هل أنت متأكد من حذف المورد "${supplierToDelete?.name}"؟`,
                        button: "حذف",
                    }}
                    onOk={handleDelete}
                />
            )}

            {showForm ? (
                <SupplierForm
                    supplier={currentSupplier}
                    isEditing={isEditing}
                    onSubmit={handleFormSubmit}
                    onCancel={() => {
                        setShowForm(false);
                        setCurrentSupplier(null);
                        setIsEditing(false);
                    }}
                />
            ) : (
                <>
                    <div className="d-flex justify-content-between mb-3">
                        <h2 className={classes.title}>الموردين</h2>
                        <button
                            className={`btn btn-primary ${classes.addButton}`}
                            onClick={() => {
                                setIsEditing(false);
                                setCurrentSupplier(null);
                                setShowForm(true);
                            }}
                        >
                            إضافة مورد جديد
                        </button>
                    </div>
                    <table
                        className={`table table-light table-hover table-bordered border-secondary ${classes.table}`}
                    >
                        <thead>
                            <tr>
                                <th className={classes.head}>#</th>
                                <th className={classes.head}>الاسم</th>
                                <th className={classes.head}>رقم الهاتف</th>
                                <th className={classes.head}>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className={classes.item}>
                                        لا يوجد موردين حتى الآن
                                    </td>
                                </tr>
                            ) : (
                                suppliers.map((supplier, index) => (
                                    <tr key={supplier._id}>
                                        <td className={classes.item}>
                                            {index + 1}
                                        </td>
                                        <td className={classes.item}>
                                            {supplier.name}
                                        </td>
                                        <td className={classes.item}>
                                            {supplier.phone || "--"}
                                        </td>
                                        <td className={classes.item}>
                                            <FaEdit
                                                onClick={() =>
                                                    handleEdit(supplier)
                                                }
                                                className={classes.edit}
                                            />
                                            <FaEye
                                                className={`${classes.view} ${commonStyles.disabledIcon}`}
                                                title="عرض التفاصيل غير متاح حاليًا"
                                            />
                                            <MdDelete
                                                onClick={() =>
                                                    confirmDelete(supplier)
                                                }
                                                className={classes.remove}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}
