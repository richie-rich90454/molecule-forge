import type { IMoleculeRecord, IMoleculeRegistry } from "../chem/MoleculeRecord";
import { MoleculeFactory } from "../chem/MoleculeFactory";
import { MoleculeCatalog } from "../chem/MoleculeCatalog";
import { ElementChemistry } from "../chem/ElementChemistry";
import { Thermochemistry } from "../chem/Thermochemistry";
import { ReactionGate } from "./ReactionGate";
import type { SeededRandom } from "./SeededRandom";
import type { World } from "./World";
import type { MoleculeInstance } from "./MoleculeInstance";
import type { IReactionSink } from "./ReactionEngine";

const BARRIERLESS_ELECTRONEGATIVITY = 3.5;
const GAS_CONSTANT = 0.008314;
const ACTIVATION_SCALE = 7.6;

interface ISubstitution {
    readonly heavy: string[];
    readonly bonds: Array<readonly [number, number, number]>;
    readonly charges: Array<readonly [number, number]>;
    readonly explicitH: Array<readonly [number, number]>;
    readonly formula: string;
    readonly enthalpy: number;
}

export class OxidationEngine {
    private readonly registry: IMoleculeRegistry;
    private readonly factory: MoleculeFactory;
    private readonly radius: number;
    private readonly hydrideCache: Map<string, IMoleculeRecord>;

    public constructor(registry: IMoleculeRegistry, factory: MoleculeFactory, radius: number = 7) {
        this.registry = registry;
        this.factory = factory;
        this.radius = radius;
        this.hydrideCache = new Map();
    }

    public update(world: World, rng: SeededRandom, sink: IReactionSink): void {
        const instances = world.getInstanceList();
        const reagents = instances
            .map((inst) => ({ inst, info: OxidationEngine.reagentOf(inst.record) }))
            .filter((entry) => entry.info !== null);
        if (reagents.length === 0) {
            return;
        }
        for (const { inst: reagent, info } of reagents) {
            const target = info as { element: string; order: number };
            for (const other of instances) {
                if (other.id === reagent.id) {
                    continue;
                }
                const dx = other.px - reagent.px;
                const dy = other.py - reagent.py;
                const dz = other.pz - reagent.pz;
                if (dx * dx + dy * dy + dz * dz > this.radius * this.radius) {
                    continue;
                }
                const substitution = OxidationEngine.substitute(
                    other.record,
                    target.element,
                    target.order,
                );
                if (substitution === null) {
                    continue;
                }
                if (
                    !OxidationEngine.allow(
                        substitution.enthalpy,
                        ElementChemistry.get(target.element).electronegativity,
                        world,
                    )
                ) {
                    continue;
                }
                this.react(world, reagent, other, target.element, substitution, rng, sink);
                return;
            }
        }
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
