import type { IReactionEvent } from "./ReactionEngine";
import type { IMoleculeRecord } from "../chem/MoleculeRecord";
import type { IReactionRule } from "./ReactionCatalog";
import { Thermochemistry } from "../chem/Thermochemistry";
import type { World } from "./World";

export interface ILabSample {
    readonly time: number;
    readonly temperature: number;
    readonly pressure: number;
    readonly ph: number;
    readonly molecules: number;
    readonly energy: number;
}

export interface IRateEntry {
    readonly ruleId: string;
    readonly count: number;
    readonly perSecond: number;
}

export interface ICompositionEntry {
    readonly id: string;
    readonly name: string;
    readonly formula: string;
    readonly count: number;
}

export interface IAtomCount {
    readonly element: string;
    readonly count: number;
}

export interface ICellPotential {
    readonly oxidized: string;
    readonly reduced: string;
    readonly volts: number;
}

export interface IMeasureData {
    readonly composition: ReadonlyArray<ICompositionEntry>;
    readonly atoms: ReadonlyArray<IAtomCount>;
    readonly netCharge: number;
    readonly samples: ReadonlyArray<ILabSample>;
    readonly rates: ReadonlyArray<IRateEntry>;
    readonly rules: ReadonlyArray<IReactionRule>;
    readonly selectedRuleId: string;
    readonly potentials: ReadonlyArray<ICellPotential>;
    readonly energy: number;
}

export class LabRecorder {
    private static readonly SAMPLE_INTERVAL = 0.5;
    private static readonly RATE_WINDOW = 10;
    private static readonly MAX_SAMPLES = 240;

    private readonly samples: ILabSample[];
    private readonly eventTimes: Array<{ ruleId: string; at: number }>;
    private energy: number;
    private sinceSample: number;
    private lastTime: number;

    public constructor() {
        this.samples = [];
        this.eventTimes = [];
        this.energy = 0;
        this.sinceSample = 0;
        this.lastTime = 0;
    }

    public getSamples(): ReadonlyArray<ILabSample> {
        return this.samples;
    }

    public getEnergy(): number {
        return this.energy;
    }

    public sample(world: World, time: number): boolean {
        const elapsed = time - this.lastTime;
        this.lastTime = time;
        this.sinceSample += elapsed;
        if (this.samples.length > 0 && this.sinceSample < LabRecorder.SAMPLE_INTERVAL) {
            return false;
        }
        this.sinceSample = 0;
        this.samples.push({
            time,
            temperature: world.params.temperature,
            pressure: world.params.pressure,
            ph: world.params.ph,
            molecules: world.countAlive(),
            energy: this.energy,
        });
        while (this.samples.length > LabRecorder.MAX_SAMPLES) {
            this.samples.shift();
        }
        return true;
    }

    public noteEvent(event: IReactionEvent, time: number): void {
        if (event.deltaH !== undefined) {
            this.energy += event.deltaH;
        }
        this.eventTimes.push({ ruleId: event.ruleId, at: time });
        const cutoff = time - LabRecorder.RATE_WINDOW;
        while (this.eventTimes.length > 0 && this.eventTimes[0].at < cutoff) {
            this.eventTimes.shift();
        }
    }

    public rateAt(time: number): ReadonlyArray<IRateEntry> {
        const counts = new Map<string, number>();
        const cutoff = time - LabRecorder.RATE_WINDOW;
        for (const entry of this.eventTimes) {
            if (entry.at < cutoff) {
                continue;
            }
            counts.set(entry.ruleId, (counts.get(entry.ruleId) ?? 0) + 1);
        }
        const result: IRateEntry[] = [];
        for (const [ruleId, count] of counts) {
            result.push({
                ruleId,
                count,
                perSecond: count / LabRecorder.RATE_WINDOW,
            });
        }
        result.sort((a, b) => b.count - a.count);
        return result;
    }

    public reset(): void {
        this.samples.length = 0;
        this.eventTimes.length = 0;
        this.energy = 0;
        this.sinceSample = 0;
        this.lastTime = 0;
    }
}

export class ChamberAnalysis {
    public static composition(world: World): ICompositionEntry[] {
        const counts = new Map<string, { record: IMoleculeRecord; count: number }>();
        for (const inst of world.getInstanceList()) {
            const existing = counts.get(inst.record.id);
            if (existing === undefined) {
                counts.set(inst.record.id, { record: inst.record, count: 1 });
            } else {
                existing.count++;
            }
        }
        const result: ICompositionEntry[] = [];
        for (const [id, entry] of counts) {
            result.push({
                id,
                name: entry.record.name,
                formula: entry.record.formula,
                count: entry.count,
            });
        }
        result.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
        return result;
    }

    public static atomBalance(world: World): IAtomCount[] {
        const counts = new Map<string, number>();
        for (const inst of world.getInstanceList()) {
            for (const atom of inst.record.atoms) {
                counts.set(atom.el, (counts.get(atom.el) ?? 0) + 1);
            }
        }
        const result: IAtomCount[] = [];
        for (const [element, count] of counts) {
            result.push({ element, count });
        }
        result.sort((a, b) => b.count - a.count || a.element.localeCompare(b.element));
        return result;
    }

    public static netCharge(world: World): number {
        let charge = 0;
        for (const inst of world.getInstanceList()) {
            charge += inst.charge;
        }
        return charge;
    }

    public static cellPotentials(world: World): ICellPotential[] {
        const candidates = new Set<string>();
        for (const inst of world.getInstanceList()) {
            if (inst.charge > 0 || inst.record.atoms.length === 1) {
                for (const atom of inst.record.atoms) {
                    if (Thermochemistry.hasCouple(atom.el)) {
                        candidates.add(atom.el);
                    }
                }
            }
        }
        const elements = Array.from(candidates);
        const result: ICellPotential[] = [];
        for (const oxidized of elements) {
            for (const reduced of elements) {
                const volts = Thermochemistry.cellPotential(oxidized, reduced);
                if (volts !== null && volts > 0) {
                    result.push({ oxidized, reduced, volts });
                }
            }
        }
        result.sort((a, b) => b.volts - a.volts);
        return result;
    }
}
