import { Fragment, useState } from "react";
import classes from "./Side.module.css";
export default function Side(props) {
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
                                            ta === props.selected
                                                ? `${classes.selected}`
                                                : ""
                                        }`}
                                        onClick={() => {
                                            props.onSelect(ta);
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
