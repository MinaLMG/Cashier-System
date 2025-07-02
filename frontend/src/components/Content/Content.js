import AddProduct from "./AddProduct/AddProduct";
import classes from "./Content.module.css";
export default function Content(props) {
    return (
        <div className={classes["content"]}>
            {props.selected == "زود بضاعة" && <AddProduct></AddProduct>}
        </div>
    );
}
