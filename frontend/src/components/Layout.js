import Header from "./Header/Header";
import classes from "./Layout.module.css";
import { Fragment, useState } from "react";
import Side from "./Side/Side";
import Content from "./Content/Content";
export default function Layout() {
    const actions = [
        { title: "بضاعة المخزن", tasks: ["زود بضاعة", "اعرض كل البضاعة"] },
        { title: "الفواتير", tasks: ["زود فاتورة", "اعرض كل الفواتير"] },
    ];
    const [selected, setSelected] = useState("");
    function changeSelected(ch) {
        setSelected(ch);
    }
    return (
        <Fragment>
            <Header></Header>
            <div className={classes["body"]}>
                <Side onSelect={changeSelected} actions={actions}></Side>
                <Content selected={selected}></Content>
            </div>
            ;
        </Fragment>
    );
}
