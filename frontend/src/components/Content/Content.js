import ShowInventory from "./Inventory/ShowInventory";
import ProductForm from "./AddProduct/ProductForm";
import classes from "./Content.module.css";
import PurchaseInvoice from "./PurchaseInvoice/PurchaseInvoice";
import ShowPurchaseInvoices from "./ShowInvoices/ShowPurchaseInvoices";
import SalesInvoice from "./SalesInvoices/SalesInvoice";
import ShowSalesInvoices from "./ShowInvoices/ShowSalesInvoices";
import ShowSuppliers from "./Suppliers/ShowSuppliers";
import ShowCustomers from "./Customers/ShowCustomers";
import ShowVolumes from "./Volumes/ShowVolumes";
import Revenue from "./Revenue/Revenue";

export default function Content(props) {
    return (
        <div className={classes["content"]}>
            {props.selected === "زود منتج" && <ProductForm mode="add" />}
            {props.selected === "عدل منتج" && (
                <ProductForm
                    mode="edit"
                    product={props.productToEdit}
                    onSuccess={props.onEditProductSuccess}
                />
            )}
            {props.selected === "اعرض كل البضاعة" && (
                <ShowInventory
                    onEdit={(e) => {
                        props.onEditProduct(e);
                    }}
                ></ShowInventory>
            )}
            {props.selected === "زود فاتورة مشتريات" && (
                <PurchaseInvoice mode="add"></PurchaseInvoice>
            )}
            {props.selected === "عدل فاتورة مشتريات" && (
                <PurchaseInvoice
                    mode="edit"
                    invoice={props.purchaseInvoiceToEdit}
                    onSuccess={props.onEditPurchaseInvoiceSuccess}
                ></PurchaseInvoice>
            )}
            {props.selected === "اعرض كل فواتير المشتريات" && (
                <ShowPurchaseInvoices
                    onEdit={(e) => {
                        props.onEditPurchaseInvoice(e);
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
                ></SalesInvoice>
            )}
            {props.selected === "اعرض كل فواتير البيع" && (
                <ShowSalesInvoices
                    onEdit={(e) => {
                        props.onEditSalesInvoice(e);
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
            {props.selected === "إدارة الموردين" && <ShowSuppliers />}
            {props.selected === "إدارة العملاء" && <ShowCustomers />}
            {props.selected === "إدارة العبوات" && <ShowVolumes />}
        </div>
    );
}
