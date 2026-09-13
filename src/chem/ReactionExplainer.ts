import type { IMoleculeRegistry } from "./MoleculeRecord";
import type { IMoleculeExplanation } from "./MoleculeExplainer";
import type { IReactionEvent } from "../sim/ReactionEngine";
import type { IReactionRule } from "../sim/ReactionCatalog";

interface IFormulaSpec {
    readonly moleculeId: string;
    readonly count: number;
}

export interface IReactionExplanation {
    readonly ruleId: string;
    readonly name: string;
    readonly equation: string;
    readonly deltaH: number | null;
    readonly activationEnergy: number | null;
    readonly rateLaw: string;
    readonly reference: string;
    readonly conditions: string;
    readonly message: string;
}

export interface IExplainData {
    readonly reaction: IReactionExplanation | null;
    readonly molecule: IMoleculeExplanation | null;
}

function humanize(ruleId: string): string {
    const spaced = ruleId.replace(/-/g, " ");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export class ReactionExplainer {
    public static explain(rule: IReactionRule, registry: IMoleculeRegistry): IReactionExplanation {
        return {
            ruleId: rule.id,
            name: humanize(rule.id),
            equation: ReactionExplainer.equation(rule, registry),
            deltaH: rule.deltaH,
            activationEnergy: rule.activationEnergy,
            rateLaw: rule.rateLaw,
            reference: rule.reference,
            conditions: ReactionExplainer.conditions(rule),
            message: rule.message,
        };
    }

    public static fromEvent(
        event: IReactionEvent,
        rules: ReadonlyArray<IReactionRule>,
        registry: IMoleculeRegistry,
    ): IReactionExplanation {
        const rule = rules.find((candidate) => candidate.id === event.ruleId);
        if (rule !== undefined) {
            return ReactionExplainer.explain(rule, registry);
        }
        return {
            ruleId: event.ruleId,
            name: humanize(event.ruleId),
            equation: "",
            deltaH: event.deltaH ?? null,
            activationEnergy: null,
            rateLaw: "",
            reference: "",
            conditions: "Emergent reaction inside the chamber",
            message: event.message,
        };
    }

    private static equation(rule: IReactionRule, registry: IMoleculeRegistry): string {
        const render = (specs: ReadonlyArray<IFormulaSpec>): string =>
            specs
                .map((spec) => {
                    const record = registry.findById(spec.moleculeId);
                    const formula = record === undefined ? spec.moleculeId : record.formula;
                    return (spec.count > 1 ? spec.count + " " : "") + formula;
                })
                .join(" + ");
        if (rule.products.length === 0) {
            return render(rule.reactants);
        }
        return render(rule.reactants) + " -> " + render(rule.products);
    }

    private static conditions(rule: IReactionRule): string {
        const parts: string[] = [];
        if (rule.conditions.tempMin !== null) {
            parts.push("at least " + rule.conditions.tempMin + " K");
        }
        if (rule.conditions.tempMax !== null) {
            parts.push("at most " + rule.conditions.tempMax + " K");
        }
        if (rule.conditions.needsSpark) {
            parts.push("needs a spark");
        }
        if (rule.conditions.needsCatalyst) {
            parts.push("needs a catalyst");
        }
        if (rule.conditions.phMin !== null) {
            parts.push("pH at least " + rule.conditions.phMin);
        }
        if (rule.conditions.phMax !== null) {
            parts.push("pH at most " + rule.conditions.phMax);
        }
        if (parts.length === 0) {
            return "No special conditions";
        }
        return parts.join(", ");
    }
}
