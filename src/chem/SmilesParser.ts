import type { CompactBond } from "./MoleculeRecord";
import { ElementRegistry } from "./ElementRegistry";

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

type Direction = "/" | "\\";

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
        let pendingMarker: Direction | null = null;
        let lastSingleMarker: Direction | null = null;
        let awaitingDoubleIndex = -1;
        let awaitingDoubleLeft: Direction | null = null;
        const branchStack: number[] = [];

        const stereoLabel = (marker: Direction): string => (marker === "/" ? "E" : "Z");
        const combineStereo = (left: Direction, right: Direction): string =>
            left === right ? "E" : "Z";
        const resetComponent = (): void => {
            current = -1;
            lastSingleMarker = null;
            awaitingDoubleIndex = -1;
            awaitingDoubleLeft = null;
        };

        const closeRing = (key: string): void => {
            const existing = ringBonds.get(key);
            if (existing === undefined) {
                ringBonds.set(key, {
                    atom: current,
                    order: pendingOrder,
                    aromatic: aromaticFlags[current] === true,
                    stereo: pendingMarker === null ? null : stereoLabel(pendingMarker),
                });
            } else {
                const bothAromatic = existing.aromatic && aromaticFlags[current] === true;
                const order = bothAromatic ? 4 : Math.max(existing.order, pendingOrder);
                const stereo =
                    existing.stereo ?? (pendingMarker === null ? null : stereoLabel(pendingMarker));
                if (stereo === null) {
                    bonds.push([existing.atom, current, order]);
                } else {
                    bonds.push([existing.atom, current, order, stereo]);
                }
                ringBonds.delete(key);
            }
            pendingOrder = 1;
            pendingMarker = null;
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
                const marker = pendingMarker;
                if (marker === null) {
                    bonds.push([current, index, order]);
                    if (order === 2) {
                        awaitingDoubleIndex = bonds.length - 1;
                        awaitingDoubleLeft = lastSingleMarker;
                    } else if (order === 1) {
                        lastSingleMarker = null;
                        awaitingDoubleIndex = -1;
                        awaitingDoubleLeft = null;
                    }
                } else if (order === 2) {
                    bonds.push([current, index, order, stereoLabel(marker)]);
                } else {
                    if (awaitingDoubleIndex >= 0 && awaitingDoubleLeft !== null) {
                        const db = bonds[awaitingDoubleIndex];
                        bonds[awaitingDoubleIndex] = [
                            db[0],
                            db[1],
                            2,
                            combineStereo(awaitingDoubleLeft, marker),
                        ];
                        awaitingDoubleIndex = -1;
                        awaitingDoubleLeft = null;
                    }
                    bonds.push([current, index, order, stereoLabel(marker)]);
                    lastSingleMarker = marker;
                }
            }
            pendingOrder = 1;
            pendingMarker = null;
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
            } else if (ch === "-") {
                pendingOrder = 1;
                state.pos++;
            } else if (ch === "=") {
                pendingOrder = 2;
                state.pos++;
            } else if (ch === "#") {
                pendingOrder = 3;
                state.pos++;
            } else if (ch === ":") {
                pendingOrder = 4;
                state.pos++;
            } else if (ch === "/") {
                pendingMarker = "/";
                state.pos++;
            } else if (ch === "\\") {
                pendingMarker = "\\";
                state.pos++;
            } else if (ch >= "0" && ch <= "9") {
                closeRing(ch);
                state.pos++;
            } else if (ch === "%") {
                const key = state.text.substring(state.pos + 1, state.pos + 3);
                state.pos += 3;
                closeRing(key);
            } else if (ch === "." || ch === "+") {
                resetComponent();
                state.pos++;
            } else {
                const two = state.text.substring(state.pos, state.pos + 2);
                const lowerTwo = two.toLowerCase();
                if (lowerTwo === "se" || lowerTwo === "as" || lowerTwo === "te") {
                    addAtom(two[0].toUpperCase() + two[1], true, 0, null);
                    state.pos += 2;
                } else if (
                    two.length === 2 &&
                    ch >= "A" &&
                    ch <= "Z" &&
                    two[1] >= "a" &&
                    two[1] <= "z" &&
                    ElementRegistry.has(two)
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
        return { heavy, bonds, charges, explicitH };
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
        const chargeMatch = inner.match(/(\+\d+|\+{1,3}|-\d+|-{1,3})/);
        if (chargeMatch !== null) {
            const token = chargeMatch[1];
            if (token[0] === "+") {
                charge =
                    token.length === 1
                        ? 1
                        : token[1] === "+"
                          ? token.length
                          : parseInt(token.substring(1), 10) || 1;
            } else {
                charge =
                    token.length === 1
                        ? -1
                        : token[1] === "-"
                          ? -token.length
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
        if (el === "H") {
            hCount = null;
        }
        return { el, aromatic, charge, hCount };
    }
}
