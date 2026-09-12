export class SpatialHashGrid {
    private readonly cellSize: number;
    private readonly cells: Map<string, number[]>;
    private readonly positions: Map<number, number[]>;

    public constructor(cellSize: number) {
        this.cellSize = cellSize;
        this.cells = new Map();
        this.positions = new Map();
    }

    public clear(): void {
        this.cells.clear();
        this.positions.clear();
    }

    public insert(id: number, x: number, y: number, z: number): void {
        const key = this.keyFor(x, y, z);
        const list = this.cells.get(key);
        if (list === undefined) {
            this.cells.set(key, [id]);
        } else {
            list.push(id);
        }
        this.positions.set(id, [x, y, z]);
    }

    public queryRadius(x: number, y: number, z: number, radius: number, out: number[]): number[] {
        out.length = 0;
        const minX = Math.floor((x - radius) / this.cellSize);
        const maxX = Math.floor((x + radius) / this.cellSize);
        const minY = Math.floor((y - radius) / this.cellSize);
        const maxY = Math.floor((y + radius) / this.cellSize);
        const minZ = Math.floor((z - radius) / this.cellSize);
        const maxZ = Math.floor((z + radius) / this.cellSize);
        const r2 = radius * radius;
        for (let cx = minX; cx <= maxX; cx++) {
            for (let cy = minY; cy <= maxY; cy++) {
                for (let cz = minZ; cz <= maxZ; cz++) {
                    const list = this.cells.get(cx + "," + cy + "," + cz);
                    if (list === undefined) {
                        continue;
                    }
                    for (const id of list) {
                        const p = this.positions.get(id);
                        if (p === undefined) {
                            continue;
                        }
                        const dx = p[0] - x;
                        const dy = p[1] - y;
                        const dz = p[2] - z;
                        if (dx * dx + dy * dy + dz * dz <= r2) {
                            out.push(id);
                        }
                    }
                }
            }
        }
        return out;
    }

    public getCellCount(): number {
        return this.cells.size;
    }

    private keyFor(x: number, y: number, z: number): string {
        return (
            Math.floor(x / this.cellSize) +
            "," +
            Math.floor(y / this.cellSize) +
            "," +
            Math.floor(z / this.cellSize)
        );
    }
}
