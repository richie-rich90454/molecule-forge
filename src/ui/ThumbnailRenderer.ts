import { ElementRegistry } from "../chem/ElementRegistry";
import type { IMoleculeRecord } from "../chem/MoleculeRecord";

interface IThumbnailItem {
    canvas: HTMLCanvasElement;
    record: IMoleculeRecord;
    angle: number;
    visible: boolean;
}

export class ThumbnailRenderer {
    private readonly items: IThumbnailItem[];
    private readonly observer: IntersectionObserver | null;
    private rafId: number;
    private lastTime: number;

    public constructor() {
        this.items = [];
        this.rafId = 0;
        this.lastTime = 0;
        if (typeof IntersectionObserver !== "undefined") {
            this.observer = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    const item = this.items.find((candidate) => candidate.canvas === entry.target);
                    if (item !== undefined) {
                        item.visible = entry.isIntersecting;
                    }
                }
            });
        } else {
            this.observer = null;
        }
    }

    public watch(canvas: HTMLCanvasElement, record: IMoleculeRecord): void {
        this.unwatch(canvas);
        this.items.push({ canvas, record, angle: Math.random() * Math.PI * 2, visible: true });
        if (this.observer !== null) {
            this.observer.observe(canvas);
        }
        if (this.rafId === 0) {
            this.lastTime = performance.now();
            this.rafId = requestAnimationFrame((now) => {
                this.tick(now);
            });
        }
    }

    public unwatch(canvas: HTMLCanvasElement): void {
        const index = this.items.findIndex((item) => item.canvas === canvas);
        if (index >= 0) {
            this.items.splice(index, 1);
        }
        if (this.observer !== null) {
            this.observer.unobserve(canvas);
        }
        if (this.items.length === 0 && this.rafId !== 0) {
            cancelAnimationFrame(this.rafId);
            this.rafId = 0;
        }
    }

    private tick(now: number): void {
        this.rafId = 0;
        if (this.items.length === 0) {
            return;
        }
        const dt = Math.min(0.1, (now - this.lastTime) / 1000);
        this.lastTime = now;
        for (const item of this.items) {
            if (!item.visible) {
                continue;
            }
            item.angle += dt * 0.8;
            this.draw(item);
        }
        this.rafId = requestAnimationFrame((next) => {
            this.tick(next);
        });
    }

    private draw(item: IThumbnailItem): void {
        const canvas = item.canvas;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const cssWidth = canvas.clientWidth;
        const cssHeight = canvas.clientHeight;
        if (cssWidth === 0 || cssHeight === 0) {
            return;
        }
        const width = Math.floor(cssWidth * dpr);
        const height = Math.floor(cssHeight * dpr);
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }
        const ctx = canvas.getContext("2d");
        if (ctx === null) {
            return;
        }
        ctx.clearRect(0, 0, width, height);
        const atoms = item.record.atoms;
        if (atoms.length === 0) {
            return;
        }
        let maxR = 0.1;
        for (const atom of atoms) {
            const d = Math.sqrt(atom.x * atom.x + atom.y * atom.y + atom.z * atom.z);
            if (d > maxR) {
                maxR = d;
            }
        }
        const cosA = Math.cos(item.angle);
        const sinA = Math.sin(item.angle);
        const scale = (Math.min(width, height) / 2 - 4 * dpr) / maxR;
        const cx = width / 2;
        const cy = height / 2;
        ctx.lineWidth = Math.max(1, dpr * 0.75);
        ctx.strokeStyle = "rgba(190,210,255,0.55)";
        for (const bond of item.record.bonds) {
            const a = atoms[bond.a];
            const b = atoms[bond.b];
            if (a === undefined || b === undefined) {
                continue;
            }
            const ax = cx + (a.x * cosA + a.z * sinA) * scale;
            const ay = cy + (a.y * 0.9 - (a.z * cosA - a.x * sinA) * 0.25) * scale;
            const bx = cx + (b.x * cosA + b.z * sinA) * scale;
            const by = cy + (b.y * 0.9 - (b.z * cosA - b.x * sinA) * 0.25) * scale;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
        }
        const projected: Array<{ x: number; y: number; depth: number; el: string }> = [];
        for (const atom of atoms) {
            const x = atom.x * cosA + atom.z * sinA;
            const y = atom.y * 0.9 - (atom.z * cosA - atom.x * sinA) * 0.25;
            const depth = -atom.x * sinA + atom.z * cosA;
            projected.push({ x: cx + x * scale, y: cy + y * scale, depth, el: atom.el });
        }
        projected.sort((a, b) => a.depth - b.depth);
        for (const point of projected) {
            let color = "#8f9bb3";
            let radius = 0.7;
            try {
                const info = ElementRegistry.get(point.el);
                color = info.color;
                radius = info.covalentRadius + 0.25;
            } catch (error) {
                void error;
            }
            const shade = 0.75 + 0.25 * (point.depth / (maxR + 1e-6) + 1) * 0.5;
            ctx.fillStyle = color;
            ctx.globalAlpha = Math.max(0.45, Math.min(1, shade + 0.25));
            ctx.beginPath();
            ctx.arc(point.x, point.y, Math.max(1.5, radius * scale * 0.42), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}
