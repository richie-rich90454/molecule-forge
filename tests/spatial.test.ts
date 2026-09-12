import { describe, expect, it } from "vitest";
import { SpatialHashGrid } from "../src/sim/SpatialHashGrid";

describe("SpatialHashGrid", () => {
    it("finds inserted neighbors within radius", () => {
        const grid = new SpatialHashGrid(6);
        grid.insert(1, 0, 0, 0);
        grid.insert(2, 3, 0, 0);
        grid.insert(3, 50, 0, 0);
        const out: number[] = [];
        grid.queryRadius(0, 0, 0, 10, out);
        expect(out).toContain(1);
        expect(out).toContain(2);
        expect(out).not.toContain(3);
    });

    it("returns nothing when empty", () => {
        const grid = new SpatialHashGrid(6);
        const out: number[] = [];
        grid.queryRadius(0, 0, 0, 10, out);
        expect(out.length).toBe(0);
    });

    it("clears all entries", () => {
        const grid = new SpatialHashGrid(6);
        grid.insert(1, 0, 0, 0);
        grid.clear();
        const out: number[] = [];
        grid.queryRadius(0, 0, 0, 10, out);
        expect(out.length).toBe(0);
        expect(grid.getCellCount()).toBe(0);
    });

    it("handles negative coordinates", () => {
        const grid = new SpatialHashGrid(6);
        grid.insert(9, -30, -30, -30);
        const out: number[] = [];
        grid.queryRadius(-30, -30, -30, 2, out);
        expect(out).toContain(9);
    });
});
