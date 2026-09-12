import * as THREE from "three";

export class CameraController {
    private readonly camera: THREE.PerspectiveCamera;
    private target: THREE.Vector3;
    private radius: number;
    private theta: number;
    private phi: number;
    private readonly minRadius: number;
    private readonly maxRadius: number;
    private dragging: boolean;
    private panning: boolean;
    private lastX: number;
    private lastY: number;
    private element: HTMLElement | null;
    private readonly boundDown: (event: PointerEvent) => void;
    private readonly boundMove: (event: PointerEvent) => void;
    private readonly boundUp: (event: PointerEvent) => void;
    private readonly boundWheel: (event: WheelEvent) => void;
    private readonly pinchDistance: { value: number };

    public constructor(camera: THREE.PerspectiveCamera) {
        this.camera = camera;
        this.target = new THREE.Vector3(0, 0, 0);
        this.radius = 55;
        this.theta = 0.7;
        this.phi = 1.1;
        this.minRadius = 6;
        this.maxRadius = 220;
        this.dragging = false;
        this.panning = false;
        this.lastX = 0;
        this.lastY = 0;
        this.element = null;
        this.pinchDistance = { value: 0 };
        this.boundDown = (event: PointerEvent): void => {
            this.onPointerDown(event);
        };
        this.boundMove = (event: PointerEvent): void => {
            this.onPointerMove(event);
        };
        this.boundUp = (event: PointerEvent): void => {
            this.onPointerUp(event);
        };
        this.boundWheel = (event: WheelEvent): void => {
            this.onWheel(event);
        };
        this.apply();
    }

    public attach(element: HTMLElement): void {
        this.detach();
        this.element = element;
        element.addEventListener("pointerdown", this.boundDown);
        element.addEventListener("pointermove", this.boundMove);
        element.addEventListener("pointerup", this.boundUp);
        element.addEventListener("wheel", this.boundWheel, { passive: false });
    }

    public detach(): void {
        if (this.element === null) {
            return;
        }
        this.element.removeEventListener("pointerdown", this.boundDown);
        this.element.removeEventListener("pointermove", this.boundMove);
        this.element.removeEventListener("pointerup", this.boundUp);
        this.element.removeEventListener("wheel", this.boundWheel);
        this.element = null;
    }

    public isDragging(): boolean {
        return this.dragging;
    }

    public isPanning(): boolean {
        return this.panning;
    }

    public reset(): void {
        this.target.set(0, 0, 0);
        this.radius = 55;
        this.theta = 0.7;
        this.phi = 1.1;
        this.apply();
    }

    public getRadius(): number {
        return this.radius;
    }

    private onPointerDown(event: PointerEvent): void {
        if (event.button === 1 || event.button === 2 || event.shiftKey) {
            this.panning = true;
        } else {
            this.dragging = true;
        }
        this.lastX = event.clientX;
        this.lastY = event.clientY;
    }

    private onPointerMove(event: PointerEvent): void {
        if (!this.dragging && !this.panning) {
            return;
        }
        const dx = event.clientX - this.lastX;
        const dy = event.clientY - this.lastY;
        this.lastX = event.clientX;
        this.lastY = event.clientY;
        if (this.panning) {
            const scale = this.radius / 600;
            const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 0);
            const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
            this.target.addScaledVector(right, -dx * scale);
            this.target.addScaledVector(up, dy * scale);
            this.apply();
        } else {
            this.theta -= dx * 0.005;
            this.phi -= dy * 0.005;
            this.phi = Math.max(0.05, Math.min(Math.PI - 0.05, this.phi));
            this.apply();
        }
    }

    private onPointerUp(event: PointerEvent): void {
        void event;
        this.dragging = false;
        this.panning = false;
        this.pinchDistance.value = 0;
    }

    private onWheel(event: WheelEvent): void {
        event.preventDefault();
        const factor = event.deltaY > 0 ? 1.12 : 1 / 1.12;
        this.radius = Math.max(this.minRadius, Math.min(this.maxRadius, this.radius * factor));
        this.apply();
    }

    private apply(): void {
        const x = this.target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta);
        const y = this.target.y + this.radius * Math.cos(this.phi);
        const z = this.target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.target);
    }
}
