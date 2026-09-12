/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
    plugins: [solidPlugin(), viteSingleFile()],
    base: "./",
    server: {
        port: 3000,
    },
    test: {
        environment: "jsdom",
        globals: false,
        setupFiles: ["node_modules/@testing-library/jest-dom/vitest"],
        isolate: false,
    },
    build: {
        target: "esnext",
        assetsInlineLimit: 100000000,
        chunkSizeWarningLimit: 30000,
    },
    resolve: {
        conditions: ["development", "browser"],
    },
});
