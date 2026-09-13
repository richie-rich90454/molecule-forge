import type { IMoleculeRecord } from "./MoleculeRecord";

export interface IElementTally {
    readonly element: string;
    readonly count: number;
}

export interface IFunctionalGroup {
    readonly label: string;
    readonly count: number;
}

export interface IMoleculeExplanation {
    readonly id: string;
    readonly name: string;
    readonly formula: string;
    readonly mass: number;
    readonly category: string;
    readonly atomCount: number;
    readonly atomCounts: ReadonlyArray<IElementTally>;
    readonly netCharge: number;
    readonly donors: number;
    readonly acceptors: number;
    readonly rotatable: number;
    readonly tpsa: number;
    readonly logP: number;
    readonly aromaticRings: number;
    readonly groups: ReadonlyArray<IFunctionalGroup>;
    readonly hazard: boolean;
    readonly summary: string;
}

export class MoleculeExplainer {
    public static explain(record: IMoleculeRecord): IMoleculeExplanation {
        const neighbors: Array<Array<{ to: number; order: number }>> = record.atoms.map(() => []);
        for (const bond of record.bonds) {
            neighbors[bond.a].push({ to: bond.b, order: bond.order });
            neighbors[bond.b].push({ to: bond.a, order: bond.order });
        }
        const isHydrogen = (index: number): boolean => record.atoms[index].el === "H";
        const hasNeighbor = (index: number, element: string): boolean =>
            neighbors[index].some((edge) => record.atoms[edge.to].el === element);
        const hasNeighborWithOrder = (index: number, element: string, order: number): boolean =>
            neighbors[index].some(
                (edge) => record.atoms[edge.to].el === element && edge.order === order,
            );

        let hydroxyl = 0;
        let carbonyl = 0;
        let carboxyl = 0;
        let amine = 0;
        let nitrile = 0;
        let aromaticAtoms = 0;
        for (let i = 0; i < record.atoms.length; i++) {
            const atom = record.atoms[i];
            if (atom.aromatic) {
                aromaticAtoms++;
            }
            if (atom.el === "O" && hasNeighbor(i, "H")) {
                hydroxyl++;
            }
            if (atom.el === "N" && hasNeighbor(i, "H")) {
                amine++;
            }
            if (atom.el === "C" && hasNeighborWithOrder(i, "N", 3)) {
                nitrile++;
            }
            if (atom.el === "C" && hasNeighborWithOrder(i, "O", 2)) {
                const acidOxygen = neighbors[i].some(
                    (edge) =>
                        record.atoms[edge.to].el === "O" &&
                        edge.order === 1 &&
                        neighbors[edge.to].some((inner) => isHydrogen(inner.to)),
                );
                if (acidOxygen) {
                    carboxyl++;
                } else {
                    carbonyl++;
                }
            }
        }
        const groups: IFunctionalGroup[] = [];
        if (hydroxyl > 0) {
            groups.push({ label: "hydroxyl (-OH)", count: hydroxyl });
        }
        if (carbonyl > 0) {
            groups.push({ label: "carbonyl (C=O)", count: carbonyl });
        }
        if (carboxyl > 0) {
            groups.push({ label: "carboxyl (-COOH)", count: carboxyl });
        }
        if (amine > 0) {
            groups.push({ label: "amine (N-H)", count: amine });
        }
        if (nitrile > 0) {
            groups.push({ label: "nitrile (C≡N)", count: nitrile });
        }

        const tallies = new Map<string, number>();
        for (const atom of record.atoms) {
            tallies.set(atom.el, (tallies.get(atom.el) ?? 0) + 1);
        }
        const atomCounts: IElementTally[] = [];
        for (const [element, count] of tallies) {
            atomCounts.push({ element, count });
        }
        atomCounts.sort((a, b) => b.count - a.count || a.element.localeCompare(b.element));
        const netCharge = record.atoms.reduce((sum, atom) => sum + atom.charge, 0);
        return {
            id: record.id,
            name: record.name,
            formula: record.formula,
            mass: record.mass,
            category: record.category,
            atomCount: record.atoms.length,
            atomCounts,
            netCharge,
            donors: record.properties.hBondDonors,
            acceptors: record.properties.hBondAcceptors,
            rotatable: record.properties.rotatable,
            tpsa: record.properties.tpsa,
            logP: record.properties.logP,
            aromaticRings: Math.round(aromaticAtoms / 6),
            groups,
            hazard: record.warn,
            summary: MoleculeExplainer.summarize(record, netCharge),
        };
    }

    private static summarize(record: IMoleculeRecord, netCharge: number): string {
        const tpsa = record.properties.tpsa;
        const polarity = tpsa >= 60 ? "highly polar" : tpsa >= 20 ? "polar" : "largely nonpolar";
        const size =
            record.atoms.length <= 8
                ? "small"
                : record.atoms.length <= 25
                  ? "medium-sized"
                  : "large";
        const charge =
            netCharge === 0
                ? "neutral"
                : netCharge > 0
                  ? "positively charged (+" + netCharge + ")"
                  : "negatively charged (" + netCharge + ")";
        const donors = record.properties.hBondDonors;
        const acceptors = record.properties.hBondAcceptors;
        const bonding =
            donors > 0 || acceptors > 0
                ? " It can hydrogen bond: " +
                  donors +
                  " donor" +
                  (donors === 1 ? "" : "s") +
                  ", " +
                  acceptors +
                  " acceptor" +
                  (acceptors === 1 ? "" : "s") +
                  "."
                : " It cannot donate or accept hydrogen bonds.";
        return (
            record.name +
            " is a " +
            size +
            ", " +
            charge +
            " " +
            record.category +
            " molecule. It is " +
            polarity +
            " (TPSA " +
            tpsa +
            ", logP " +
            record.properties.logP +
            ")." +
            bonding
        );
    }
}
