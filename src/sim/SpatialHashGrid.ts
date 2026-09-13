export interface IGridEntity {
    readonly id: number;
    readonly px: number;
    readonly py: number;
    readonly pz: number;
}

const KEY_SPAN = 4096;
const KEY_OFFSET = 2048;

export class SpatialHashGrid<T extends IGridEntity> {
    private readonly cellSize: number;
    private readonly cells: Map<number, T[]>;

    public constructor(cellSize: number) {
        this.cellSize = cellSize;
        this.cells = new Map();
    }

    public clear(): void {
        this.cells.clear();
    }

    public insert(entity: T): void {
        const key = this.keyFor(entity.px, entity.py, entity.pz);
        const list = this.cells.get(key);
        if (list === undefined) {
            this.cells.set(key, [entity]);
        } else {
            list.push(entity);
        }
    }

    public queryRadius(x: number, y: number, z: number, radius: number, out: T[]): T[] {
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
                    const list = this.cells.get(
                        ((cx + KEY_OFFSET) * KEY_SPAN + (cy + KEY_OFFSET)) * KEY_SPAN +
                            (cz + KEY_OFFSET),
                    );
                    if (list === undefined) {
                        continue;
                    }
                    for (const entity of list) {
                        const dx = entity.px - x;
                        const dy = entity.py - y;
                        const dz = entity.pz - z;
                        if (dx * dx + dy * dy + dz * dz <= r2) {
                            out.push(entity);
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

    private keyFor(x: number, y: number, z: number): number {
        const cx = Math.floor(x / this.cellSize) + KEY_OFFSET;
        const cy = Math.floor(y / this.cellSize) + KEY_OFFSET;
        const cz = Math.floor(z / this.cellSize) + KEY_OFFSET;
        return (cx * KEY_SPAN + cy) * KEY_SPAN + cz;
    }
}
