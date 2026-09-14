import "./fonts.css";
import "./styles.css";
import { Application } from "./Application";
import { loadWasmModule } from "./wasm/loadWasm";

const root = document.getElementById("root");

if (root === null) {
    throw new Error("Root element not found");
}

const application = new Application(root, { loadWasmModule });
application.start();
