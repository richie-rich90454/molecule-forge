import type { IMoleculeRegistry, MoleculeCategory } from "../chem/MoleculeRecord";
import { SeededRandom } from "./SeededRandom";
import type { World } from "./World";
import type { IReactionRule } from "./ReactionCatalog";
import type { MoleculeInstance } from "./MoleculeInstance";

export interface IReactionEvent {
    readonly ruleId: string;
    readonly message: string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly flash: string;
    readonly particles: string;
}

export interface IReactionSink {
    publish(event: IReactionEvent): void;
}

export class ReactionEngine {
    private readonly rules: ReadonlyArray<IReactionRule>;
    private readonly registry: IMoleculeRegistry;
    private readonly matchRadius: number;

    public constructor(rules: ReadonlyArray<IReactionRule>, registry: IMoleculeRegistry) {
        this.rules = rules;
        this.registry = registry;
        this.matchRadius = 7;
    }

    public getRules(): ReadonlyArray<IReactionRule> {
        return this.rules;
    }

    public update(world: World, rng: SeededRandom, sink: IReactionSink): void {
        for (const rule of this.rules) {
            this.tryRule(rule, world, rng, sink);
        }
    }

    private tryRule(
        rule: IReactionRule,
        world: World,
        rng: SeededRandom,
        sink: IReactionSink,
    ): void {
        if (!this.conditionsMet(rule, world)) {
            return;
        }
        const primary = rule.reactants[0];
        const candidates = this.findCandidates(
            world,
            primary.moleculeId,
            primary.category,
            primary.tag,
            4,
        );
        if (candidates.length === 0) {
            return;
        }
        const anchor = candidates[Math.floor(rng.next() * candidates.length)];
        const consumed: MoleculeInstance[] = [anchor];
        const usedIds = new Set<number>([anchor.id]);
        for (let r = 1; r < rule.reactants.length; r++) {
            const matcher = rule.reactants[r];
            const partners = this.findCandidates(
                world,
                matcher.moleculeId,
                matcher.category,
                matcher.tag,
                24,
            );
            let need = matcher.count;
            for (const partner of partners) {
                if (usedIds.has(partner.id)) {
                    continue;
                }
                const dx = partner.px - anchor.px;
                const dy = partner.py - anchor.py;
                const dz = partner.pz - anchor.pz;
                if (dx * dx + dy * dy + dz * dz > this.matchRadius * this.matchRadius) {
                    continue;
                }
                consumed.push(partner);
                usedIds.add(partner.id);
                need--;
                if (need <= 0) {
                    break;
                }
            }
            if (need > 0) {
                return;
            }
        }
        if (primary.count > 1) {
            let need = primary.count - 1;
            const partners = this.findCandidates(
                world,
                primary.moleculeId,
                primary.category,
                primary.tag,
                24,
            );
            for (const partner of partners) {
                if (usedIds.has(partner.id)) {
                    continue;
                }
                const dx = partner.px - anchor.px;
                const dy = partner.py - anchor.py;
                const dz = partner.pz - anchor.pz;
                if (dx * dx + dy * dy + dz * dz > this.matchRadius * this.matchRadius) {
                    continue;
                }
                consumed.push(partner);
                usedIds.add(partner.id);
                need--;
                if (need <= 0) {
                    break;
                }
            }
            if (need > 0) {
                return;
            }
        }
        const temperature = world.params.temperature;
        const rate = Math.exp(-rule.activationEnergy / (0.008314 * Math.max(50, temperature)));
        const boost = 1 + world.params.catalyst * 4 + world.params.spark * 9;
        if (rng.next() > Math.min(0.5, rate * boost * 8)) {
            return;
        }
        let cx = 0;
        let cy = 0;
        let cz = 0;
        for (const inst of consumed) {
            cx += inst.px;
            cy += inst.py;
            cz += inst.pz;
            world.remove(inst.id);
        }
        cx /= consumed.length;
        cy /= consumed.length;
        cz /= consumed.length;
        for (const product of rule.products) {
            const record = this.registry.findById(product.moleculeId);
            if (record === undefined) {
                continue;
            }
            for (let i = 0; i < product.count; i++) {
                const jx = (rng.next() - 0.5) * 4;
                const jy = (rng.next() - 0.5) * 4;
                const jz = (rng.next() - 0.5) * 4;
                world.spawn(record, cx + jx, cy + jy, cz + jz, 3);
            }
        }
        sink.publish({
            ruleId: rule.id,
            message: rule.message,
            x: cx,
            y: cy,
            z: cz,
            flash: rule.visual.flash,
            particles: rule.visual.particles,
        });
    }

    private conditionsMet(rule: IReactionRule, world: World): boolean {
        const conditions = rule.conditions;
        const params = world.params;
        if (conditions.tempMin !== null && params.temperature < conditions.tempMin) {
            return false;
        }
        if (conditions.tempMax !== null && params.temperature > conditions.tempMax) {
            return false;
        }
        if (conditions.needsSpark && params.spark <= 0.05 && params.temperature < 600) {
            return false;
        }
        if (conditions.needsCatalyst && params.catalyst <= 0.05) {
            return false;
        }
        if (conditions.phMin !== null && params.ph < conditions.phMin) {
            return false;
        }
        if (conditions.phMax !== null && params.ph > conditions.phMax) {
            return false;
        }
        return true;
    }

    private findCandidates(
        world: World,
        moleculeId: string,
        category: MoleculeCategory | null,
        tag: string | null,
        limit: number,
    ): MoleculeInstance[] {
        const found = world.findInstances(moleculeId, category, limit * 2);
        if (tag === null) {
            return found.slice(0, limit);
        }
        return found.filter((inst) => inst.record.tags.includes(tag)).slice(0, limit);
    }
}
