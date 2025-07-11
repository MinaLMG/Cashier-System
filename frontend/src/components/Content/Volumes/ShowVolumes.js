import classes from "../ShowInvoices/ShowPurchaseInvoices.module.css"; // reuse same styles
import commonStyles from "../../../styles/common.module.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit } from "react-icons/fa";
import { MdDelete } from "react-icons/md";
import VolumeForm from "./VolumeForm";
import Modal from "../../general/Modal";

export default function ShowVolumes() {
    const [volumes, setVolumes] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [currentVolume, setCurrentVolume] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [volumeToDelete, setVolumeToDelete] = useState(null);

    useEffect(() => {
        fetchVolumes();
    }, []);

    const fetchVolumes = async () => {
        try {
            const res = await axios.get(
                process.env.REACT_APP_BACKEND + "volumes"
            );
            setVolumes(res.data);
        } catch (error) {
            console.error("Error fetching volumes:", error);
        }
    };

    const handleEdit = (volume) => {
        setCurrentVolume(volume);
        setIsEditing(true);
        setShowForm(true);
    };

    const confirmDelete = (volume) => {
        setVolumeToDelete(volume);
        setShowModal(true);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(
                `${process.env.REACT_APP_BACKEND}volumes/${volumeToDelete._id}`
            );
            fetchVolumes();
            setShowModal(false);
        } catch (error) {
            console.error("Error deleting volume:", error);
        }
    };

    const handleFormSubmit = () => {
        setShowForm(false);
        setCurrentVolume(null);
        setIsEditing(false);
        fetchVolumes();
    };

    return (
        <div style={{ width: "70%", margin: "100px auto" }}>
            {showModal && (
                <Modal
                    onHide={() => setShowModal(false)}
                    data={{
                        header: "حذف العبوة",
                        message: `هل أنت متأكد من حذف العبوة "${volumeToDelete?.name}"؟`,
                        button: "حذف",
                    }}
                    onOk={handleDelete}
                />
            )}

            {showForm ? (
                <VolumeForm
                    volume={currentVolume}
                    isEditing={isEditing}
                    onSubmit={handleFormSubmit}
                    onCancel={() => {
                        setShowForm(false);
                        setCurrentVolume(null);
                        setIsEditing(false);
                    }}
                />
            ) : (
                <>
                    <div className="d-flex justify-content-between mb-3">
                        <h2 className={classes.title}>العبوات</h2>
                        <button
                            className={`btn btn-primary ${classes.addButton}`}
                            onClick={() => {
                                setIsEditing(false);
                                setCurrentVolume(null);
                                setShowForm(true);
                            }}
                        >
                            إضافة عبوة جديدة
                        </button>
                    </div>
                    <table
                        className={`table table-light table-hover table-bordered border-secondary ${classes.table}`}
                    >
                        <thead>
                            <tr>
                                <th className={classes.head}>#</th>
                                <th className={classes.head}>الاسم</th>
                                <th className={classes.head}>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {volumes.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className={classes.item}>
                                        لا توجد عبوات حتى الآن
                                    </td>
                                </tr>
                            ) : (
                                volumes.map((volume, index) => (
                                    <tr key={volume._id}>
                                        <td className={classes.item}>
                                            {index + 1}
                                        </td>
                                        <td className={classes.item}>
                                            {volume.name}
                                        </td>
                                        <td className={classes.item}>
                                            <FaEdit
                                                onClick={() =>
                                                    handleEdit(volume)
                                                }
                                                className={classes.edit}
                                            />
                                            <MdDelete
                                                onClick={() =>
                                                    confirmDelete(volume)
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
