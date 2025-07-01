import classes from "./Header.module.css";
import logo from "../../media/OIP.webp";
export default function Header() {
    return (
        <header className={classes["header"]}>
            <img src={logo}></img>
        </header>
    );
}
