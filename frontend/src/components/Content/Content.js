import ShowInventory from "./Inventory/ShowInventory";
import ProductForm from "./AddProduct/ProductForm";
import classes from "./Content.module.css";
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
                        props.onEdit(e);
                    }}
                ></ShowInventory>
            )}
        </div>
    );
}
