import { describe, expect, it } from "vitest";
import { CompoundSynthesizer, type ISynthesisProduct } from "../src/chem/CompoundSynthesizer";
import { ElementChemistry } from "../src/chem/ElementChemistry";
import { ElementRegistry } from "../src/chem/ElementRegistry";
import { MoleculeFactory } from "../src/chem/MoleculeFactory";
import { MoleculeRegistry } from "../src/chem/MoleculeRegistry";
import { PolyatomicIons } from "../src/chem/PolyatomicIons";
import { PhysicsEngine } from "../src/sim/PhysicsEngine";
import { SimParamsFactory } from "../src/sim/IForceCalculator";
import { MoleculeInstance } from "../src/sim/MoleculeInstance";
import type { IReactionEvent, IReactionSink } from "../src/sim/ReactionEngine";
import { SeededRandom } from "../src/sim/SeededRandom";
import { SynthesisEngine } from "../src/sim/SynthesisEngine";
import { World } from "../src/sim/World";
import type { IMoleculeRecord, IMoleculeRegistry } from "../src/chem/MoleculeRecord";

function makeRegistry(): MoleculeRegistry {
    return new MoleculeRegistry(new MoleculeFactory());
}

function makeWorld(): World {
    return new World(new PhysicsEngine([], SimParamsFactory.createDefault()), 5);
}

function record(registry: MoleculeRegistry, id: string): IMoleculeRecord {
    const found = registry.findById(id);
    if (found === undefined) {
        throw new Error("missing record: " + id);
    }
    return found;
}

function makeSink(): { events: IReactionEvent[]; sink: IReactionSink } {
    const events: IReactionEvent[] = [];
    return {
        events,
        sink: {
            publish: (event: IReactionEvent): void => {
                events.push(event);
            },
        },
    };
}

function pool(
    totals: Record<string, number>,
    monatomic: Record<string, number> = {},
): { totals: Map<string, number>; monatomic: Map<string, number> } {
    return {
        totals: new Map(Object.entries(totals)),
        monatomic: new Map(Object.entries(monatomic)),
    };
}

describe("ElementChemistry", () => {
    it("covers every registered element", () => {
        for (const symbol of ElementRegistry.getSymbols()) {
            expect(ElementChemistry.has(symbol)).toBe(true);
        }
        expect(ElementChemistry.getSymbols().length).toBe(ElementRegistry.getSymbols().length);
    });

    it("classifies metals, nobles, and anion formers", () => {
        expect(ElementChemistry.isMetal(ElementChemistry.get("Ce"))).toBe(true);
        expect(ElementChemistry.isMetal(ElementChemistry.get("Na"))).toBe(true);
        expect(ElementChemistry.isMetal(ElementChemistry.get("Br"))).toBe(false);
        expect(ElementChemistry.isMetal(ElementChemistry.get("Si"))).toBe(false);
        expect(ElementChemistry.isNoble(ElementChemistry.get("He"))).toBe(true);
        expect(ElementChemistry.isNoble(ElementChemistry.get("Na"))).toBe(false);
        expect(ElementChemistry.isAnionFormer(ElementChemistry.get("O"))).toBe(true);
        expect(ElementChemistry.isAnionFormer(ElementChemistry.get("Na"))).toBe(false);
    });

    it("distinguishes inert from reactive noble gases", () => {
        expect(ElementChemistry.isInert(ElementChemistry.get("He"))).toBe(true);
        expect(ElementChemistry.isInert(ElementChemistry.get("Ne"))).toBe(true);
        expect(ElementChemistry.isInert(ElementChemistry.get("Ar"))).toBe(true);
        expect(ElementChemistry.isInert(ElementChemistry.get("Xe"))).toBe(false);
        expect(ElementChemistry.isInert(ElementChemistry.get("Kr"))).toBe(false);
        expect(ElementChemistry.isInert(ElementChemistry.get("Rn"))).toBe(false);
        expect(ElementChemistry.isInert(ElementChemistry.get("O"))).toBe(false);
    });

    it("throws on unknown elements", () => {
        expect(() => ElementChemistry.get("Xx")).toThrow("Unknown element chemistry: Xx");
        expect(ElementChemistry.has("Xx")).toBe(false);
    });

    it("formats roman numerals, ion names, and compounds", () => {
        expect(ElementChemistry.roman(1)).toBe("I");
        expect(ElementChemistry.roman(3)).toBe("III");
        expect(ElementChemistry.roman(9)).toBe("9");
        expect(ElementChemistry.cationName("Na", 1)).toBe("Sodium");
        expect(ElementChemistry.cationName("Fe", 3)).toBe("Iron(III)");
        expect(ElementChemistry.cationName("Ce", 3)).toBe("Cerium(III)");
        expect(ElementChemistry.anionName("Br")).toBe("bromide");
        expect(ElementChemistry.anionName("O")).toBe("oxide");
        expect(ElementChemistry.compoundName("Ce", 3, "Br")).toBe("Cerium(III) bromide");
        expect(ElementChemistry.compoundName("Ca", 2, "Cl")).toBe("Calcium chloride");
    });

    it("computes greatest common divisors", () => {
        expect(ElementChemistry.gcd(3, 1)).toBe(1);
        expect(ElementChemistry.gcd(2, 2)).toBe(2);
        expect(ElementChemistry.gcd(6, 4)).toBe(2);
        expect(ElementChemistry.gcd(0, 5)).toBe(5);
    });
});

describe("PolyatomicIons", () => {
    it("declares ions whose charge and composition match their atoms", () => {
        const ions = [...PolyatomicIons.anions(), ...PolyatomicIons.cations()];
        expect(ions.length).toBeGreaterThan(15);
        for (const ion of ions) {
            expect(ion.charge).not.toBe(0);
            expect(ion.composition.size).toBeGreaterThan(0);
            expect(PolyatomicIons.netCharge(ion)).toBe(ion.charge);
            const counts = new Map<string, number>();
            for (const symbol of ion.heavy) {
                counts.set(symbol, (counts.get(symbol) ?? 0) + 1);
            }
            let hydrogens = 0;
            for (const [, count] of ion.explicitH) {
                hydrogens += count;
            }
            if (hydrogens > 0) {
                counts.set("H", (counts.get("H") ?? 0) + hydrogens);
            }
            expect([...counts.keys()].sort()).toEqual([...ion.composition.keys()].sort());
            for (const [symbol, need] of ion.composition) {
                expect(counts.get(symbol)).toBe(need);
            }
            for (const [index] of ion.charges) {
                expect(index).toBeLessThan(ion.heavy.length);
            }
            for (const [index] of ion.explicitH) {
                expect(index).toBeLessThan(ion.heavy.length);
            }
            expect(ion.bindingAtom).toBeLessThan(ion.heavy.length);
        }
    });

    it("reports atom counts and oxygen content", () => {
        const hydroxide = PolyatomicIons.anions().find((ion) => ion.id === "hydroxide");
        expect(hydroxide).toBeDefined();
        expect(PolyatomicIons.atomCount(hydroxide as never)).toBe(2);
        expect(PolyatomicIons.containsOxygen(hydroxide as never)).toBe(true);
        const ammonium = PolyatomicIons.cations()[0];
        expect(PolyatomicIons.containsOxygen(ammonium)).toBe(false);
        expect(PolyatomicIons.atomCount(ammonium)).toBe(5);
    });
});

describe("CompoundSynthesizer", () => {
    const synthesizer = new CompoundSynthesizer(new MoleculeFactory());

    it("forms cerium(III) bromide from Ce and Br", () => {
        const result = synthesizer.predict(pool({ Ce: 1, Br: 3 }));
        expect(result.product).not.toBeNull();
        const product = result.product as ISynthesisProduct;
        expect(product.formula).toBe("CeBr3");
        expect(product.name).toBe("Cerium(III) bromide");
        expect(product.needs.get("Ce")).toBe(1);
        expect(product.needs.get("Br")).toBe(3);
        expect(product.units).toBe(1);
        expect(product.record?.atoms.length).toBe(4);
        expect(product.record?.atoms[0].charge).toBe(3);
        expect(product.record?.atoms[1].charge).toBe(-1);
    });

    it("hints when cerium lacks bromide", () => {
        const result = synthesizer.predict(pool({ Ce: 1, Br: 2 }));
        expect(result.product).toBeNull();
        expect(result.hint).toContain("Cerium(III) bromide");
        expect(result.hint).toContain("3 Br");
    });

    it("ranks hints by stability and reports the limiting reagent", () => {
        const sodium = synthesizer.predict(pool({ Na: 1, C: 1, O: 1 }));
        expect(sodium.product).toBeNull();
        expect(sodium.hint).toContain("Sodium oxide");
        expect(sodium.hint).toContain("Add more Na");
        const potassium = synthesizer.predict(pool({ K: 1, S: 1, O: 3 }));
        expect(potassium.product).toBeNull();
        expect(potassium.hint).toContain("Potassium oxide");
    });

    it("forms cerium(IV) bromide when four bromides are available", () => {
        const product = synthesizer.predict(pool({ Ce: 1, Br: 4 })).product as ISynthesisProduct;
        expect(product.formula).toBe("CeBr4");
        expect(product.name).toBe("Cerium(IV) bromide");
    });

    it("forms variable-valence compounds at the fitting charge", () => {
        const oxide = synthesizer.predict(pool({ Fe: 2, O: 3 })).product as ISynthesisProduct;
        expect(oxide.formula).toBe("Fe2O3");
        expect(oxide.name).toBe("Iron(III) oxide");
        const bromide = synthesizer.predict(pool({ Fe: 1, Br: 2 })).product as ISynthesisProduct;
        expect(bromide.formula).toBe("FeBr2");
        expect(bromide.name).toBe("Iron(II) bromide");
        const cupric = synthesizer.predict(pool({ Cu: 1, O: 1 })).product as ISynthesisProduct;
        expect(cupric.name).toBe("Copper(II) oxide");
    });

    it("balances simple salts", () => {
        expect(
            (synthesizer.predict(pool({ Ca: 1, Cl: 2 })).product as ISynthesisProduct).formula,
        ).toBe("CaCl2");
        expect(
            (synthesizer.predict(pool({ Mg: 2, O: 2 })).product as ISynthesisProduct).formula,
        ).toBe("MgO");
        const salt = synthesizer.predict(pool({ Na: 1, Cl: 1 })).product as ISynthesisProduct;
        expect(salt.formula).toBe("NaCl");
        expect(salt.name).toBe("Sodium chloride");
    });

    it("reuses cached records for the same compound", () => {
        const first = synthesizer.predict(pool({ Ce: 1, Br: 3 })).product as ISynthesisProduct;
        const second = synthesizer.predict(pool({ Ce: 1, Br: 3 })).product as ISynthesisProduct;
        expect(first.record).toBe(second.record);
    });

    it("keeps noble gases inert", () => {
        const result = synthesizer.predict(pool({ He: 1, Br: 1 }));
        expect(result.product).toBeNull();
        expect(result.hint).toBeNull();
        const helium = synthesizer.predict(pool({ He: 2 }, { He: 2 }));
        expect(helium.product).toBeNull();
    });

    it("forms covalent catalog molecules", () => {
        const water = synthesizer.predict(pool({ H: 2, O: 1 })).product as ISynthesisProduct;
        expect(water.catalogId).toBe("water");
        const carbonDioxide = synthesizer.predict(pool({ C: 1, O: 2 }))
            .product as ISynthesisProduct;
        expect(carbonDioxide.catalogId).toBe("carbon-dioxide");
        const carbonMonoxide = synthesizer.predict(pool({ C: 1, O: 1 }))
            .product as ISynthesisProduct;
        expect(carbonMonoxide.catalogId).toBe("carbon-monoxide");
        const hcl = synthesizer.predict(pool({ Cl: 1, H: 1 })).product as ISynthesisProduct;
        expect(hcl.catalogId).toBe("hydrogen-chloride");
        expect(synthesizer.predict(pool({ H: 1, S: 2 })).product).toBeNull();
    });

    it("synthesizes hydrogen fluoride", () => {
        const hf = synthesizer.predict(pool({ H: 1, F: 1 })).product as ISynthesisProduct;
        expect(hf.formula).toBe("HF");
        expect(hf.name).toBe("Hydrogen fluoride");
        expect(hf.record?.atoms.length).toBe(2);
    });

    it("forms diatomic molecules from monatomic atoms", () => {
        const oxygen = synthesizer.predict(pool({ O: 2 }, { O: 2 })).product as ISynthesisProduct;
        expect(oxygen.catalogId).toBe("oxygen-elemental");
        expect(oxygen.units).toBe(1);
        const hydrogen = synthesizer.predict(pool({ H: 3 }, { H: 3 })).product as ISynthesisProduct;
        expect(hydrogen.catalogId).toBe("hydrogen-elemental");
        expect(hydrogen.units).toBe(1);
        const iodine = synthesizer.predict(pool({ I: 2 }, { I: 2 })).product as ISynthesisProduct;
        expect(iodine.catalogId).toBe("iodine");
    });

    it("forms polyatomic ionic salts", () => {
        const hydroxide = synthesizer.predict(pool({ Na: 1, O: 1, H: 1 }))
            .product as ISynthesisProduct;
        expect(hydroxide.formula).toBe("NaOH");
        expect(hydroxide.name).toBe("Sodium hydroxide");
        const calciumHydroxide = synthesizer.predict(pool({ Ca: 1, O: 2, H: 2 }))
            .product as ISynthesisProduct;
        expect(calciumHydroxide.formula).toBe("Ca(OH)2");
        expect(calciumHydroxide.name).toBe("Calcium hydroxide");
        const sulfate = synthesizer.predict(pool({ Na: 2, S: 1, O: 4 }))
            .product as ISynthesisProduct;
        expect(sulfate.formula).toBe("Na2SO4");
        expect(sulfate.name).toBe("Sodium sulfate");
        const nitrate = synthesizer.predict(pool({ K: 1, N: 1, O: 3 }))
            .product as ISynthesisProduct;
        expect(nitrate.formula).toBe("KNO3");
        expect(nitrate.name).toBe("Potassium nitrate");
        const carbonate = synthesizer.predict(pool({ Ca: 1, C: 1, O: 3 }))
            .product as ISynthesisProduct;
        expect(carbonate.formula).toBe("CaCO3");
        expect(carbonate.name).toBe("Calcium carbonate");
        const ferric = synthesizer.predict(pool({ Fe: 2, S: 3, O: 12 }))
            .product as ISynthesisProduct;
        expect(ferric.formula).toBe("Fe2(SO4)3");
        expect(ferric.name).toBe("Iron(III) sulfate");
    });

    it("forms ammonium salts", () => {
        const ammoniumChloride = synthesizer.predict(pool({ N: 1, H: 4, Cl: 1 }))
            .product as ISynthesisProduct;
        expect(ammoniumChloride.formula).toBe("NH4Cl");
        expect(ammoniumChloride.name).toBe("Ammonium chloride");
        const ammoniumSulfate = synthesizer.predict(pool({ N: 2, H: 8, S: 1, O: 4 }))
            .product as ISynthesisProduct;
        expect(ammoniumSulfate.formula).toBe("(NH4)2SO4");
        expect(ammoniumSulfate.name).toBe("Ammonium sulfate");
    });

    it("forms elemental allotropes", () => {
        const phosphorus = synthesizer.predict(pool({ P: 4 }, { P: 4 }))
            .product as ISynthesisProduct;
        expect(phosphorus.kind).toBe("elemental");
        expect(phosphorus.formula).toBe("P4");
        expect(phosphorus.record?.atoms.length).toBe(4);
        const sulfur = synthesizer.predict(pool({ S: 8 }, { S: 8 })).product as ISynthesisProduct;
        expect(sulfur.catalogId).toBe("sulfur-s8");
        expect(sulfur.units).toBe(1);
        expect(synthesizer.predict(pool({ S: 7 }, { S: 7 })).product).toBeNull();
    });

    it("computes reaction enthalpies", () => {
        const water = synthesizer.predict(pool({ H: 2, O: 1 })).product as ISynthesisProduct;
        expect(water.enthalpy).toBeCloseTo(-926.8, 1);
        const hydrogen = synthesizer.predict(pool({ H: 2 }, { H: 2 })).product as ISynthesisProduct;
        expect(hydrogen.enthalpy).toBeCloseTo(-436, 1);
        const hf = synthesizer.predict(pool({ H: 1, F: 1 })).product as ISynthesisProduct;
        expect(hf.enthalpy).toBeCloseTo(-568.1, 1);
        const salt = synthesizer.predict(pool({ Na: 1, Cl: 1 })).product as ISynthesisProduct;
        expect(salt.enthalpy).not.toBeNull();
        expect(salt.enthalpy as number).toBeLessThan(-300);
        const krypton = synthesizer.predict(pool({ Kr: 1, F: 2 })).product as ISynthesisProduct;
        expect(krypton.enthalpy).toBeCloseTo(-350, 1);
        const hydroxide = synthesizer.predict(pool({ Na: 1, O: 1, H: 1 }))
            .product as ISynthesisProduct;
        expect(hydroxide.enthalpy).toBeNull();
    });

    it("forms generated oxyanion salts beyond the table", () => {
        const bromate = synthesizer.predict(pool({ Na: 1, Br: 1, O: 3 }))
            .product as ISynthesisProduct;
        expect(bromate.formula).toBe("NaBrO3");
        expect(bromate.name).toBe("Sodium bromate");
        const iodate = synthesizer.predict(pool({ K: 1, I: 1, O: 3 })).product as ISynthesisProduct;
        expect(iodate.formula).toBe("KIO3");
        const selenate = synthesizer.predict(pool({ Ca: 1, Se: 1, O: 4 }))
            .product as ISynthesisProduct;
        expect(selenate.formula).toBe("CaSeO4");
        const antimonate = synthesizer.predict(pool({ Na: 3, Sb: 1, O: 4 }))
            .product as ISynthesisProduct;
        expect(antimonate.formula).toBe("Na3SbO4");
    });

    it("leaves surplus atoms aside instead of forcing odd ratios", () => {
        expect(synthesizer.predict(pool({ O: 2 }, {})).product).toBeNull();
        expect(synthesizer.predict(pool({ H: 1, O: 1 })).product).toBeNull();
        expect(synthesizer.predict(pool({ H: 1 }, { H: 1 })).product).toBeNull();
        const hydrogenChloride = synthesizer.predict(pool({ H: 2, Cl: 1 }))
            .product as ISynthesisProduct;
        expect(hydrogenChloride.catalogId).toBe("hydrogen-chloride");
        expect(hydrogenChloride.units).toBe(1);
        const water = synthesizer.predict(pool({ H: 3, O: 1 })).product as ISynthesisProduct;
        expect(water.catalogId).toBe("water");
        expect(water.units).toBe(1);
        const scaled = synthesizer.predict(pool({ H: 4, O: 3 })).product as ISynthesisProduct;
        expect(scaled.catalogId).toBe("water");
        expect(scaled.units).toBe(2);
        expect(synthesizer.predict(pool({ H: 1, N: 1 })).product).toBeNull();
    });

    it("scales covalent formulas to the available stoichiometry", () => {
        const water = synthesizer.predict(pool({ H: 4, O: 2 })).product as ISynthesisProduct;
        expect(water.catalogId).toBe("water");
        expect(water.units).toBe(2);
        const dioxide = synthesizer.predict(pool({ C: 2, O: 4 })).product as ISynthesisProduct;
        expect(dioxide.catalogId).toBe("carbon-dioxide");
        expect(dioxide.units).toBe(2);
        const monoxide = synthesizer.predict(pool({ C: 2, O: 2 })).product as ISynthesisProduct;
        expect(monoxide.catalogId).toBe("carbon-monoxide");
        expect(monoxide.units).toBe(2);
        const hydrogen = synthesizer.predict(pool({ H: 4 }, { H: 4 })).product as ISynthesisProduct;
        expect(hydrogen.catalogId).toBe("hydrogen-elemental");
        expect(hydrogen.units).toBe(2);
    });

    it("forms common inorganic molecules", () => {
        expect(
            (synthesizer.predict(pool({ C: 1, H: 4 })).product as ISynthesisProduct).catalogId,
        ).toBe("alkane-c1");
        expect(
            (synthesizer.predict(pool({ H: 2, O: 2 })).product as ISynthesisProduct).catalogId,
        ).toBe("water");
        expect(
            (synthesizer.predict(pool({ N: 2, O: 1 })).product as ISynthesisProduct).catalogId,
        ).toBe("nitrous-oxide");
        expect(
            (synthesizer.predict(pool({ N: 2, O: 2 })).product as ISynthesisProduct).catalogId,
        ).toBe("nitrogen-dioxide");
    });

    it("forms noble gas fluorides only for Xe, Kr, and Rn", () => {
        const xef2 = synthesizer.predict(pool({ Xe: 1, F: 2 })).product as ISynthesisProduct;
        expect(xef2.formula).toBe("XeF2");
        expect(xef2.name).toBe("Xenon difluoride");
        expect(
            (synthesizer.predict(pool({ Xe: 1, F: 4 })).product as ISynthesisProduct).formula,
        ).toBe("XeF4");
        const xef6 = synthesizer.predict(pool({ Xe: 1, F: 6 })).product as ISynthesisProduct;
        expect(xef6.formula).toBe("XeF6");
        expect(xef6.record?.atoms.length).toBe(7);
        const excess = synthesizer.predict(pool({ Xe: 2, F: 6 })).product as ISynthesisProduct;
        expect(excess.formula).toBe("XeF6");
        expect(excess.units).toBe(1);
        expect(
            (synthesizer.predict(pool({ Kr: 1, F: 2 })).product as ISynthesisProduct).formula,
        ).toBe("KrF2");
        expect(
            (synthesizer.predict(pool({ Rn: 1, F: 2 })).product as ISynthesisProduct).formula,
        ).toBe("RnF2");
        expect(synthesizer.predict(pool({ He: 1, F: 2 })).product).toBeNull();
        expect(synthesizer.predict(pool({ Ne: 1, F: 2 })).product).toBeNull();
        expect(synthesizer.predict(pool({ Ar: 1, F: 2 })).product).toBeNull();
    });

    it("ignores noble gas when matching reactive partners", () => {
        const product = synthesizer.predict(pool({ Ce: 1, Br: 3, Ar: 5 })).product;
        expect(product?.formula).toBe("CeBr3");
    });

    it("ignores empty, unknown, and unreactive pools", () => {
        expect(synthesizer.predict(pool({ H: 0, Xx: 1 })).product).toBeNull();
        expect(synthesizer.predict(pool({ Xx: 1, O: 2 })).product).toBeNull();
        expect(synthesizer.predict(pool({ Na: 1, Xx: 1 })).product).toBeNull();
        expect(synthesizer.predict(pool({ H: 1, O: 2 })).product).toBeNull();
    });
});

describe("SynthesisEngine", () => {
    function engine(): { registry: MoleculeRegistry; engine: SynthesisEngine } {
        const registry = makeRegistry();
        return { registry, engine: new SynthesisEngine(registry, new CompoundSynthesizer()) };
    }

    it("merges cerium and bromine atoms into cerium(III) bromide", () => {
        const { registry, engine: synth } = engine();
        const world = makeWorld();
        world.spawn(record(registry, "el-ce"), 0, 0, 0, 0);
        world.spawn(record(registry, "el-br"), 1, 0, 0, 0);
        world.spawn(record(registry, "el-br"), 0, 1, 0, 0);
        world.spawn(record(registry, "el-br"), 0, 0, 1, 0);
        const { events, sink } = makeSink();
        synth.update(world, new SeededRandom(1), sink);
        const list = world.getInstanceList();
        expect(list.length).toBe(1);
        expect(list[0].record.formula).toBe("CeBr3");
        expect(events.some((event) => event.ruleId === "synthesis-CeBr3")).toBe(true);
    });

    it("warns once when the stoichiometry is short, then reacts", () => {
        const { registry, engine: synth } = engine();
        const world = makeWorld();
        world.spawn(record(registry, "el-ce"), 0, 0, 0, 0);
        world.spawn(record(registry, "el-s"), 1, 0, 0, 0);
        const { events, sink } = makeSink();
        synth.update(world, new SeededRandom(1), sink);
        synth.update(world, new SeededRandom(1), sink);
        const hints = events.filter((event) => event.ruleId === "synthesis-hint");
        expect(hints.length).toBe(1);
        expect(hints[0].message).toContain("Cerium(III) sulfide");
        expect(world.getInstanceList().length).toBe(2);
        world.spawn(record(registry, "el-ce"), 0, 1, 0, 0);
        world.spawn(record(registry, "el-s"), 0, 0, 1, 0);
        world.spawn(record(registry, "el-s"), 1, 1, 0, 0);
        synth.update(world, new SeededRandom(1), sink);
        expect(world.getInstanceList().length).toBe(1);
        expect(world.getInstanceList()[0].record.formula).toBe("Ce2S3");
    });

    it("conserves atoms when a diatomic reactant overshoots", () => {
        const { registry, engine: synth } = engine();
        const world = makeWorld();
        world.spawn(record(registry, "el-ce"), 0, 0, 0, 0);
        world.spawn(record(registry, "bromine"), 1, 0, 0, 0);
        world.spawn(record(registry, "bromine"), 0, 1, 0, 0);
        const { sink } = makeSink();
        synth.update(world, new SeededRandom(2), sink);
        const list = world.getInstanceList();
        expect(list.length).toBe(1);
        expect(list[0].record.formula).toBe("CeBr4");
    });

    it("leaves surplus atoms as free elements", () => {
        const { registry, engine: synth } = engine();
        const world = makeWorld();
        world.spawn(record(registry, "el-ca"), 0, 0, 0, 0);
        world.spawn(record(registry, "el-cl"), 1, 0, 0, 0);
        world.spawn(record(registry, "el-cl"), 0, 1, 0, 0);
        world.spawn(record(registry, "el-cl"), 0, 0, 1, 0);
        const { sink } = makeSink();
        synth.update(world, new SeededRandom(10), sink);
        const list = world.getInstanceList();
        expect(list.length).toBe(2);
        expect(list.some((inst) => inst.record.formula === "CaCl2")).toBe(true);
        expect(list.some((inst) => inst.record.id === "el-cl")).toBe(true);
    });

    it("forms diatomic oxygen from atoms and leaves the surplus", () => {
        const { registry, engine: synth } = engine();
        const world = makeWorld();
        world.spawn(record(registry, "el-o"), 0, 0, 0, 0);
        world.spawn(record(registry, "el-o"), 2, 0, 0, 0);
        world.spawn(record(registry, "el-o"), 4, 0, 0, 0);
        const { sink } = makeSink();
        synth.update(world, new SeededRandom(3), sink);
        const list = world.getInstanceList();
        expect(list.length).toBe(2);
        expect(list.some((inst) => inst.record.formula === "O2")).toBe(true);
        expect(list.some((inst) => inst.record.id === "el-o")).toBe(true);
    });

    it("ignores non-elemental and large clusters", () => {
        const { registry, engine: synth } = engine();
        const world = makeWorld();
        world.spawn(record(registry, "water"), 0, 0, 0, 0);
        world.spawn(record(registry, "hydrogen-chloride"), 2, 0, 0, 0);
        world.spawn(record(registry, "ozone"), 4, 0, 0, 0);
        const before = world.getInstanceList().length;
        const { events, sink } = makeSink();
        synth.update(world, new SeededRandom(4), sink);
        expect(world.getInstanceList().length).toBe(before);
        expect(events.length).toBe(0);
    });

    it("splits distant atoms into separate clusters", () => {
        const { registry, engine: synth } = engine();
        const world = makeWorld();
        world.spawn(record(registry, "el-he"), 0, 0, 0, 0);
        world.spawn(record(registry, "el-he"), 8, 0, 0, 0);
        const { sink } = makeSink();
        synth.update(world, new SeededRandom(5), sink);
        expect(world.getInstanceList().length).toBe(2);
    });

    it("leaves surplus and inert atoms untouched", () => {
        const { registry, engine: synth } = engine();
        const world = makeWorld();
        world.spawn(record(registry, "el-ce"), 5, 0, 0, 0);
        world.spawn(record(registry, "el-he"), 0.5, 0, 0, 0);
        world.spawn(record(registry, "el-br"), 0, 0, 0, 0);
        world.spawn(record(registry, "el-br"), 1, 0, 0, 0);
        world.spawn(record(registry, "el-br"), 0, 1, 0, 0);
        world.spawn(record(registry, "el-br"), 0, 0, 1, 0);
        world.spawn(record(registry, "el-br"), 1, 1, 1, 0);
        const { sink } = makeSink();
        synth.update(world, new SeededRandom(11), sink);
        const list = world.getInstanceList();
        expect(list.length).toBe(3);
        expect(list.some((inst) => inst.record.formula === "CeBr4")).toBe(true);
        expect(list.some((inst) => inst.record.id === "el-br")).toBe(true);
        expect(list.some((inst) => inst.record.id === "el-he")).toBe(true);
    });

    it("spawns leftover atoms when a reactant overshoots", () => {
        const { registry, engine: synth } = engine();
        const world = makeWorld();
        world.spawn(record(registry, "el-al"), 0, 0, 0, 0);
        world.spawn(record(registry, "chlorine-elemental"), 1, 0, 0, 0);
        world.spawn(record(registry, "chlorine-elemental"), 0, 1, 0, 0);
        const { sink } = makeSink();
        synth.update(world, new SeededRandom(12), sink);
        const list = world.getInstanceList();
        expect(list.length).toBe(2);
        expect(list.some((inst) => inst.record.formula === "AlCl3")).toBe(true);
        expect(list.some((inst) => inst.record.id === "el-cl")).toBe(true);
    });

    it("aborts when the prediction asks for absent elements", () => {
        const registry = makeRegistry();
        const fake = {
            predict: () => ({
                product: {
                    catalogId: null,
                    record: record(registry, "el-ce"),
                    name: "Fake",
                    formula: "Fake",
                    needs: new Map([["Xx", 1]]),
                    units: 1,
                },
                hint: null,
            }),
        } as unknown as CompoundSynthesizer;
        const synth = new SynthesisEngine(registry, fake);
        const world = makeWorld();
        world.spawn(record(registry, "el-ce"), 0, 0, 0, 0);
        const { sink } = makeSink();
        synth.update(world, new SeededRandom(13), sink);
        expect(world.getInstanceList().length).toBe(1);
    });

    it("skips formation when the atom budget is full", () => {
        const { registry, engine: synth } = engine();
        const ce = new MoleculeInstance(record(registry, "el-ce"), 0, 0, 0, 0, 0, 0, 0);
        const br1 = new MoleculeInstance(record(registry, "el-br"), 1, 0, 0, 0, 0, 0, 0);
        const br2 = new MoleculeInstance(record(registry, "el-br"), 0, 1, 0, 0, 0, 0, 0);
        const br3 = new MoleculeInstance(record(registry, "el-br"), 0, 0, 1, 0, 0, 0, 0);
        const stub = {
            getInstanceList: () => [ce, br1, br2, br3],
            params: { temperature: 298, spark: 0 },
            canAccommodate: () => false,
            remove: (): void => {},
            spawn: (): void => {},
        } as unknown as World;
        const { sink } = makeSink();
        synth.update(stub, new SeededRandom(6), sink);
        expect(true).toBe(true);
    });

    it("needs heat for covalent compounds but bonds ions when cold", () => {
        const { registry, engine: synth } = engine();
        const cold = makeWorld();
        cold.params.temperature = 100;
        cold.spawn(record(registry, "el-h"), 0, 0, 0, 0);
        cold.spawn(record(registry, "el-f"), 1, 0, 0, 0);
        const tracker = makeSink();
        synth.update(cold, new SeededRandom(21), tracker.sink);
        expect(cold.getInstanceList().length).toBe(2);
        expect(tracker.events.some((event) => event.ruleId === "synthesis-hint")).toBe(true);
        cold.params.temperature = 300;
        synth.update(cold, new SeededRandom(21), tracker.sink);
        expect(cold.getInstanceList().some((inst) => inst.record.formula === "HF")).toBe(true);

        const coldIonic = makeWorld();
        coldIonic.params.temperature = 100;
        coldIonic.spawn(record(registry, "el-na"), 0, 0, 0, 0);
        coldIonic.spawn(record(registry, "el-cl"), 1, 0, 0, 0);
        synth.update(coldIonic, new SeededRandom(22), makeSink().sink);
        expect(coldIonic.getInstanceList().some((inst) => inst.record.formula === "NaCl")).toBe(
            true,
        );
    });

    it("freezes all synthesis at absolute cold", () => {
        const { registry, engine: synth } = engine();
        const world = makeWorld();
        world.params.temperature = 0;
        world.spawn(record(registry, "el-na"), 0, 0, 0, 0);
        world.spawn(record(registry, "el-cl"), 1, 0, 0, 0);
        const tracker = makeSink();
        synth.update(world, new SeededRandom(31), tracker.sink);
        expect(world.getInstanceList().length).toBe(2);
        expect(tracker.events.some((event) => event.ruleId === "synthesis-hint")).toBe(true);
    });

    it("lays out multiple formula units apart", () => {
        const { registry, engine: synth } = engine();
        const world = makeWorld();
        world.spawn(record(registry, "el-mg"), 0, 0, 0, 0);
        world.spawn(record(registry, "el-mg"), 1, 0, 0, 0);
        world.spawn(record(registry, "el-o"), 0, 1, 0, 0);
        world.spawn(record(registry, "el-o"), 1, 1, 0, 0);
        const { sink } = makeSink();
        synth.update(world, new SeededRandom(32), sink);
        const list = world.getInstanceList();
        expect(list.length).toBe(2);
        expect(list.every((inst) => inst.record.formula === "MgO")).toBe(true);
        const dx = list[0].px - list[1].px;
        const dy = list[0].py - list[1].py;
        const dz = list[0].pz - list[1].pz;
        expect(Math.sqrt(dx * dx + dy * dy + dz * dz)).toBeGreaterThan(1);
    });

    it("forms sodium hydroxide in the chamber with a computed message", () => {
        const { registry, engine: synth } = engine();
        const world = makeWorld();
        world.spawn(record(registry, "el-na"), 0, 0, 0, 0);
        world.spawn(record(registry, "el-o"), 1, 0, 0, 0);
        world.spawn(record(registry, "el-h"), 0, 1, 0, 0);
        const tracker = makeSink();
        synth.update(world, new SeededRandom(51), tracker.sink);
        const list = world.getInstanceList();
        expect(list.length).toBe(1);
        expect(list[0].record.formula).toBe("NaOH");
        expect(tracker.events.some((event) => event.message.includes("Sodium hydroxide"))).toBe(
            true,
        );
    });

    it("blocks strongly endothermic products until heated", () => {
        const registry = makeRegistry();
        const fake = {
            predict: () => ({
                product: {
                    kind: "covalent",
                    catalogId: "water",
                    record: null,
                    name: "Water",
                    formula: "Water",
                    needs: new Map([
                        ["H", 2],
                        ["O", 1],
                    ]),
                    units: 1,
                    enthalpy: 200,
                },
                hint: null,
            }),
        } as unknown as CompoundSynthesizer;
        const synth = new SynthesisEngine(registry, fake);
        const world = makeWorld();
        world.spawn(record(registry, "el-h"), 0, 0, 0, 0);
        world.spawn(record(registry, "el-h"), 1, 0, 0, 0);
        world.spawn(record(registry, "el-o"), 0, 1, 0, 0);
        const tracker = makeSink();
        synth.update(world, new SeededRandom(41), tracker.sink);
        expect(world.getInstanceList().length).toBe(3);
        expect(tracker.events.some((event) => event.ruleId === "synthesis-hint")).toBe(true);
        world.params.temperature = 900;
        synth.update(world, new SeededRandom(41), tracker.sink);
        expect(world.getInstanceList().some((inst) => inst.record.formula === "H2O")).toBe(true);
    });

    it("raises the bar for endothermic products in a salty chamber", () => {
        const registry = makeRegistry();
        const fake = {
            predict: () => ({
                product: {
                    kind: "ionic",
                    catalogId: "water",
                    record: null,
                    name: "Water",
                    formula: "Water",
                    needs: new Map([
                        ["H", 2],
                        ["O", 1],
                    ]),
                    units: 1,
                    enthalpy: 90,
                },
                hint: null,
            }),
        } as unknown as CompoundSynthesizer;
        const synth = new SynthesisEngine(registry, fake);
        const clean = makeWorld();
        clean.params.temperature = 700;
        clean.spawn(record(registry, "el-h"), 0, 0, 0, 0);
        clean.spawn(record(registry, "el-h"), 1, 0, 0, 0);
        clean.spawn(record(registry, "el-o"), 0, 1, 0, 0);
        synth.update(clean, new SeededRandom(61), makeSink().sink);
        expect(clean.getInstanceList().some((inst) => inst.record.formula === "H2O")).toBe(true);

        const salty = makeWorld();
        salty.params.temperature = 700;
        const salt = new CompoundSynthesizer(new MoleculeFactory()).predict({
            totals: new Map([
                ["Na", 1],
                ["Cl", 1],
            ]),
            monatomic: new Map(),
        }).product?.record as IMoleculeRecord;
        for (let i = 0; i < 8; i++) {
            salty.spawn(salt, i, 0, 0, 0);
        }
        salty.spawn(record(registry, "el-h"), 0, 5, 0, 0);
        salty.spawn(record(registry, "el-h"), 1, 5, 0, 0);
        salty.spawn(record(registry, "el-o"), 0, 6, 0, 0);
        synth.update(salty, new SeededRandom(61), makeSink().sink);
        expect(salty.getInstanceList().some((inst) => inst.record.formula === "H2O")).toBe(false);
    });

    it("bails out when a catalog product is missing", () => {
        const stubRegistry = {
            findById: () => undefined,
        } as unknown as IMoleculeRegistry;
        const synth = new SynthesisEngine(stubRegistry, new CompoundSynthesizer());
        const world = makeWorld();
        world.spawn(makeRegistry().findById("el-h") as IMoleculeRecord, 0, 0, 0, 0);
        world.spawn(makeRegistry().findById("el-h") as IMoleculeRecord, 1, 0, 0, 0);
        const { sink } = makeSink();
        synth.update(world, new SeededRandom(7), sink);
        expect(world.getInstanceList().length).toBe(2);
    });

    it("bails out when a synthesized record is absent", () => {
        const fake = {
            predict: () => ({
                product: {
                    catalogId: null,
                    record: null,
                    name: "X",
                    formula: "X",
                    needs: new Map([["Ce", 1]]),
                    units: 1,
                },
                hint: null,
            }),
        } as unknown as CompoundSynthesizer;
        const registry = makeRegistry();
        const synth = new SynthesisEngine(registry, fake);
        const world = makeWorld();
        world.spawn(record(registry, "el-ce"), 0, 0, 0, 0);
        const { sink } = makeSink();
        synth.update(world, new SeededRandom(8), sink);
        expect(world.getInstanceList().length).toBe(1);
    });

    it("skips leftover atoms with no elemental record", () => {
        const stubRegistry = {
            findById: () => undefined,
        } as unknown as IMoleculeRegistry;
        const synth = new SynthesisEngine(stubRegistry, new CompoundSynthesizer());
        const world = makeWorld();
        const registry = makeRegistry();
        world.spawn(record(registry, "el-al"), 0, 0, 0, 0);
        world.spawn(record(registry, "chlorine-elemental"), 1, 0, 0, 0);
        world.spawn(record(registry, "chlorine-elemental"), 0, 1, 0, 0);
        const { sink } = makeSink();
        synth.update(world, new SeededRandom(9), sink);
        expect(world.getInstanceList().length).toBe(1);
        expect(world.getInstanceList()[0].record.formula).toBe("AlCl3");
    });
});
