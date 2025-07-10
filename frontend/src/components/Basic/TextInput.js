import { Fragment } from "react";
// Use the classes import if needed, otherwise remove it
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
                    className="form-control"
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
