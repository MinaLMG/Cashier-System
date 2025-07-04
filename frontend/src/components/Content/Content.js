import ShowInventory from "./AddProduct/Inventory/ShowInventory";
import ProductForm from "./AddProduct/ProductForm";
import classes from "./Content.module.css";
export default function Content(props) {
    return (
        <div className={classes["content"]}>
            {props.selected == "زود منتج" && <ProductForm mode="add" />}
            {props.selected == "عدل منتج" && (
                <ProductForm mode="edit" product={{}} />
            )}
            {props.selected == "اعرض كل البضاعة" && (
                <ShowInventory></ShowInventory>
            )}
        </div>
    );
}
