import type { CompactBond } from "./MoleculeRecord";

export interface ISmilesParseResult {
    readonly heavy: string[];
    readonly bonds: CompactBond[];
    readonly charges: Array<readonly [number, number]>;
    readonly explicitH: Array<readonly [number, number]>;
}

interface IParserState {
    text: string;
    pos: number;
}

export class SmilesParser {
    private readonly states: IParserState[];

    public constructor() {
        this.states = [];
    }

    public parse(smiles: string): ISmilesParseResult {
        const state: IParserState = { text: smiles, pos: 0 };
        this.states.push(state);
        try {
            return this.parseInternal(state);
        } finally {
            this.states.pop();
        }
    }

    private parseInternal(state: IParserState): ISmilesParseResult {
        const heavy: string[] = [];
        const bonds: CompactBond[] = [];
        const charges: Array<readonly [number, number]> = [];
        const explicitH: Array<readonly [number, number]> = [];
        const aromaticFlags: boolean[] = [];
        const ringBonds = new Map<
            string,
            { atom: number; order: number; aromatic: boolean; stereo: string | null }
        >();
        let current = -1;
        let pendingOrder = 1;
        let pendingStereo: string | null = null;
        const branchStack: number[] = [];

        const closeRing = (key: string): void => {
            const existing = ringBonds.get(key);
            if (existing === undefined) {
                ringBonds.set(key, {
                    atom: current,
                    order: pendingOrder,
                    aromatic: aromaticFlags[current] === true,
                    stereo: pendingStereo,
                });
            } else {
                const bothAromatic = existing.aromatic && aromaticFlags[current] === true;
                const order = bothAromatic ? 4 : Math.max(existing.order, pendingOrder);
                const stereo = existing.stereo ?? pendingStereo;
                if (stereo === null) {
                    bonds.push([existing.atom, current, order]);
                } else {
                    bonds.push([existing.atom, current, order, stereo]);
                }
                ringBonds.delete(key);
            }
            pendingOrder = 1;
            pendingStereo = null;
        };

        const addAtom = (
            el: string,
            aromatic: boolean,
            charge: number,
            hCount: number | null,
        ): number => {
            const index = heavy.length;
            heavy.push(el);
            aromaticFlags.push(aromatic);
            if (charge !== 0) {
                charges.push([index, charge]);
            }
            if (hCount !== null) {
                explicitH.push([index, hCount]);
            }
            if (current >= 0) {
                const bothAromatic = aromatic && aromaticFlags[current] === true;
                const order = bothAromatic ? 4 : pendingOrder;
                if (pendingStereo === null) {
                    bonds.push([current, index, order]);
                } else {
                    bonds.push([current, index, order, pendingStereo]);
                }
            }
            pendingOrder = 1;
            pendingStereo = null;
            current = index;
            return index;
        };

        while (state.pos < state.text.length) {
            const ch = state.text[state.pos];
            if (ch === "(") {
                branchStack.push(current);
                state.pos++;
            } else if (ch === ")") {
                const top = branchStack.pop();
                current = top === undefined ? -1 : top;
                state.pos++;
            } else if (ch === "[") {
                const parsed = this.parseBracket(state);
                addAtom(parsed.el, parsed.aromatic, parsed.charge, parsed.hCount);
            } else if (
                ch === "-" ||
                ch === "=" ||
                ch === "#" ||
                ch === ":" ||
                ch === "/" ||
                ch === "\\"
            ) {
                if (ch === "=") {
                    pendingOrder = 2;
                } else if (ch === "#") {
                    pendingOrder = 3;
                } else if (ch === ":") {
                    pendingOrder = 4;
                } else if (ch === "/") {
                    pendingStereo = "E";
                } else if (ch === "\\") {
                    pendingStereo = "Z";
                }
                state.pos++;
            } else if (ch >= "0" && ch <= "9") {
                closeRing(ch);
                state.pos++;
            } else if (ch === "%") {
                const key = state.text.substring(state.pos + 1, state.pos + 3);
                state.pos += 3;
                closeRing(key);
            } else if (ch === "." || ch === "+" || ch === "-") {
                if (ch === ".") {
                    current = -1;
                }
                state.pos++;
            } else {
                const two = state.text.substring(state.pos, state.pos + 2);
                if (
                    two === "Cl" ||
                    two === "Br" ||
                    two === "Si" ||
                    two === "Se" ||
                    two === "Na" ||
                    two === "Li" ||
                    two === "Mg" ||
                    two === "Al" ||
                    two === "Ca" ||
                    two === "Fe" ||
                    two === "Zn" ||
                    two === "Cu" ||
                    two === "Pt" ||
                    two === "As"
                ) {
                    addAtom(two, false, 0, null);
                    state.pos += 2;
                } else if (
                    (ch >= "A" && ch <= "Z") ||
                    ch === "c" ||
                    ch === "n" ||
                    ch === "o" ||
                    ch === "s" ||
                    ch === "p"
                ) {
                    const aromatic = ch === ch.toLowerCase();
                    const el = aromatic ? ch.toUpperCase() : ch;
                    addAtom(el, aromatic, 0, null);
                    state.pos++;
                } else {
                    state.pos++;
                }
            }
        }
        void pendingStereo;
        const fixedBonds: CompactBond[] = bonds.map((b) =>
            b.length > 3 ? [b[0], b[1], b[2], b[3] as string] : [b[0], b[1], b[2]],
        );
        return { heavy, bonds: fixedBonds, charges, explicitH };
    }

    private parseBracket(state: IParserState): {
        el: string;
        aromatic: boolean;
        charge: number;
        hCount: number | null;
    } {
        const end = state.text.indexOf("]", state.pos);
        const inner = end < 0 ? "" : state.text.substring(state.pos + 1, end);
        state.pos = end < 0 ? state.text.length : end + 1;
        let charge = 0;
        const plusMatch = inner.match(/(\+{1,3}|\+\d+|-\d*|-{1,3})/);
        if (plusMatch !== null) {
            const token = plusMatch[1];
            if (token[0] === "+") {
                charge =
                    token.length === 1
                        ? 1
                        : token.length === 2 && token[1] === "+"
                          ? 2
                          : parseInt(token.substring(1), 10) || 1;
            } else {
                charge =
                    token === "-"
                        ? -1
                        : token === "--"
                          ? -2
                          : -(parseInt(token.substring(1), 10) || 1);
            }
        }
        let hCount: number | null = null;
        const hMatch = inner.match(/H(\d?)/);
        if (hMatch !== null) {
            hCount = hMatch[1] === "" ? 1 : parseInt(hMatch[1], 10);
        }
        const elMatch = inner.match(/^([A-Z][a-z]?|[a-z])/);
        let el = "C";
        let aromatic = false;
        if (elMatch !== null) {
            const raw = elMatch[1];
            aromatic = raw === raw.toLowerCase();
            el = aromatic ? raw.toUpperCase() : raw;
        }
        if (el === "H" || el === "*") {
            el = "C";
        }
        return { el, aromatic, charge, hCount };
    }
}
