import classes from "../ShowInvoices/ShowPurchaseInvoices.module.css"; // reuse same styles
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import CustomerForm from "./CustomerForm";
import Modal from "../../general/Modal";

export default function ShowCustomers() {
    const [customers, setCustomers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const res = await axios.get(
                process.env.REACT_APP_BACKEND + "customers"
            );
            setCustomers(res.data);
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const handleEdit = (customer) => {
        setCurrentCustomer(customer);
        setIsEditing(true);
        setShowForm(true);
    };

    const confirmDelete = (customer) => {
        setCustomerToDelete(customer);
        setShowModal(true);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(
                `${process.env.REACT_APP_BACKEND}customers/${customerToDelete._id}`
            );
            fetchCustomers();
            setShowModal(false);
        } catch (error) {
            console.error("Error deleting customer:", error);
        }
    };

    const handleFormSubmit = () => {
        setShowForm(false);
        setCurrentCustomer(null);
        setIsEditing(false);
        fetchCustomers();
    };

    return (
        <div style={{ width: "70%", margin: "100px auto" }}>
            {showModal && (
                <Modal
                    onHide={() => setShowModal(false)}
                    data={{
                        header: "حذف العميل",
                        message: `هل أنت متأكد من حذف العميل "${customerToDelete?.name}"؟`,
                        button: "حذف",
                    }}
                    onOk={handleDelete}
                />
            )}

            {showForm ? (
                <CustomerForm
                    customer={currentCustomer}
                    isEditing={isEditing}
                    onSubmit={handleFormSubmit}
                    onCancel={() => {
                        setShowForm(false);
                        setCurrentCustomer(null);
                        setIsEditing(false);
                    }}
                />
            ) : (
                <>
                    <div className="d-flex justify-content-between mb-3">
                        <h2 className={classes.title}>العملاء</h2>
                        <button
                            className={`btn btn-primary ${classes.addButton}`}
                            onClick={() => {
                                setIsEditing(false);
                                setCurrentCustomer(null);
                                setShowForm(true);
                            }}
                        >
                            إضافة عميل جديد
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
                                <th className={classes.head}>العنوان</th>
                                <th className={classes.head}>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className={classes.item}>
                                        لا يوجد عملاء حتى الآن
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer, index) => (
                                    <tr key={customer._id}>
                                        <td className={classes.item}>
                                            {index + 1}
                                        </td>
                                        <td className={classes.item}>
                                            {customer.name}
                                        </td>
                                        <td className={classes.item}>
                                            {customer.phone || "--"}
                                        </td>
                                        <td className={classes.item}>
                                            {customer.address || "--"}
                                        </td>
                                        <td className={classes.item}>
                                            <FaEdit
                                                onClick={() =>
                                                    handleEdit(customer)
                                                }
                                                className={classes.edit}
                                            />
                                            <MdDelete
                                                onClick={() =>
                                                    confirmDelete(customer)
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
