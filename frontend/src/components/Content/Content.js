import ProductForm from "./AddProduct/ProductForm";
import classes from "./Content.module.css";
export default function Content(props) {
    return (
        <div className={classes["content"]}>
            {props.selected == "زود منتج" && <ProductForm mode="add" />}
            {props.selected == "عدل منتج" && (
                <ProductForm
                    mode="edit"
                    product={{
                        _id: "6866b2a317f04d07fcb68abc",
                        name: "menajkj",
                        "min-stock": "",
                        conversions: [
                            {
                                from: "68648e808a30cc9a6819ef99",
                                to: "",
                                value: 1,
                                barcode: "022555",
                            },
                            {
                                from: "68648e808a30cc9a6819ef97",
                                to: "68648e808a30cc9a6819ef99",
                                value: 11,
                                barcode: "01257752",
                            },
                            {
                                from: "68648e808a30cc9a6819ef9a",
                                to: "68648e808a30cc9a6819ef97",
                                value: 3,
                                barcode: "",
                            },
                            {
                                from: "68648e808a30cc9a6819ef9b",
                                to: "68648e808a30cc9a6819ef9a",
                                value: 4,
                                barcode: "",
                            },
                            {
                                from: "",
                                to: "",
                                value: "",
                                barcode: "",
                            },
                        ],
                        values: [
                            {
                                id: "68648e808a30cc9a6819ef99",
                                name: "شريط",
                                val: 1,
                            },
                            {
                                id: "68648e808a30cc9a6819ef97",
                                name: "كرتونة",
                                val: 11,
                            },
                            {
                                id: "68648e808a30cc9a6819ef9a",
                                name: "علبة",
                                val: 33,
                            },
                            {
                                id: "68648e808a30cc9a6819ef9b",
                                name: "الاساس",
                                val: 132,
                            },
                        ],
                        error: "",
                    }}
                />
            )}
        </div>
    );
}
