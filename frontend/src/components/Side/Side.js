import { Fragment, useState } from "react";
import classes from "./Side.module.css";
export default function Side(props) {
    const [selected, setSelected] = useState("");

    function handleSelection(arg) {
        setSelected(arg);
    }
    return (
        <div className={classes["side"]}>
            {props.actions.map((ac, index) => {
                return (
                    <Fragment key={index}>
                        <div className={classes.title}>{ac.title}</div>
                        <ul>
                            {ac.tasks.map((ta, index2) => {
                                return (
                                    <li
                                        key={index2}
                                        className={`${classes.item} ${
                                            ta === selected
                                                ? `${classes.selected}`
                                                : ""
                                        }`}
                                        onClick={() => {
                                            handleSelection(ta);
                                        }}
                                    >
                                        {ta}
                                    </li>
                                );
                            })}
                        </ul>
                    </Fragment>
                );
            })}
        </div>
    );
}
