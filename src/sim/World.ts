import type { IMoleculeRecord, MoleculeCategory } from "../chem/MoleculeRecord";
import type { ISimParams } from "./IForceCalculator";
import { SimParamsFactory } from "./IForceCalculator";
import { MoleculeInstance } from "./MoleculeInstance";
import type { PhysicsEngine } from "./PhysicsEngine";
import { SeededRandom } from "./SeededRandom";

export interface IWorldObserver {
    onSpawn(instance: MoleculeInstance): void;
    onRemove(id: number): void;
    onClear(): void;
}

export class World {
    public static readonly MAX_LIVE_ATOMS = 200000;
    private static readonly NONE: ReadonlySet<MoleculeInstance> = new Set<MoleculeInstance>();

    private readonly engine: PhysicsEngine;
    private readonly instances: Map<number, MoleculeInstance>;
    private readonly byId: Map<string, Set<MoleculeInstance>>;
    private readonly byCategory: Map<MoleculeCategory, Set<MoleculeInstance>>;
    private readonly observers: IWorldObserver[];
    private readonly spawnRng: SeededRandom;
    private liveAtoms: number;
    private instanceCache: MoleculeInstance[] | null;
    public params: ISimParams;
    public boxSize: number;
    public targetBoxSize: number;
    public time: number;

    public constructor(engine: PhysicsEngine, seed: number) {
        this.engine = engine;
        this.instances = new Map();
        this.byId = new Map();
        this.byCategory = new Map();
        this.observers = [];
        this.spawnRng = new SeededRandom(seed);
        this.liveAtoms = 0;
        this.instanceCache = null;
        this.params = SimParamsFactory.createDefault();
        this.boxSize = 60;
        this.targetBoxSize = 60;
        this.time = 0;
    }

    public addObserver(observer: IWorldObserver): void {
        this.observers.push(observer);
    }

    public spawn(
        record: IMoleculeRecord,
        x: number,
        y: number,
        z: number,
        speed: number,
    ): MoleculeInstance {
        const angle = this.spawnRng.next() * Math.PI * 2;
        const tilt = (this.spawnRng.next() - 0.5) * Math.PI;
        const vx = Math.cos(angle) * Math.cos(tilt) * speed;
        const vy = Math.sin(tilt) * speed;
        const vz = Math.sin(angle) * Math.cos(tilt) * speed;
        const instance = new MoleculeInstance(
            record,
            x,
            y,
            z,
            vx,
            vy,
            vz,
            this.spawnRng.next() * 1000,
        );
        instance.avx = (this.spawnRng.next() - 0.5) * 2;
        instance.avy = (this.spawnRng.next() - 0.5) * 2;
        instance.avz = (this.spawnRng.next() - 0.5) * 2;
        this.instances.set(instance.id, instance);
        this.instanceCache = null;
        this.liveAtoms += record.atoms.length;
        let idSet = this.byId.get(record.id);
        if (idSet === undefined) {
            idSet = new Set();
            this.byId.set(record.id, idSet);
        }
        idSet.add(instance);
        let categorySet = this.byCategory.get(record.category);
        if (categorySet === undefined) {
            categorySet = new Set();
            this.byCategory.set(record.category, categorySet);
        }
        categorySet.add(instance);
        for (const observer of this.observers) {
            observer.onSpawn(instance);
        }
        return instance;
    }

    public canAccommodate(atomCount: number): boolean {
        return this.liveAtoms + atomCount <= World.MAX_LIVE_ATOMS;
    }

    public getLiveAtoms(): number {
        return this.liveAtoms;
    }

    public remove(id: number): void {
        const instance = this.instances.get(id);
        if (instance !== undefined && this.instances.delete(id)) {
            this.instanceCache = null;
            this.liveAtoms = Math.max(0, this.liveAtoms - instance.record.atoms.length);
            const idSet = this.byId.get(instance.record.id) as Set<MoleculeInstance>;
            idSet.delete(instance);
            if (idSet.size === 0) {
                this.byId.delete(instance.record.id);
            }
            const categorySet = this.byCategory.get(
                instance.record.category,
            ) as Set<MoleculeInstance>;
            categorySet.delete(instance);
            if (categorySet.size === 0) {
                this.byCategory.delete(instance.record.category);
            }
            for (const observer of this.observers) {
                observer.onRemove(id);
            }
        }
    }

    public clear(): void {
        this.instances.clear();
        this.byId.clear();
        this.byCategory.clear();
        this.instanceCache = null;
        this.liveAtoms = 0;
        for (const observer of this.observers) {
            observer.onClear();
        }
    }

    public findById(id: number): MoleculeInstance | undefined {
        return this.instances.get(id);
    }

    public getInstanceList(): MoleculeInstance[] {
        if (this.instanceCache === null) {
            this.instanceCache = Array.from(this.instances.values());
        }
        return this.instanceCache;
    }

    public countAlive(): number {
        let count = 0;
        for (const inst of this.instances.values()) {
            if (inst.alive) {
                count++;
            }
        }
        return count;
    }

    public getInstanceCount(): number {
        return this.instances.size;
    }

    public isEmpty(): boolean {
        return this.instances.size === 0;
    }

    public findInstances(
        moleculeId: string,
        category: MoleculeCategory | null,
        limit: number,
    ): MoleculeInstance[] {
        const found: MoleculeInstance[] = [];
        const source: Iterable<MoleculeInstance> =
            moleculeId !== ""
                ? (this.byId.get(moleculeId) ?? World.NONE)
                : category !== null
                  ? (this.byCategory.get(category) ?? World.NONE)
                  : this.instances.values();
        for (const inst of source) {
            if (!inst.alive) {
                continue;
            }
            found.push(inst);
            if (found.length >= limit) {
                break;
            }
        }
        return found;
    }

    public snapshotPrevious(): void {
        for (const inst of this.instances.values()) {
            if (inst.alive) {
                inst.snapshotPrevious();
            }
        }
    }

    public step(dt: number, rng: SeededRandom): void {
        const rate = Math.min(1, dt * 1.5);
        this.boxSize += (this.targetBoxSize - this.boxSize) * rate;
        this.params.spark = Math.max(0, this.params.spark - dt * 0.7);
        this.params.catalyst = Math.max(0, this.params.catalyst - dt * 0.08);
        this.engine.step(this, dt, rng);
        this.time += dt;
    }
}
