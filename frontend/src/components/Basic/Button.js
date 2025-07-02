import classes from "./Button.module.css";
export default function Button(props) {
    return (
        <button
            disabled={props.disabled}
            onClick={props.onClick}
            className={`${classes.btn} ${
                props.className ? props.className : ""
            }`}
        >
            {props.content}
        </button>
    );
}
