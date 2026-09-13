import { describe, expect, it } from "vitest";
import { SolventModel } from "../src/chem/SolventModel";
import { Thermochemistry } from "../src/chem/Thermochemistry";

describe("SolventModel", () => {
    it("computes ionic strength from formal charges and volume", () => {
        expect(SolventModel.ionicStrength([], 1000)).toBe(0);
        expect(SolventModel.ionicStrength([1, -1], 1000)).toBeCloseTo(1.6605, 3);
        expect(SolventModel.ionicStrength([2, 2], 1000)).toBeCloseTo(6.642, 3);
        expect(SolventModel.ionicStrength([1], 1)).toBeCloseTo(830.27, 1);
    });

    it("derives activity coefficients from those strengths", () => {
        expect(SolventModel.activity(1, [], 1000)).toBe(1);
        const concentrated = SolventModel.activity(1, [1, -1, 1, -1, 1, -1], 100);
        expect(concentrated).toBeLessThan(1);
        expect(concentrated).toBeGreaterThan(0.2);
    });
});

describe("Thermochemistry", () => {
    it("looks up atomization enthalpies", () => {
        expect(Thermochemistry.atomization("H")).toBe(218);
        expect(Thermochemistry.atomization("O")).toBe(249);
        expect(Thermochemistry.atomization("Xx")).toBeNull();
    });

    it("resolves bond energies in both directions and by order", () => {
        expect(Thermochemistry.bondEnergy("H", "H", 1)).toBe(436);
        expect(Thermochemistry.bondEnergy("O", "H", 1)).toBe(463);
        expect(Thermochemistry.bondEnergy("H", "O", 1)).toBe(463);
        expect(Thermochemistry.bondEnergy("C", "O", 2)).toBe(745);
        expect(Thermochemistry.bondEnergy("N", "N", 3)).toBe(945);
        expect(Thermochemistry.bondEnergy("C", "C", 4)).toBe(347);
        expect(Thermochemistry.bondEnergy("Xx", "Yy", 1)).toBeNull();
    });

    it("sums covalent bond enthalpies and rejects unknown bonds", () => {
        expect(Thermochemistry.covalentEnthalpy([{ a: "H", b: "H", order: 1 }])).toBe(-436);
        expect(
            Thermochemistry.covalentEnthalpy([
                { a: "H", b: "O", order: 1 },
                { a: "O", b: "H", order: 1 },
            ]),
        ).toBe(-926);
        expect(Thermochemistry.covalentEnthalpy([{ a: "Xx", b: "Yy", order: 1 }])).toBeNull();
    });

    it("reads molecular formation enthalpies", () => {
        expect(Thermochemistry.moleculeEnthalpy("water")).toBeCloseTo(-241.8, 5);
        expect(Thermochemistry.moleculeEnthalpy("oxygen-elemental")).toBe(0);
        expect(Thermochemistry.moleculeEnthalpy("nope")).toBeNull();
    });

    it("computes reaction enthalpies and guards missing data", () => {
        expect(
            Thermochemistry.reactionEnthalpy(
                new Map([
                    ["H", 2],
                    ["O", 1],
                ]),
                -241.8,
                1,
            ),
        ).toBeCloseTo(-926.8, 4);
        expect(Thermochemistry.reactionEnthalpy(new Map([["H", 2]]), null, 1)).toBeNull();
        expect(Thermochemistry.reactionEnthalpy(new Map([["Xx", 1]]), -10, 1)).toBeNull();
        expect(
            Thermochemistry.reactionEnthalpy(
                new Map([
                    ["H", 4],
                    ["O", 2],
                ]),
                -241.8,
                2,
            ),
        ).toBeCloseTo(-1853.6, 4);
    });

    it("computes gaseous ion enthalpies from atomization and ionization", () => {
        expect(Thermochemistry.gaseousCationEnthalpy("Na", 1)).toBe(603);
        expect(Thermochemistry.gaseousCationEnthalpy("Mg", 2)).toBe(2337);
        expect(Thermochemistry.gaseousCationEnthalpy("Na", 0)).toBeNull();
        expect(Thermochemistry.gaseousCationEnthalpy("Na", 3)).toBeNull();
        expect(Thermochemistry.gaseousCationEnthalpy("Xx", 1)).toBeNull();
        expect(Thermochemistry.gaseousAnionEnthalpy("Cl", 1)).toBe(121 - 349);
        expect(Thermochemistry.gaseousAnionEnthalpy("O", 2)).toBe(249 - 141 + 780);
        expect(Thermochemistry.gaseousAnionEnthalpy("O", 3)).toBeNull();
        expect(Thermochemistry.gaseousAnionEnthalpy("Xx", 1)).toBeNull();
        expect(Thermochemistry.gaseousAnionEnthalpy("Cl", 2)).toBeNull();
    });

    it("resolves ionic radii by charge", () => {
        expect(Thermochemistry.ionicRadiusOf("Na", 1)).toBe(1.02);
        expect(Thermochemistry.ionicRadiusOf("Mg", 2)).toBe(0.72);
        expect(Thermochemistry.ionicRadiusOf("Al", 3)).toBe(0.535);
        expect(Thermochemistry.ionicRadiusOf("Cl", -1)).toBe(1.81);
        expect(Thermochemistry.ionicRadiusOf("O", -2)).toBe(1.4);
        expect(Thermochemistry.ionicRadiusOf("Xx", 1)).toBeNull();
    });

    it("computes Kapustinskii lattice energy", () => {
        const energy = Thermochemistry.latticeEnergy(1, 1, 1.02, 1.81);
        expect(energy).toBeGreaterThan(700);
        expect(energy).toBeLessThan(900);
    });

    it("computes binary ionic formation enthalpies", () => {
        const nacl = Thermochemistry.ionicFormationEnthalpy("Na", 1, "Cl", 1);
        expect(nacl).not.toBeNull();
        expect(nacl as number).toBeLessThan(-300);
        expect(nacl as number).toBeGreaterThan(-500);
        expect(Thermochemistry.ionicFormationEnthalpy("Xx", 1, "Cl", 1)).toBeNull();
        expect(Thermochemistry.ionicFormationEnthalpy("Na", 1, "Xx", 1)).toBeNull();
        expect(Thermochemistry.ionicFormationEnthalpy("Na", 1, "Cl", 3)).toBeNull();
    });

    it("computes Debye-Huckel activity coefficients", () => {
        expect(Thermochemistry.debyeHuckelActivity(1, 0.001)).toBeLessThan(1);
        expect(Thermochemistry.debyeHuckelActivity(1, 0.001)).toBeGreaterThan(0.95);
        expect(Thermochemistry.debyeHuckelActivity(0, 1)).toBe(1);
    });

    it("looks up reduction couples and cell potentials", () => {
        expect(Thermochemistry.reductionCouple("Zn", 2)?.id).toBe("Zn2+/Zn");
        expect(Thermochemistry.reductionCouple("Zn", 1)).toBeNull();
        expect(Thermochemistry.hasCouple("Zn")).toBe(true);
        expect(Thermochemistry.hasCouple("Ce")).toBe(false);
        expect(Thermochemistry.couples().length).toBeGreaterThan(20);
        const cell = Thermochemistry.cellPotential("Zn", "Cu");
        expect(cell).not.toBeNull();
        expect(cell as number).toBeGreaterThan(1);
        expect(Thermochemistry.cellPotential("Xx", "Cu")).toBeNull();
        expect(Thermochemistry.cellPotential("Zn", "Xx")).toBeNull();
    });
});
