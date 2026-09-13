import type { IMoleculeRecord, IMoleculeRegistry } from "../chem/MoleculeRecord";
import { MoleculeFactory } from "../chem/MoleculeFactory";
import { MoleculeCatalog } from "../chem/MoleculeCatalog";
import { ElementChemistry } from "../chem/ElementChemistry";
import { Thermochemistry } from "../chem/Thermochemistry";
import { ReactionGate } from "./ReactionGate";
import { SpatialHashGrid } from "./SpatialHashGrid";
import type { SeededRandom } from "./SeededRandom";
import type { World } from "./World";
import type { MoleculeInstance } from "./MoleculeInstance";
import type { IReactionSink } from "./ReactionEngine";

const BARRIERLESS_ELECTRONEGATIVITY = 3.5;
const GAS_CONSTANT = 0.008314;
const ACTIVATION_SCALE = 7.6;
const COMBUSTION_IGNITION = 700;
const HALOGENS = new Set(["F", "Cl", "Br", "I", "At"]);

interface ICombustionPlan {
    readonly fuelUnits: number;
    readonly oxygen: number;
    readonly carbonDioxide: number;
    readonly water: number;
    readonly sulfurDioxide: number;
    readonly nitrogen: number;
    readonly productAtoms: number;
}

interface ISubstitution {
    readonly heavy: string[];
    readonly bonds: Array<readonly [number, number, number]>;
    readonly charges: Array<readonly [number, number]>;
    readonly explicitH: Array<readonly [number, number]>;
    readonly formula: string;
    readonly enthalpy: number;
}

interface IReagent {
    readonly inst: MoleculeInstance;
    readonly element: string;
    readonly order: number;
}

export class OxidationEngine {
    private readonly registry: IMoleculeRegistry;
    private readonly factory: MoleculeFactory;
    private readonly radius: number;
    private readonly hydrideCache: Map<string, IMoleculeRecord>;
    private readonly planCache: Map<string, ICombustionPlan | null>;
    private readonly grid: SpatialHashGrid<MoleculeInstance>;
    private readonly nearby: MoleculeInstance[];
    private readonly reagents: IReagent[];
    private readonly oxygenList: MoleculeInstance[];

    public constructor(registry: IMoleculeRegistry, factory: MoleculeFactory, radius: number = 7) {
        this.registry = registry;
        this.factory = factory;
        this.radius = radius;
        this.hydrideCache = new Map();
        this.planCache = new Map();
        this.grid = new SpatialHashGrid<MoleculeInstance>(radius);
        this.nearby = [];
        this.reagents = [];
        this.oxygenList = [];
    }

    public update(world: World, rng: SeededRandom, sink: IReactionSink): void {
        const instances = world.getInstanceList();
        this.grid.clear();
        for (const inst of instances) {
            this.grid.insert(inst);
        }
        if (this.halogenate(world, instances, rng, sink)) {
            return;
        }
        this.combust(world, instances, rng, sink);
    }

    private nearbyOf(center: MoleculeInstance): MoleculeInstance[] {
        this.grid.queryRadius(center.px, center.py, center.pz, this.radius, this.nearby);
        return this.nearby;
    }

    private planOf(record: IMoleculeRecord): ICombustionPlan | null {
        const cached = this.planCache.get(record.id);
        if (cached !== undefined) {
            return cached;
        }
        const plan = OxidationEngine.combustionPlan(record);
        this.planCache.set(record.id, plan);
        return plan;
    }

    private halogenate(
        world: World,
        instances: ReadonlyArray<MoleculeInstance>,
        rng: SeededRandom,
        sink: IReactionSink,
    ): boolean {
        const reagents = this.reagents;
        reagents.length = 0;
        for (const inst of instances) {
            const info = OxidationEngine.reagentOf(inst.record);
            if (info !== null && HALOGENS.has(info.element)) {
                reagents.push({ inst, element: info.element, order: info.order });
            }
        }
        if (reagents.length === 0) {
            return false;
        }
        for (const { inst: reagent, element, order } of reagents) {
            const nearby = this.nearbyOf(reagent);
            nearby.sort(OxidationEngine.byId);
            for (const other of nearby) {
                if (other.id === reagent.id) {
                    continue;
                }
                const substitution = OxidationEngine.substitute(other.record, element, order);
                if (substitution === null) {
                    continue;
                }
                if (
                    !OxidationEngine.allow(
                        substitution.enthalpy,
                        ElementChemistry.get(element).electronegativity,
                        world,
                    )
                ) {
                    continue;
                }
                this.react(world, reagent, other, element, substitution, rng, sink);
                return true;
            }
        }
        return false;
    }

    private combust(
        world: World,
        instances: ReadonlyArray<MoleculeInstance>,
        rng: SeededRandom,
        sink: IReactionSink,
    ): void {
        const temperature = world.params.temperature;
        if (temperature <= 5) {
            return;
        }
        if (temperature < COMBUSTION_IGNITION && world.params.spark <= 0.05) {
            return;
        }
        const oxygen = this.oxygenList;
        oxygen.length = 0;
        for (const inst of instances) {
            if (OxidationEngine.isDioxygen(inst.record)) {
                oxygen.push(inst);
            }
        }
        if (oxygen.length === 0) {
            return;
        }
        const radiusSq = this.radius * this.radius;
        for (const fuel of instances) {
            const plan = this.planOf(fuel.record);
            if (plan === null) {
                continue;
            }
            if (!OxidationEngine.hasIgnitionContact(fuel, oxygen, radiusSq)) {
                continue;
            }
            let fuelAvailable = 0;
            for (const inst of instances) {
                if (inst.record.id === fuel.record.id) {
                    fuelAvailable++;
                }
            }
            const extent = Math.floor(
                Math.min(fuelAvailable / plan.fuelUnits, oxygen.length / plan.oxygen),
            );
            if (extent < 1) {
                continue;
            }
            const fuels = this.nearestOf(instances, fuel, fuel.record.id, extent * plan.fuelUnits);
            const oxidizers = this.nearestOf(oxygen, fuel, null, extent * plan.oxygen);
            this.burn(world, fuel, plan, extent, oxidizers, fuels, rng, sink);
            return;
        }
    }

    private static hasIgnitionContact(
        fuel: MoleculeInstance,
        oxygen: ReadonlyArray<MoleculeInstance>,
        radiusSq: number,
    ): boolean {
        for (const oxy of oxygen) {
            if (OxidationEngine.distanceSq(fuel, oxy) <= radiusSq) {
                return true;
            }
        }
        return false;
    }

    private nearestOf(
        sources: ReadonlyArray<MoleculeInstance>,
        center: MoleculeInstance,
        onlyId: string | null,
        count: number,
    ): MoleculeInstance[] {
        const eligible: MoleculeInstance[] = [];
        for (const inst of sources) {
            if (onlyId !== null && inst.record.id !== onlyId) {
                continue;
            }
            eligible.push(inst);
        }
        eligible.sort(
            (a, b) =>
                OxidationEngine.distanceSq(a, center) - OxidationEngine.distanceSq(b, center) ||
                a.id - b.id,
        );
        return eligible.slice(0, count);
    }

    private static byId(a: MoleculeInstance, b: MoleculeInstance): number {
        return a.id - b.id;
    }

    private static distanceSq(a: MoleculeInstance, b: MoleculeInstance): number {
        const dx = a.px - b.px;
        const dy = a.py - b.py;
        const dz = a.pz - b.pz;
        return dx * dx + dy * dy + dz * dz;
    }

    private burn(
        world: World,
        fuel: MoleculeInstance,
        plan: ICombustionPlan,
        extent: number,
        oxygen: ReadonlyArray<MoleculeInstance>,
        same: ReadonlyArray<MoleculeInstance>,
        rng: SeededRandom,
        sink: IReactionSink,
    ): void {
        const carbonDioxide = this.registry.findById("carbon-dioxide");
        const water = this.registry.findById("water");
        const sulfurDioxide = this.registry.findById("sulfur-dioxide");
        const nitrogen = this.registry.findById("nitrogen");
        if (
            carbonDioxide === undefined ||
            water === undefined ||
            sulfurDioxide === undefined ||
            nitrogen === undefined
        ) {
            return;
        }
        if (!world.canAccommodate(plan.productAtoms * extent)) {
            return;
        }
        const fuelUnits = plan.fuelUnits * extent;
        const oxygenUnits = plan.oxygen * extent;
        const consumed: MoleculeInstance[] = [];
        for (let i = 0; i < fuelUnits; i++) {
            consumed.push(same[i]);
        }
        for (let i = 0; i < oxygenUnits; i++) {
            consumed.push(oxygen[i]);
        }
        const center = OxidationEngine.centroid(consumed);
        for (const inst of consumed) {
            world.remove(inst.id);
        }
        OxidationEngine.emitUnits(world, carbonDioxide, plan.carbonDioxide * extent, center, rng);
        OxidationEngine.emitUnits(world, water, plan.water * extent, center, rng);
        OxidationEngine.emitUnits(world, sulfurDioxide, plan.sulfurDioxide * extent, center, rng);
        OxidationEngine.emitUnits(world, nitrogen, plan.nitrogen * extent, center, rng);
        const products: string[] = [];
        if (plan.carbonDioxide > 0) {
            products.push(plan.carbonDioxide * extent + " CO2");
        }
        if (plan.water > 0) {
            products.push(plan.water * extent + " H2O");
        }
        if (plan.sulfurDioxide > 0) {
            products.push(plan.sulfurDioxide * extent + " SO2");
        }
        if (plan.nitrogen > 0) {
            products.push(plan.nitrogen * extent + " N2");
        }
        sink.publish({
            ruleId: "combustion-" + fuel.record.id,
            message:
                fuel.record.name +
                " burns: " +
                fuelUnits +
                " " +
                fuel.record.formula +
                " + " +
                oxygenUnits +
                " O2 -> " +
                products.join(" + ") +
                ".",
            x: center.x,
            y: center.y,
            z: center.z,
            flash: "#ff8040",
            particles: "spark",
        });
    }

    private static emitUnits(
        world: World,
        record: IMoleculeRecord,
        count: number,
        center: { x: number; y: number; z: number },
        rng: SeededRandom,
    ): void {
        for (let i = 0; i < count; i++) {
            world.spawn(
                record,
                center.x + (rng.next() - 0.5) * 3,
                center.y + (rng.next() - 0.5) * 3,
                center.z + (rng.next() - 0.5) * 3,
                2,
            );
        }
    }

    private static isDioxygen(record: IMoleculeRecord): boolean {
        const atoms = record.atoms;
        return atoms.length === 2 && atoms[0].el === "O" && atoms[1].el === "O";
    }

    private static combustionPlan(record: IMoleculeRecord): ICombustionPlan | null {
        let carbon = 0;
        let hydrogen = 0;
        let nitrogen = 0;
        let sulfur = 0;
        let oxygen = 0;
        for (const atom of record.atoms) {
            if (atom.el === "C") {
                carbon++;
            } else if (atom.el === "H") {
                hydrogen++;
            } else if (atom.el === "N") {
                nitrogen++;
            } else if (atom.el === "S") {
                sulfur++;
            } else if (atom.el === "O") {
                oxygen++;
            } else {
                return null;
            }
        }
        if (carbon + hydrogen + sulfur === 0) {
            return null;
        }
        const needed = 4 * carbon + hydrogen + 4 * sulfur - 2 * oxygen;
        if (needed <= 0) {
            return null;
        }
        let divisor = 4;
        for (const value of [needed, 4 * carbon, 2 * hydrogen, 4 * sulfur, 2 * nitrogen]) {
            divisor = ElementChemistry.gcd(divisor, value);
        }
        const carbonDioxide = (4 * carbon) / divisor;
        const water = (2 * hydrogen) / divisor;
        const sulfurDioxide = (4 * sulfur) / divisor;
        const nitrogenProduct = (2 * nitrogen) / divisor;
        return {
            fuelUnits: 4 / divisor,
            oxygen: needed / divisor,
            carbonDioxide,
            water,
            sulfurDioxide,
            nitrogen: nitrogenProduct,
            productAtoms: carbonDioxide * 3 + water * 3 + sulfurDioxide * 3 + nitrogenProduct * 2,
        };
    }

    private static centroid(instances: ReadonlyArray<MoleculeInstance>): {
        x: number;
        y: number;
        z: number;
    } {
        let x = 0;
        let y = 0;
        let z = 0;
        for (const inst of instances) {
            x += inst.px;
            y += inst.py;
            z += inst.pz;
        }
        const count = Math.max(1, instances.length);
        return { x: x / count, y: y / count, z: z / count };
    }

    private static allow(enthalpy: number, electronegativity: number, world: World): boolean {
        if (world.params.temperature <= 5) {
            return false;
        }
        if (electronegativity >= BARRIERLESS_ELECTRONEGATIVITY) {
            return true;
        }
        const activation = ReactionGate.activationEnergy(enthalpy, world);
        return world.params.temperature * GAS_CONSTANT >= activation / ACTIVATION_SCALE;
    }

    private react(
        world: World,
        reagent: MoleculeInstance,
        target: MoleculeInstance,
        element: string,
        substitution: ISubstitution,
        rng: SeededRandom,
        sink: IReactionSink,
    ): void {
        const product = this.buildRecord(
            "synth-" + substitution.formula.toLowerCase(),
            substitution.formula,
            substitution.heavy,
            substitution.bonds,
            substitution.charges,
            substitution.explicitH,
        );
        const hydride = this.hydrideRecord(element);
        const cx = (reagent.px + target.px) / 2;
        const cy = (reagent.py + target.py) / 2;
        const cz = (reagent.pz + target.pz) / 2;
        if (!world.canAccommodate(product.atoms.length + hydride.atoms.length)) {
            return;
        }
        world.remove(reagent.id);
        world.remove(target.id);
        world.spawn(product, cx + (rng.next() - 0.5) * 1.5, cy, cz, 3);
        world.spawn(hydride, cx, cy + 1.5, cz + (rng.next() - 0.5) * 1.5, 3);
        sink.publish({
            ruleId: "oxidation-" + element,
            message:
                element +
                "2 oxidizes " +
                target.record.name +
                ": " +
                target.record.formula +
                " + " +
                element +
                "2 -> " +
                substitution.formula +
                " + " +
                hydride.formula +
                " (delta-H " +
                Math.round(substitution.enthalpy) +
                " kJ/mol).",
            x: cx,
            y: cy,
            z: cz,
            flash: "#b6f0ff",
            particles: "puff",
            deltaH: substitution.enthalpy,
        });
    }

    private static reagentOf(record: IMoleculeRecord): { element: string; order: number } | null {
        const atoms = record.atoms;
        if (atoms.length !== 2) {
            return null;
        }
        const element = atoms[0].el;
        if (element !== atoms[1].el || !ElementChemistry.has(element)) {
            return null;
        }
        const hydrogen = ElementChemistry.get("H").electronegativity;
        if (ElementChemistry.get(element).electronegativity <= hydrogen) {
            return null;
        }
        return { element, order: record.bonds.length > 0 ? record.bonds[0].order : 1 };
    }

    private static substitute(
        record: IMoleculeRecord,
        oxidizer: string,
        oxidizerOrder: number,
    ): ISubstitution | null {
        const heavyIndex = new Map<number, number>();
        const heavy: string[] = [];
        const charges: Array<readonly [number, number]> = [];
        for (let i = 0; i < record.atoms.length; i++) {
            const atom = record.atoms[i];
            if (atom.el === "H") {
                continue;
            }
            heavyIndex.set(i, heavy.length);
            heavy.push(atom.el);
            if (atom.charge !== 0) {
                charges.push([heavy.length - 1, atom.charge]);
            }
        }
        const explicitH = new Array<number>(heavy.length).fill(0);
        const bonds: Array<readonly [number, number, number]> = [];
        for (const bond of record.bonds) {
            const a = heavyIndex.get(bond.a);
            const b = heavyIndex.get(bond.b);
            if (a !== undefined && b !== undefined) {
                bonds.push([a, b, bond.order]);
                continue;
            }
            const heavyEnd = a ?? b;
            if (heavyEnd !== undefined) {
                explicitH[heavyEnd] += 1;
            }
        }
        let best: ISubstitution | null = null;
        for (let i = 0; i < heavy.length; i++) {
            const site = heavy[i];
            if (explicitH[i] <= 0 || site === oxidizer || !ElementChemistry.has(site)) {
                continue;
            }
            const siteHydrogen = Thermochemistry.bondEnergy(site, "H", 1);
            const siteOxidizer = Thermochemistry.bondEnergy(site, oxidizer, 1);
            const oxidizerBond = Thermochemistry.bondEnergy(oxidizer, oxidizer, oxidizerOrder);
            const hydrogenOxidizer = Thermochemistry.bondEnergy("H", oxidizer, 1);
            if (
                siteHydrogen === null ||
                siteOxidizer === null ||
                oxidizerBond === null ||
                hydrogenOxidizer === null
            ) {
                continue;
            }
            const enthalpy = siteHydrogen + oxidizerBond - siteOxidizer - hydrogenOxidizer;
            if (best !== null && enthalpy >= best.enthalpy) {
                continue;
            }
            const nextHeavy = [...heavy, oxidizer];
            const nextBonds: Array<readonly [number, number, number]> = [
                ...bonds,
                [i, heavy.length, 1],
            ];
            const nextH = explicitH.map((count) => count);
            nextH[i] -= 1;
            const nextExplicit: Array<readonly [number, number]> = [];
            for (let h = 0; h < nextH.length; h++) {
                if (nextH[h] > 0) {
                    nextExplicit.push([h, nextH[h]]);
                }
            }
            best = {
                heavy: nextHeavy,
                bonds: nextBonds,
                charges,
                explicitH: nextExplicit,
                formula: MoleculeCatalog.formulaOf(nextHeavy, nextBonds, charges, nextExplicit),
                enthalpy,
            };
        }
        return best;
    }

    private hydrideRecord(element: string): IMoleculeRecord {
        const cached = this.hydrideCache.get(element);
        if (cached !== undefined) {
            return cached;
        }
        const name = "Hydrogen " + ElementChemistry.get(element).anionName;
        const record = this.buildRecord(
            "synth-h" + element.toLowerCase(),
            name,
            ["H", element],
            [[0, 1, 1]],
            [],
            [],
        );
        this.hydrideCache.set(element, record);
        return record;
    }

    private buildRecord(
        id: string,
        name: string,
        heavy: ReadonlyArray<string>,
        bonds: ReadonlyArray<readonly [number, number, number]>,
        charges: ReadonlyArray<readonly [number, number]>,
        explicitH: ReadonlyArray<readonly [number, number]>,
    ): IMoleculeRecord {
        return this.factory.build({
            id,
            name,
            formula: MoleculeCatalog.formulaOf(heavy, bonds, charges, explicitH),
            smiles: "",
            category: "functional",
            tags: ["compound", "synthesized"],
            warn: false,
            inchi: "",
            heavy,
            bonds,
            charges,
            explicitH,
        });
    }
}
