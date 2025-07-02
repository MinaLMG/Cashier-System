import classes from "./Select.module.css";

export default function Select(props) {
    return (
        <div className="form-floating mb-3">
            <select
                className={`form-select ${classes.select}`}
                aria-label="Default select example"
                value={props.value}
                onChange={(e) =>
                    props.onchange && props.onchange(e.target.value)
                }
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
