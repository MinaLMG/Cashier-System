import { Fragment } from "react";
import classes from "./TextInput.module.css";
export default function TextInput(props) {
    return (
        <Fragment>
            <div
                className={`form-floating mb-3 ${
                    props.className ? props.className : ""
                }`}
                dir="rtl"
            >
                <input
                    disabled={props.disabled}
                    type={props.type}
                    class="form-control"
                    placeholder={props.placeholder}
                    id={props.id}
                    value={props.value}
                    onChange={(e) => {
                        props.onchange(e.currentTarget.value);
                    }}
                ></input>
                <label htmlFor={props.id}>{props.label}</label>
            </div>
        </Fragment>
    );
}
