import * as THREE from "three";

interface IFlash {
    active: boolean;
    x: number;
    y: number;
    z: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
}

interface IParticle {
    active: boolean;
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
    r: number;
    g: number;
    b: number;
}

interface ITrailPoint {
    x: number;
    y: number;
    z: number;
    life: number;
}

export class EffectRenderer {
    private readonly scene: THREE.Scene;
    private readonly flashes: IFlash[];
    private readonly flashMesh: THREE.InstancedMesh;
    private readonly matrix: THREE.Matrix4;
    private readonly position: THREE.Vector3;
    private readonly quaternion: THREE.Quaternion;
    private readonly scale: THREE.Vector3;
    private readonly color: THREE.Color;
    private readonly particles: IParticle[];
    private readonly particleGeo: THREE.BufferGeometry;
    private readonly particlePos: Float32Array;
    private readonly particleCol: Float32Array;
    private readonly particlePoints: THREE.Points;
    private readonly trails: ITrailPoint[];
    private readonly trailGeo: THREE.BufferGeometry;
    private readonly trailPos: Float32Array;
    private readonly trailPoints: THREE.Points;
    private readonly grid: THREE.GridHelper;
    private readonly arrows: THREE.Group;
    private particleScale: number;

    public constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.flashes = [];
        for (let i = 0; i < 32; i++) {
            this.flashes.push({
                active: false,
                x: 0,
                y: 0,
                z: 0,
                life: 0,
                maxLife: 1,
                size: 4,
                color: "#ffffff",
            });
        }
        const flashGeo = new THREE.SphereGeometry(1, 12, 8);
        const flashMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color("#ffffff"),
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        this.flashMesh = new THREE.InstancedMesh(flashGeo, flashMat, 32);
        this.flashMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.flashMesh.frustumCulled = false;
        this.scene.add(this.flashMesh);
        this.matrix = new THREE.Matrix4();
        this.position = new THREE.Vector3();
        this.quaternion = new THREE.Quaternion();
        this.scale = new THREE.Vector3();
        this.color = new THREE.Color();
        this.particles = [];
        for (let i = 0; i < 600; i++) {
            this.particles.push({
                active: false,
                x: 0,
                y: 0,
                z: 0,
                vx: 0,
                vy: 0,
                vz: 0,
                life: 0,
                maxLife: 1,
                r: 1,
                g: 0.6,
                b: 0.25,
            });
        }
        this.particlePos = new Float32Array(600 * 3);
        this.particleCol = new Float32Array(600 * 3);
        this.particleGeo = new THREE.BufferGeometry();
        this.particleGeo.setAttribute("position", new THREE.BufferAttribute(this.particlePos, 3));
        this.particleGeo.setAttribute("color", new THREE.BufferAttribute(this.particleCol, 3));
        const particleMat = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        this.particlePoints = new THREE.Points(this.particleGeo, particleMat);
        this.particlePoints.frustumCulled = false;
        this.scene.add(this.particlePoints);
        this.trails = [];
        this.trailPos = new Float32Array(2000 * 3);
        this.trailGeo = new THREE.BufferGeometry();
        this.trailGeo.setAttribute("position", new THREE.BufferAttribute(this.trailPos, 3));
        const trailMat = new THREE.PointsMaterial({
            size: 0.28,
            color: new THREE.Color("#7ef2e0"),
            transparent: true,
            opacity: 0.35,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        this.trailPoints = new THREE.Points(this.trailGeo, trailMat);
        this.trailPoints.frustumCulled = false;
        this.scene.add(this.trailPoints);
        this.grid = new THREE.GridHelper(
            80,
            16,
            new THREE.Color("#1d3a44"),
            new THREE.Color("#12242c"),
        );
        this.grid.visible = false;
        this.scene.add(this.grid);
        this.arrows = new THREE.Group();
        this.arrows.visible = false;
        this.scene.add(this.arrows);
        this.particleScale = 1;
    }

    public setParticleScale(scale: number): void {
        this.particleScale = scale;
    }

    public setGridVisible(visible: boolean): void {
        this.grid.visible = visible;
    }

    public spawnFlash(x: number, y: number, z: number, colorHex: string, size: number): void {
        for (const flash of this.flashes) {
            if (!flash.active) {
                flash.active = true;
                flash.x = x;
                flash.y = y;
                flash.z = z;
                flash.life = 0.6;
                flash.maxLife = 0.6;
                flash.size = size;
                flash.color = colorHex;
                return;
            }
        }
    }

    public spawnBurst(x: number, y: number, z: number, kind: string, seed: number): void {
        let count = Math.floor(24 * this.particleScale);
        let speed = 9;
        let r = 1;
        let g = 0.6;
        let b = 0.25;
        if (kind === "boom") {
            count = Math.floor(120 * this.particleScale);
            speed = 22;
        } else if (kind === "link") {
            count = Math.floor(14 * this.particleScale);
            speed = 4;
            r = 0.5;
            g = 0.95;
            b = 0.9;
        } else if (kind === "crystal") {
            count = Math.floor(20 * this.particleScale);
            speed = 3;
            r = 0.75;
            g = 0.9;
            b = 1;
        } else if (kind === "fold") {
            count = Math.floor(16 * this.particleScale);
            speed = 3;
            r = 0.6;
            g = 0.85;
            b = 1;
        } else if (kind === "puff") {
            count = Math.floor(16 * this.particleScale);
            speed = 5;
            r = 0.75;
            g = 0.9;
            b = 1;
        }
        let spawned = 0;
        let s = seed;
        for (const particle of this.particles) {
            if (spawned >= count) {
                break;
            }
            if (particle.active) {
                continue;
            }
            s = (s * 16807) % 2147483647;
            const t = s / 2147483647;
            s = (s * 16807) % 2147483647;
            const u = s / 2147483647;
            const theta = t * Math.PI * 2;
            const z = u * 2 - 1;
            const ring = Math.sqrt(Math.max(0, 1 - z * z));
            particle.active = true;
            particle.x = x;
            particle.y = y;
            particle.z = z;
            particle.vx = Math.cos(theta) * ring * speed;
            particle.vy = Math.abs(z) * speed * 0.8;
            particle.vz = Math.sin(theta) * ring * speed;
            particle.life = 0.5 + (spawned % 5) * 0.1;
            particle.maxLife = particle.life;
            particle.r = r;
            particle.g = g;
            particle.b = b;
            spawned++;
        }
        void this.color;
    }

    public addTrailPoint(x: number, y: number, z: number): void {
        if (this.trails.length >= 2000) {
            this.trails.shift();
        }
        this.trails.push({ x, y, z, life: 0.3 });
    }

    public showArrow(x: number, y: number, z: number): void {
        const geometry = new THREE.ConeGeometry(0.5, 1.6, 8);
        const material = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd479") });
        const cone = new THREE.Mesh(geometry, material);
        cone.position.set(x, y + 3, z);
        this.arrows.add(cone);
        this.arrows.visible = true;
        window.setTimeout(() => {
            this.arrows.remove(cone);
            geometry.dispose();
            material.dispose();
            if (this.arrows.children.length === 0) {
                this.arrows.visible = false;
            }
        }, 2000);
    }

    public update(dt: number): void {
        let flashSlot = 0;
        for (const flash of this.flashes) {
            if (!flash.active) {
                continue;
            }
            flash.life -= dt;
            if (flash.life <= 0) {
                flash.active = false;
                continue;
            }
            const t = 1 - flash.life / flash.maxLife;
            this.position.set(flash.x, flash.y, flash.z);
            this.scale.setScalar(flash.size * (0.5 + t * 1.6));
            this.matrix.compose(this.position, this.quaternion, this.scale);
            this.flashMesh.setMatrixAt(flashSlot, this.matrix);
            this.flashMesh.setColorAt(flashSlot, this.color.set(flash.color));
            flashSlot++;
        }
        this.flashMesh.count = flashSlot;
        this.flashMesh.instanceMatrix.needsUpdate = true;
        if (this.flashMesh.instanceColor !== null) {
            this.flashMesh.instanceColor.needsUpdate = true;
        }
        const flashMat = this.flashMesh.material as THREE.MeshBasicMaterial;
        flashMat.opacity = 0.75;
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            if (!particle.active) {
                this.particlePos[i * 3 + 1] = -10000;
                continue;
            }
            particle.life -= dt;
            if (particle.life <= 0) {
                particle.active = false;
                this.particlePos[i * 3 + 1] = -10000;
                continue;
            }
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;
            particle.z += particle.vz * dt;
            particle.vy -= 6 * dt;
            this.particlePos[i * 3] = particle.x;
            this.particlePos[i * 3 + 1] = particle.y;
            this.particlePos[i * 3 + 2] = particle.z;
            const fade = particle.life / particle.maxLife;
            this.particleCol[i * 3] = fade * particle.r;
            this.particleCol[i * 3 + 1] = fade * particle.g;
            this.particleCol[i * 3 + 2] = fade * particle.b;
        }
        this.particleGeo.attributes.position.needsUpdate = true;
        this.particleGeo.attributes.color.needsUpdate = true;
        for (let i = this.trails.length - 1; i >= 0; i--) {
            this.trails[i].life -= dt;
            if (this.trails[i].life <= 0) {
                this.trails.splice(i, 1);
            }
        }
        for (let i = 0; i < 2000; i++) {
            const point = this.trails[i];
            if (point === undefined) {
                this.trailPos[i * 3 + 1] = -10000;
                continue;
            }
            this.trailPos[i * 3] = point.x;
            this.trailPos[i * 3 + 1] = point.y;
            this.trailPos[i * 3 + 2] = point.z;
        }
        this.trailGeo.attributes.position.needsUpdate = true;
    }

    public dispose(): void {
        this.scene.remove(this.flashMesh);
        this.flashMesh.geometry.dispose();
        (this.flashMesh.material as THREE.Material).dispose();
        this.scene.remove(this.particlePoints);
        this.particleGeo.dispose();
        (this.particlePoints.material as THREE.Material).dispose();
        this.scene.remove(this.trailPoints);
        this.trailGeo.dispose();
        (this.trailPoints.material as THREE.Material).dispose();
        this.scene.remove(this.grid);
        this.scene.remove(this.arrows);
    }
}
