import { describe, expect, it } from "vitest";
import { SpatialHashGrid, type IGridEntity } from "../src/sim/SpatialHashGrid";

function entity(id: number, px: number, py: number, pz: number): IGridEntity {
    return { id, px, py, pz };
}

describe("SpatialHashGrid", () => {
    it("finds inserted neighbors within radius", () => {
        const grid = new SpatialHashGrid<IGridEntity>(6);
        grid.insert(entity(1, 0, 0, 0));
        grid.insert(entity(2, 3, 0, 0));
        grid.insert(entity(3, 50, 0, 0));
        const out: IGridEntity[] = [];
        grid.queryRadius(0, 0, 0, 10, out);
        const ids = out.map((entry) => entry.id);
        expect(ids).toContain(1);
        expect(ids).toContain(2);
        expect(ids).not.toContain(3);
    });

    it("returns nothing when empty", () => {
        const grid = new SpatialHashGrid<IGridEntity>(6);
        const out: IGridEntity[] = [];
        grid.queryRadius(0, 0, 0, 10, out);
        expect(out.length).toBe(0);
    });

    it("clears all entries", () => {
        const grid = new SpatialHashGrid<IGridEntity>(6);
        grid.insert(entity(1, 0, 0, 0));
        grid.clear();
        const out: IGridEntity[] = [];
        grid.queryRadius(0, 0, 0, 10, out);
        expect(out.length).toBe(0);
        expect(grid.getCellCount()).toBe(0);
    });

    it("handles negative coordinates", () => {
        const grid = new SpatialHashGrid<IGridEntity>(6);
        grid.insert(entity(9, -30, -30, -30));
        const out: IGridEntity[] = [];
        grid.queryRadius(-30, -30, -30, 2, out);
        expect(out.map((entry) => entry.id)).toContain(9);
    });
});
