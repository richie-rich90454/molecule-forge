import { existsSync, rmSync } from "node:fs";

const ignore = "src/wasm/engine/pkg/.gitignore";
if (existsSync(ignore)) {
    rmSync(ignore);
}
