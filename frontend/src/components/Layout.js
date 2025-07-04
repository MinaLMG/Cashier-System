import Header from "./Header/Header";
import classes from "./Layout.module.css";
import { Fragment, useState } from "react";
import Side from "./Side/Side";
import Content from "./Content/Content";
import Modal from "./general/Modal";
export default function Layout() {
    const actions = [
        {
            title: "بضاعة المخزن",
            tasks: ["زود منتج", "عدل منتج", "اعرض كل البضاعة"],
        },
        { title: "الفواتير", tasks: ["زود فاتورة", "اعرض كل الفواتير"] },
    ];
    const [selected, setSelected] = useState("");
    function changeSelected(ch) {
        setSelected(ch);
    }
    return (
        <Fragment>
            <Header></Header>
            {/* <Modal
                onHide={() => {}}
                data={{
                    header: "حذف الاجتماع ",
                    message:
                        "متأكد انك عاوز تحذفه ؟ لو مش عاوز دوس علامة الغلط او برة البلوك ده :D",
                    button: "أيوة",
                }}
                onOk={() => {}}
            ></Modal> */}
            <div className={classes["body"]}>
                <Side
                    selected={selected}
                    onSelect={changeSelected}
                    actions={actions}
                ></Side>
                <Content selected={selected}></Content>
            </div>
            ;
        </Fragment>
    );
}
