import { describe, expect, it } from "vitest";
import { SnapshotCodec } from "../src/state/SnapshotCodec";

describe("SnapshotCodec", () => {
    it("round-trips a snapshot through the URL hash", () => {
        const hash = SnapshotCodec.encode({
            version: 1,
            preset: "primordial-soup",
            seed: 1101,
            temperature: 900,
            pressure: 1,
            ph: 7,
            viscosity: 0.2,
            polarity: 0.5,
            gravity: 0,
            spawns: [
                { id: "glycine", count: 8 },
                { id: "water", count: 14 },
            ],
        });
        const decoded = SnapshotCodec.decode("#" + hash);
        expect(decoded).not.toBeNull();
        expect(decoded?.preset).toBe("primordial-soup");
        expect(decoded?.seed).toBe(1101);
        expect(decoded?.temperature).toBe(900);
        expect(decoded?.spawns.length).toBe(2);
        expect(decoded?.spawns[0]).toEqual({ id: "glycine", count: 8 });
    });

    it("rejects an empty hash", () => {
        expect(SnapshotCodec.decode("#")).toBeNull();
        expect(SnapshotCodec.decode("")).toBeNull();
    });
});
