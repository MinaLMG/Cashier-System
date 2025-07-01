import classes from "./Content.module.css";
export default function Content(props) {
    return (
        <div className={classes["content"]}>
            {props.chosen == "زود بضاعة" && <addProduct></addProduct>}
        </div>
    );
}
