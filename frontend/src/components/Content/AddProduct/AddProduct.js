import { useState, useEffect, Fragment } from "react";
import axios from "axios";
import Select from "../../Basic/Select";
import TextInput from "../../Basic/TextInput";
import classes from "./AddProduct.module.css";
import { FaPlus } from "react-icons/fa6";
import Button from "../../Basic/Button";

export default function AddProduct() {
    const [product, setProduct] = useState({
        name: "",
        "min-stock": "",
        volumes: [{}],
    });
    const [volumes, setVolumes] = useState([]);

    // Fetch volumes on mount using Axios
    useEffect(() => {
        axios
            .get(process.env.REACT_APP_BACKEND + "volumes")
            .then((res) => {
                setVolumes(res.data);
                console.log(res.data);
            })
            .catch((err) => {
                console.error("Failed to fetch volumes:", err);
            });
    }, []);

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
                        setProduct({ ...product, name: e });
                    }}
                />
            </div>

            <div style={{ width: "50%" }}>
                <div className={classes.table}>
                    <div> الكمية بتاعتنا </div>
                    <div>كام وحدة </div>
                    <div>من ايه؟ </div>
                    <div></div>
                    {product.volumes.map((vol, index) => (
                        <Fragment>
                            <div>
                                <Select
                                    title="الحجم الكبير"
                                    options={volumes.map((v) => ({
                                        value: v._id,
                                        label: v.name,
                                    }))}
                                />
                            </div>
                            <div>
                                <TextInput
                                    type="number"
                                    placeholder="كام"
                                    label="كام"
                                    id="package-size"
                                    value={product["package-size"]}
                                    onchange={(e) => {
                                        setProduct({
                                            ...product,
                                            "package-size": e,
                                        });
                                    }}
                                />
                            </div>
                            <div>
                                <Select
                                    title="الحجم الصغير"
                                    options={volumes.map((v) => ({
                                        value: v._id,
                                        label: v.name,
                                    }))}
                                />
                            </div>
                            <div>
                                <FaPlus
                                    color="white"
                                    size="3em"
                                    className={classes["plus-icon"]}
                                />
                            </div>
                        </Fragment>
                    ))}
                </div>
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
                />
            </div>
            <div style={{ padding: "auto" }}>
                <Button
                    content="حفظ"
                    disabled={false}
                    onClick={() => {}}
                    className=""
                />
            </div>
        </div>
    );
}
