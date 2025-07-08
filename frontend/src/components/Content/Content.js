import ShowInventory from "./Inventory/ShowInventory";
import ProductForm from "./AddProduct/ProductForm";
import classes from "./Content.module.css";
import PurchaseInvoice from "./PurchaseInvoice/PurchaseInvoice";
import ShowPurchaseInvoices from "./ShowInvoices/ShowPurchaseInvoices";
export default function Content(props) {
    return (
        <div className={classes["content"]}>
            {props.selected === "زود منتج" && <ProductForm mode="add" />}
            {props.selected === "عدل منتج" && (
                <ProductForm
                    mode="edit"
                    product={props.productToEdit}
                    onSuccess={props.onEditSuccess}
                />
            )}
            {props.selected === "اعرض كل البضاعة" && (
                <ShowInventory
                    onEdit={(e) => {
                        props.onEditProduct(e);
                    }}
                ></ShowInventory>
            )}
            {props.selected === "زود فاتورة" && (
                <PurchaseInvoice mode="add"></PurchaseInvoice>
            )}
            {props.selected === "عدل فاتورة بيع" && (
                <PurchaseInvoice
                    mode="edit"
                    invoice={props.purchaseInvoiceToEdit}
                    onSuccess={props.onEditSuccess}
                ></PurchaseInvoice>
            )}
            {props.selected === "اعرض كل الفواتير" && (
                <ShowPurchaseInvoices
                    onEdit={(e) => {
                        props.onEditPurchaseInvoice(e);
                    }}
                ></ShowPurchaseInvoices>
            )}
        </div>
    );
}
