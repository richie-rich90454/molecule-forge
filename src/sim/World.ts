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

    private readonly engine: PhysicsEngine;
    private readonly instances: Map<number, MoleculeInstance>;
    private readonly observers: IWorldObserver[];
    private readonly spawnRng: SeededRandom;
    private liveAtoms: number;
    public params: ISimParams;
    public boxSize: number;
    public targetBoxSize: number;
    public time: number;

    public constructor(engine: PhysicsEngine, seed: number) {
        this.engine = engine;
        this.instances = new Map();
        this.observers = [];
        this.spawnRng = new SeededRandom(seed);
        this.liveAtoms = 0;
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
        this.liveAtoms += record.atoms.length;
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
            this.liveAtoms = Math.max(0, this.liveAtoms - instance.record.atoms.length);
            for (const observer of this.observers) {
                observer.onRemove(id);
            }
        }
    }

    public clear(): void {
        this.instances.clear();
        this.liveAtoms = 0;
        for (const observer of this.observers) {
            observer.onClear();
        }
    }

    public findById(id: number): MoleculeInstance | undefined {
        return this.instances.get(id);
    }

    public getInstanceList(): MoleculeInstance[] {
        return Array.from(this.instances.values());
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

    public findInstances(
        moleculeId: string,
        category: MoleculeCategory | null,
        limit: number,
    ): MoleculeInstance[] {
        const found: MoleculeInstance[] = [];
        for (const inst of this.instances.values()) {
            if (!inst.alive) {
                continue;
            }
            if (moleculeId !== "" && inst.record.id !== moleculeId) {
                continue;
            }
            if (category !== null && inst.record.category !== category) {
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
