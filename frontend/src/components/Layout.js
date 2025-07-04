import Header from "./Header/Header";
import classes from "./Layout.module.css";
import { Fragment, useState } from "react";
import Side from "./Side/Side";
import Content from "./Content/Content";
import Modal from "./general/Modal";
export default function Layout() {
    const actions = [
        {
            title: "بضاعة المخزن",
            tasks: ["زود منتج", "عدل منتج", "اعرض كل البضاعة"],
        },
        {
            title: "الفواتير",
            tasks: ["زود فاتورة", "عدل فاتورة", "اعرض كل الفواتير"],
        },
    ];
    const [selected, setSelected] = useState("");
    function changeSelected(ch) {
        setSelected(ch);
    }
    const [productToEdit, setProductToEdit] = useState({
        name: "",
        "min-stock": "",
        conversions: [{ from: "", to: "", value: 1, barcode: "" }],
        values: [],
        error: "ادخل الوحدة الاساسية",
    });
    const [onEditSuccess, setOnEditSuccess] = useState(null);
    const executeSuccess = () => {
        switch (onEditSuccess) {
            case "reset":
                setSelected("اعرض كل البضاعة");
                setProductToEdit({
                    name: "",
                    "min-stock": "",
                    conversions: [{ from: "", to: "", value: 1, barcode: "" }],
                    values: [],
                    error: "ادخل الوحدة الاساسية",
                });
                setOnEditSuccess("");
                break;

            default:
                break;
        }
    };
    return (
        <Fragment>
            <Header></Header>
            {/* <Modal
                onHide={() => {}}
                data={{
                    header: "حذف الاجتماع ",
                    message:
                        "متأكد انك عاوز تحذفه ؟ لو مش عاوز دوس علامة الغلط او برة البلوك ده :D",
                    button: "أيوة",
                }}
                onOk={() => {}}
            ></Modal> */}
            <div className={classes["body"]}>
                <Side
                    selected={selected}
                    onSelect={changeSelected}
                    actions={actions}
                ></Side>
                <Content
                    selected={selected}
                    onEdit={(e) => {
                        setProductToEdit(e);
                        setOnEditSuccess("reset");
                        setSelected("عدل منتج");
                    }}
                    productToEdit={productToEdit}
                    onEditSuccess={() => {
                        executeSuccess();
                    }}
                ></Content>
            </div>
            ;
        </Fragment>
    );
}
