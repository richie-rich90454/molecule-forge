/// <reference types="vitest" />
/// <reference types="vite/client" />

import { defineConfig } from "vitest/config";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
    plugins: [solidPlugin({ hot: false })],
    base: "./",
    server: {
        port: 3000,
    },
    test: {
        environment: "jsdom",
        globals: false,
        isolate: false,
        testTimeout: 20000,
        setupFiles: ["node_modules/@testing-library/jest-dom/vitest", "tests/setup.ts"],
        coverage: {
            provider: "v8",
            include: ["src/**/*.{ts,tsx}"],
            exclude: ["src/index.tsx", "scripts/**", "src/wasm/**"],
            thresholds: {
                statements: 100,
                branches: 100,
                functions: 100,
                lines: 100,
            },
        },
    },
    build: {
        target: "esnext",
        chunkSizeWarningLimit: 30000,
    },
    resolve: {
        conditions: ["development", "browser"],
    },
});
