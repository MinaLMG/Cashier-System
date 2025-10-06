import { Fragment } from "react";
import classes from "./Side.module.css";
import {
    FaBox,
    FaEye,
    FaFileInvoice,
    FaFileAlt,
    FaChartLine,
    FaUsers,
    FaUserFriends,
    FaBoxes,
    FaUserCog,
    FaShoppingCart,
} from "react-icons/fa";

// Icon mapping for navigation items
const getIconForTask = (task) => {
    const iconMap = {
        "زود منتج": FaBox,
        "اعرض كل البضاعة": FaEye,
        "زود فاتورة بيع": FaShoppingCart,
        "اعرض كل فواتير البيع": FaEye,
        "زود فاتورة مشتريات": FaFileInvoice,
        "اعرض كل فواتير المشتريات": FaEye,
        "تقرير الإيرادات": FaChartLine,
        "إدارة الموردين": FaUsers,
        "إدارة العملاء": FaUserFriends,
        "إدارة العبوات": FaBoxes,
        "إدارة المستخدمين": FaUserCog,
    };

    return iconMap[task] || FaFileAlt;
};

export default function Side(props) {
    return (
        <div className={classes["side"]}>
            {props.actions.map((ac, index) => {
                return (
                    <Fragment key={index}>
                        <div className={classes.title}>{ac.title}</div>
                        <ul>
                            {ac.tasks.map((ta, index2) => {
                                const IconComponent = getIconForTask(ta);
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
                                        <IconComponent
                                            className={classes.icon}
                                        />
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
