import classes from "../ShowInvoices/ShowPurchaseInvoices.module.css"; // reuse same styles
import commonStyles from "../../../styles/common.module.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaEye } from "react-icons/fa";
// Customer deletion functionality disabled
// import { MdDelete } from "react-icons/md";
import CustomerForm from "./CustomerForm";
// Customer deletion modal disabled
// import Modal from "../../general/Modal";
import SortableTable from "../../Basic/SortableTable";

export default function ShowCustomers() {
    const [customers, setCustomers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [currentCustomer, setCurrentCustomer] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    // Customer deletion state disabled
    // const [showModal, setShowModal] = useState(false);
    // const [customerToDelete, setCustomerToDelete] = useState(null);

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
        setIsViewing(false);
        setShowForm(true);
    };

    const handleView = (customer) => {
        setCurrentCustomer(customer);
        setIsEditing(false);
        setIsViewing(true);
        setShowForm(true);
    };

    // Customer deletion functions disabled
    // const confirmDelete = (customer) => {
    //     setCustomerToDelete(customer);
    //     setShowModal(true);
    // };

    // const handleDelete = async () => {
    //     try {
    //         await axios.delete(
    //             `${process.env.REACT_APP_BACKEND}customers/${customerToDelete._id}`
    //         );
    //         fetchCustomers();
    //         setShowModal(false);
    //     } catch (error) {
    //         console.error("Error deleting customer:", error);
    //     }
    // };

    const handleFormSubmit = () => {
        setShowForm(false);
        setCurrentCustomer(null);
        setIsEditing(false);
        setIsViewing(false);
        fetchCustomers();
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
            {/* Customer deletion modal disabled */}
            {/* {showModal && (
                <Modal
                    onHide={() => setShowModal(false)}
                    data={{
                        header: "حذف العميل",
                        message: `هل أنت متأكد من حذف العميل "${customerToDelete?.name}"؟`,
                        button: "حذف",
                    }}
                    onOk={handleDelete}
                />
            )} */}

            {showForm ? (
                <CustomerForm
                    customer={currentCustomer}
                    isEditing={isEditing}
                    mode={isViewing ? "view" : isEditing ? "edit" : "add"}
                    onSubmit={handleFormSubmit}
                    onCancel={() => {
                        setShowForm(false);
                        setCurrentCustomer(null);
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
                            العملاء
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
                                setCurrentCustomer(null);
                                setShowForm(true);
                            }}
                        >
                            إضافة عميل جديد
                        </button>
                    </div>
                    <SortableTable
                        columns={[
                            { key: "index", title: "#", sortable: false },
                            { field: "name", title: "الاسم" },
                            { field: "phone", title: "رقم الهاتف" },
                            { field: "address", title: "العنوان" },
                            {
                                key: "actions",
                                title: "الإجراءات",
                                sortable: false,
                            },
                        ]}
                        data={customers}
                        initialSortField="name"
                        initialSortDirection="asc"
                        tableClassName={`table table-bordered ${classes.table}`}
                        renderRow={(customer, index) => (
                            <tr key={customer._id}>
                                <td className={classes.item}>{index + 1}</td>
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
                                    <div className="d-flex justify-content-around">
                                        <FaEdit
                                            onClick={() => handleEdit(customer)}
                                            className={classes.edit}
                                        />
                                        <FaEye
                                            onClick={() => handleView(customer)}
                                            className={classes.view}
                                            title="عرض تفاصيل العميل"
                                        />
                                        {/* Customer deletion button disabled */}
                                        {/* <MdDelete
                                            onClick={() =>
                                                confirmDelete(customer)
                                            }
                                            className={classes.remove}
                                        /> */}
                                    </div>
                                </td>
                            </tr>
                        )}
                        emptyMessage="لا يوجد عملاء حتى الآن"
                    />
                </>
            )}
        </div>
    );
}
