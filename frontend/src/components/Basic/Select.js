import classes from "./Select.module.css";

export default function Select(props) {
    return (
        <div
            className={`form-floating mb-3 ${
                props.className ? props.className : ""
            }`}
        >
            <select
                disabled={props.disabled}
                className={`form-select ${classes.select}`}
                aria-label="Default select example"
                value={props.value}
                onChange={(e) => {
                    props.onchange && props.onchange(e.currentTarget.value);
                }}
                dir="rtl"
            >
                <option value="">{props.title || "اختر من القائمة"}</option>
                {props.options.map((op, index) => (
                    <option key={index} value={op.value}>
                        {op.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
