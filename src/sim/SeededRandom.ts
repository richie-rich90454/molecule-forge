export class SeededRandom {
    private state: number;

    public constructor(seed: number) {
        this.state = seed >>> 0;
        if (this.state === 0) {
            this.state = 0x9e3779b9;
        }
    }

    public next(): number {
        this.state |= 0;
        this.state = (this.state + 0x6d2b79f5) | 0;
        let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    public range(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    public integer(min: number, max: number): number {
        return Math.floor(this.range(min, max + 1));
    }

    public pick<T>(items: ReadonlyArray<T>): T {
        return items[Math.floor(this.next() * items.length)];
    }

    public fork(): SeededRandom {
        return new SeededRandom(Math.floor(this.next() * 0xffffffff));
    }

    public getSeed(): number {
        return this.state;
    }
}
