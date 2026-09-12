import "./styles.css";
import { Application } from "./Application";

const root = document.getElementById("root");

if (root === null) {
    throw new Error("Root element not found");
}

const application = new Application(root);
application.start();
