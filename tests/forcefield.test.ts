import { describe, expect, it } from "vitest";
import {
    DEFAULT_FORCE_FIELD_CONFIG,
    WasmForceField,
    type IWasmForceModule,
} from "../src/sim/ForceField";

function makeInput(): {
    positions: Float64Array;
    radii: Float64Array;
    charges: Float64Array;
    donors: Float64Array;
    acceptors: Float64Array;
    masses: Float64Array;
    maxRadius: number;
    hasDonor: boolean;
    hasAcceptor: boolean;
    bondStrength: number;
    polarity: number;
    outForces: Float64Array;
} {
    return {
        positions: new Float64Array([0, 0, 0, 1, 0, 0]),
        radii: new Float64Array([1, 1]),
        charges: new Float64Array([0, 0]),
        donors: new Float64Array([0, 0]),
        acceptors: new Float64Array([0, 0]),
        masses: new Float64Array([16, 16]),
        maxRadius: 1,
        hasDonor: false,
        hasAcceptor: false,
        bondStrength: 2,
        polarity: 0.5,
        outForces: new Float64Array(6),
    };
}

describe("WasmForceField", () => {
    it("reports support and forwards the configured constants", () => {
        expect(WasmForceField.isSupported()).toBe(true);
        const calls: unknown[][] = [];
        const module: IWasmForceModule = {
            compute_forces: ((...args: unknown[]) => {
                calls.push(args);
            }) as IWasmForceModule["compute_forces"],
        };
        const field = new WasmForceField(module, DEFAULT_FORCE_FIELD_CONFIG);
        const input = makeInput();
        field.compute(input);
        expect(calls.length).toBe(1);
        const args = calls[0];
        expect(args[6]).toBe(1);
        expect(args[7]).toBe(false);
        expect(args[9]).toBeCloseTo(DEFAULT_FORCE_FIELD_CONFIG.ljEpsilon * 2, 9);
        expect(args[13]).toBeCloseTo(1 + 0.5 * 40, 9);
        expect(args[16]).toBe(DEFAULT_FORCE_FIELD_CONFIG.cutoff);
    });

    it("loads a module and returns null for each failure mode", async () => {
        const module: IWasmForceModule = {
            compute_forces: (() => {}) as IWasmForceModule["compute_forces"],
        };
        const field = await WasmForceField.load(async () => module, DEFAULT_FORCE_FIELD_CONFIG);
        expect(field).not.toBeNull();

        const missing = await WasmForceField.load(async () => null, DEFAULT_FORCE_FIELD_CONFIG);
        expect(missing).toBeNull();

        const broken = await WasmForceField.load(async () => {
            throw new Error("no wasm");
        }, DEFAULT_FORCE_FIELD_CONFIG);
        expect(broken).toBeNull();
    });

    it("returns null when WebAssembly is unavailable", async () => {
        const real = (globalThis as { WebAssembly?: unknown }).WebAssembly;
        (globalThis as { WebAssembly?: unknown }).WebAssembly = undefined;
        try {
            expect(WasmForceField.isSupported()).toBe(false);
            const field = await WasmForceField.load(async () => null, DEFAULT_FORCE_FIELD_CONFIG);
            expect(field).toBeNull();
        } finally {
            (globalThis as { WebAssembly?: unknown }).WebAssembly = real;
        }
    });
});
