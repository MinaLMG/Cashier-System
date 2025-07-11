import Header from "./Header/Header";
import classes from "./Layout.module.css";
import { Fragment, useState } from "react";
import Side from "./Side/Side";
import Content from "./Content/Content";
// import Modal from "./Modal/Modal";
export default function Layout() {
    const actions = [
        {
            title: "بضاعة المخزن",
            tasks: ["زود منتج", "عدل منتج", "اعرض كل البضاعة"],
        },
        {
            title: "الفواتير",
            tasks: [
                "زود فاتورة بيع",
                "عدل فاتورة بيع",
                "اعرض كل فواتير البيع",
                "زود فاتورة مشتريات",
                "عدل فاتورة مشتريات",
                "اعرض كل فواتير المشتريات",
            ],
        },
        {
            title: "التقارير",
            tasks: ["تقرير الإيرادات"],
        },
        {
            title: "إدارة البيانات",
            tasks: ["إدارة الموردين", "إدارة العملاء", "إدارة العبوات"],
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
    const [onEditProductSuccess, setOnEditProductSuccess] = useState(null);
    const executeEditProductSuccess = () => {
        switch (onEditProductSuccess) {
            case "reset":
                setSelected("اعرض كل البضاعة");
                setProductToEdit({
                    name: "",
                    "min-stock": "",
                    conversions: [{ from: "", to: "", value: 1, barcode: "" }],
                    values: [],
                    error: "ادخل الوحدة الاساسية",
                });
                setOnEditProductSuccess("");
                break;

            default:
                break;
        }
    };
    const [purchaseInvoiceToEdit, setPurchaseInvoiceToEdit] = useState({
        date: new Date().toISOString(),
        supplier: null,
        rows: [
            {
                _id: null,
                product: null,
                quantity: "",
                volume: null,
                v_buy_price: "",
                v_pharmacy_price: "",
                v_walkin_price: "",
                expiry: "",
                remaining: "",
            },
        ],
        total_cost: "0", // Was 'cost'
    });
    const [onEditPurchaseInvoiceSuccess, setOnEditPurchaseInvoiceSuccess] =
        useState(null);
    const executeEditPurchaseInvoiceSuccess = () => {
        switch (onEditPurchaseInvoiceSuccess) {
            case "reset":
                setSelected("اعرض كل فواتير المشتريات");
                setPurchaseInvoiceToEdit({
                    date: new Date().toISOString(),
                    supplier: null,
                    rows: [
                        {
                            _id: null,
                            product: null,
                            quantity: "",
                            volume: null,
                            v_buy_price: "",
                            v_pharmacy_price: "",
                            v_walkin_price: "",
                            expiry: "",
                            remaining: "",
                        },
                    ],
                    total_cost: "0", // Was 'cost'
                });
                setOnEditPurchaseInvoiceSuccess("");
                break;

            default:
                break;
        }
    };
    const [salesInvoiceToEdit, setSalesInvoiceToEdit] = useState({
        customer: "",
        type: "walkin",
        date: new Date().toISOString(),
        offer: 0,
        rows: [
            {
                barcode: "",
                product: "",
                volume: "",
                quantity: "",
            },
        ],
    });
    const [onEditSalesInvoiceSuccess, setOnEditSalesInvoiceSuccess] =
        useState(null);
    const executeEditSalesInvoiceSuccess = () => {
        switch (onEditSalesInvoiceSuccess) {
            case "reset":
                setSelected("اعرض كل فواتير البيع");
                setSalesInvoiceToEdit({
                    customer: "",
                    type: "walkin",
                    date: new Date().toISOString(),
                    offer: 0,
                    rows: [
                        {
                            barcode: "",
                            product: "",
                            volume: "",
                            quantity: "",
                        },
                    ],
                });
                setOnEditSalesInvoiceSuccess("");
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
                    /*** edit product props   ***/
                    onEditProduct={(e) => {
                        setProductToEdit(e);
                        setOnEditProductSuccess("reset");
                        setSelected("عدل منتج");
                    }}
                    productToEdit={productToEdit}
                    onEditProductSuccess={() => {
                        executeEditProductSuccess();
                    }}
                    /*** edit purchaseInvoice props   ***/
                    onEditPurchaseInvoice={(e) => {
                        setPurchaseInvoiceToEdit(e);
                        setOnEditPurchaseInvoiceSuccess("reset");
                        setSelected("عدل فاتورة مشتريات");
                    }}
                    purchaseInvoiceToEdit={purchaseInvoiceToEdit}
                    onEditPurchaseInvoiceSuccess={() => {
                        executeEditPurchaseInvoiceSuccess();
                    }}
                    /*** edit salesInvoice props   ***/
                    onEditSalesInvoice={(e) => {
                        setSalesInvoiceToEdit(e);
                        setOnEditSalesInvoiceSuccess("reset");
                        setSelected("عدل فاتورة بيع");
                    }}
                    salesInvoiceToEdit={salesInvoiceToEdit}
                    onEditSalesInvoiceSuccess={() => {
                        executeEditSalesInvoiceSuccess();
                    }}
                ></Content>
            </div>
            ;
        </Fragment>
    );
}
