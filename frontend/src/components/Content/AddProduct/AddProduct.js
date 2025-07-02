import { useState } from "react";
import TextInput from "../../Basic/TextInput";
import classes from "./AddProduct.module.css";
export default function AddProduct() {
    const [product, setProduct] = useState({ name: "" });
    return (
        <div className={classes.add}>
            <div style={{ width: "50%" }}>
                <TextInput
                    type="text"
                    placeholder="اسم المنتج"
                    label="اسم المنتج"
                    id="product-name"
                    value={product.name}
                    onchange={(e) => {
                        setProduct({
                            ...product,
                            name: e,
                        });
                    }}
                ></TextInput>
            </div>
            <div style={{ width: "50%" }}>
                <table>
                    <thead>
                        <td> الكمية بتاعتنا </td>
                        <td>كام وحدة </td>
                        <td>من ايه؟ </td>
                    </thead>
                    <tr>
                        <td> </td>
                        <td> </td>
                        <td> </td>
                    </tr>
                </table>
            </div>
            <div style={{ width: "50%" }}>
                <TextInput
                    type="number"
                    placeholder="الكمية اللى تحتها خطر"
                    label="الكمية الادنى"
                    id="product-min"
                    value={product["min-stock"]}
                    onchange={(e) => {
                        setProduct({
                            ...product,
                            "min-stock": e,
                        });
                    }}
                ></TextInput>
            </div>
        </div>
    );
}
