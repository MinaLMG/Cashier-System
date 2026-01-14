import ShowInventory from "./Inventory/ShowInventory";
import ProductForm from "./AddProduct/ProductForm";
import ProductDetails from "./Inventory/ProductDetails";
import classes from "./Content.module.css";
import PurchaseInvoice from "./PurchaseInvoice/PurchaseInvoice";
import ShowPurchaseInvoices from "./ShowInvoices/ShowPurchaseInvoices";
import SalesInvoice from "./SalesInvoices/SalesInvoice";
import ShowSalesInvoices from "./ShowInvoices/ShowSalesInvoices";
import ShowSuppliers from "./Suppliers/ShowSuppliers";
import ShowCustomers from "./Customers/ShowCustomers";
import ShowVolumes from "./Volumes/ShowVolumes";
import Revenue from "./Revenue/Revenue";
import CombinedInvoices from "./SalesInvoices/CombinedInvoices";
import ProductMovement from "./ProductMovement/ProductMovement";
import Notifications from "./Notifications/Notifications";
import CreditCustomers from "./CreditCustomers/CreditCustomers";
import PaymentManager from "./CreditCustomers/PaymentManager";
import Settings from "../Settings/Settings";

export default function Content(props) {
    return (
        <div className={classes["content"]}>
            {props.selected === "زود منتج" && <ProductForm mode="add" />}
            {props.selected === "عدل منتج" && (
                <ProductForm
                    mode="edit"
                    product={props.productToEdit}
                    onSuccess={props.onEditProductSuccess}
                    onBack={props.onBackFromView}
                />
            )}
            {props.selected === "اعرض كل البضاعة" && (
                <ShowInventory
                    onEdit={(e) => {
                        props.onEditProduct(e);
                    }}
                    onView={(e) => {
                        props.onViewProduct(e);
                    }}
                ></ShowInventory>
            )}
            {props.selected === "عرض تفاصيل المنتج" && (
                <ProductDetails
                    product={props.productToView}
                    onBack={props.onBackFromView}
                />
            )}
            {props.selected === "زود فاتورة مشتريات" && (
                <PurchaseInvoice mode="add"></PurchaseInvoice>
            )}
            {props.selected === "عدل فاتورة مشتريات" && (
                <PurchaseInvoice
                    mode="edit"
                    invoice={props.purchaseInvoiceToEdit}
                    onSuccess={props.onEditPurchaseInvoiceSuccess}
                    onBack={props.onBackFromView}
                ></PurchaseInvoice>
            )}
            {props.selected === "عرض فاتورة مشتريات" && (
                <PurchaseInvoice
                    mode="view"
                    invoice={props.purchaseInvoiceToView}
                    onBack={props.onBackFromView}
                ></PurchaseInvoice>
            )}
            {props.selected === "اعرض كل فواتير المشتريات" && (
                <ShowPurchaseInvoices
                    onEdit={(e) => {
                        props.onEditPurchaseInvoice(e);
                    }}
                    onView={(e) => {
                        props.onViewPurchaseInvoice(e);
                    }}
                ></ShowPurchaseInvoices>
            )}
            {props.selected === "زود فاتورة بيع" && (
                <SalesInvoice mode="add"></SalesInvoice>
            )}
            {props.selected === "عدل فاتورة بيع" && (
                <SalesInvoice
                    mode="edit"
                    invoice={props.salesInvoiceToEdit}
                    onSuccess={props.onEditSalesInvoiceSuccess}
                    onBack={props.onBackFromView}
                ></SalesInvoice>
            )}
            {props.selected === "عرض فاتورة بيع" && (
                <SalesInvoice
                    mode="view"
                    invoice={props.salesInvoiceToView}
                    onBack={props.onBackFromView}
                ></SalesInvoice>
            )}
            {props.selected === "اعرض كل فواتير البيع" && (
                <ShowSalesInvoices
                    onEdit={(e) => {
                        props.onEditSalesInvoice(e);
                    }}
                    onView={(e) => {
                        props.onViewSalesInvoice(e);
                    }}
                ></ShowSalesInvoices>
            )}
            {props.selected === "تقرير الإيرادات" && (
                <Revenue
                    onEdit={(e) => {
                        props.onEditSalesInvoice(e);
                    }}
                ></Revenue>
            )}
            {props.selected === "فواتير مجمعة" && <CombinedInvoices />}
            {props.selected === "عرض عملاء الآجل" && <CreditCustomers />}
            {props.selected === "سداد العملاء الآجل" && <PaymentManager />}
            {props.selected === "إدارة الموردين" && <ShowSuppliers />}
            {props.selected === "إدارة العملاء" && <ShowCustomers />}
            {props.selected === "إدارة العبوات" && <ShowVolumes />}
            {props.selected === "حركة المنتج" && <ProductMovement />}
            {props.selected === "الإشعارات" && <Notifications />}
            {props.selected === "إعدادات الألوان" && <Settings />}
        </div>
    );
}
