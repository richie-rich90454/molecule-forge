import { For, Show, type JSX } from "solid-js";
import type { IMeasureData, ILabSample } from "../sim/LabRecorder";
import type { IReactionRule } from "../sim/ReactionCatalog";

function humanize(ruleId: string): string {
    const spaced = ruleId.replace(/-/g, " ");
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function signed(value: number): string {
    return (value > 0 ? "+" : "") + Math.round(value) + " kJ";
}

function Sparkline(props: { values: number[] }): JSX.Element {
    const points = (): string => {
        const values = props.values;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const span = max - min === 0 ? 1 : max - min;
        const last = values.length - 1;
        return values
            .map((value, index) => {
                const x = (index / last) * 100;
                const y = 28 - ((value - min) / span) * 26;
                return x.toFixed(2) + "," + y.toFixed(2);
            })
            .join(" ");
    };
    return (
        <svg class="mf-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={points()} />
        </svg>
    );
}

function EnergyDiagram(props: { rule: IReactionRule }): JSX.Element {
    const geometry = (): { line: string; products: number } => {
        const activation = Math.max(1, props.rule.activationEnergy);
        const deltaH = props.rule.deltaH;
        const scale = Math.max(activation, Math.abs(deltaH), 1);
        const reactantsY = 88;
        const topY = 8;
        const span = reactantsY - topY;
        const transitionY = reactantsY - (activation / scale) * span;
        const productsY = reactantsY - (deltaH / scale) * span;
        const line =
            "8," +
            reactantsY +
            " 30," +
            reactantsY +
            " 50," +
            transitionY.toFixed(1) +
            " 70," +
            productsY.toFixed(1) +
            " 92," +
            productsY.toFixed(1);
        return { line, products: productsY };
    };
    return (
        <div class="mf-diagram">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <polyline class="mf-diagram-path" points={geometry().line} />
                <line
                    class="mf-diagram-dash"
                    x1="70"
                    y1={geometry().products}
                    x2="92"
                    y2={geometry().products}
                />
            </svg>
            <div class="mf-diagram-legend">
                <span>Activation energy {Math.round(props.rule.activationEnergy)} kJ/mol</span>
                <span>Net &Delta;H {signed(props.rule.deltaH)}/mol</span>
            </div>
        </div>
    );
}

export function MeasureView(properties: {
    data: IMeasureData;
    onSelectRule: (ruleId: string) => void;
}): JSX.Element {
    const data = () => properties.data;
    const sampleValues = (accessor: (sample: ILabSample) => number): number[] =>
        data().samples.map(accessor);
    const selectedRule = (): IReactionRule | null => {
        const id = data().selectedRuleId;
        return data().rules.find((rule) => rule.id === id) ?? data().rules[0] ?? null;
    };
    return (
        <div class="mf-measure">
            <section class="mf-measure-section">
                <h3>Chamber</h3>
                <div class="mf-measure-grid">
                    <span class="mf-measure-label">Molecules</span>
                    <span class="mf-measure-value">
                        {data().composition.reduce((sum, entry) => sum + entry.count, 0)}
                    </span>
                    <span class="mf-measure-label">Net charge</span>
                    <span class="mf-measure-value">
                        {data().netCharge > 0 ? "+" : ""}
                        {data().netCharge}
                    </span>
                    <span class="mf-measure-label">Net &Delta;H</span>
                    <span class="mf-measure-value">
                        {data().energy === 0
                            ? "0 kJ"
                            : data().energy < 0
                              ? signed(data().energy) + " released"
                              : signed(data().energy) + " absorbed"}
                    </span>
                </div>
            </section>

            <section class="mf-measure-section">
                <h3>Composition</h3>
                <Show
                    when={data().composition.length > 0}
                    fallback={<p class="mf-measure-empty">The chamber is empty.</p>}
                >
                    <ul class="mf-measure-list">
                        <For each={data().composition.slice(0, 12)}>
                            {(entry) => (
                                <li>
                                    <span class="mf-measure-name">{entry.name}</span>
                                    <span class="mf-measure-formula">{entry.formula}</span>
                                    <span class="mf-measure-count">{entry.count}</span>
                                </li>
                            )}
                        </For>
                    </ul>
                </Show>
            </section>

            <section class="mf-measure-section">
                <h3>Atoms</h3>
                <Show
                    when={data().atoms.length > 0}
                    fallback={<p class="mf-measure-empty">No atoms yet.</p>}
                >
                    <div class="mf-measure-chips">
                        <For each={data().atoms}>
                            {(atom) => (
                                <span class="mf-measure-chip">
                                    {atom.element} {atom.count}
                                </span>
                            )}
                        </For>
                    </div>
                </Show>
            </section>

            <section class="mf-measure-section">
                <h3>Trends</h3>
                <Show
                    when={data().samples.length >= 2}
                    fallback={<p class="mf-measure-empty">Recording starts once the sim runs.</p>}
                >
                    <div class="mf-measure-trend">
                        <span class="mf-measure-label">Temperature</span>
                        <Sparkline values={sampleValues((sample) => sample.temperature)} />
                    </div>
                    <div class="mf-measure-trend">
                        <span class="mf-measure-label">Molecules</span>
                        <Sparkline values={sampleValues((sample) => sample.molecules)} />
                    </div>
                    <div class="mf-measure-trend">
                        <span class="mf-measure-label">Energy</span>
                        <Sparkline values={sampleValues((sample) => sample.energy)} />
                    </div>
                </Show>
            </section>

            <section class="mf-measure-section">
                <h3>Reaction rate</h3>
                <Show
                    when={data().rates.length > 0}
                    fallback={<p class="mf-measure-empty">No reactions in the last ten seconds.</p>}
                >
                    <ul class="mf-measure-list">
                        <For each={data().rates.slice(0, 8)}>
                            {(rate) => (
                                <li>
                                    <span class="mf-measure-name">{humanize(rate.ruleId)}</span>
                                    <span class="mf-measure-count">
                                        {rate.perSecond.toFixed(2)}/s
                                    </span>
                                </li>
                            )}
                        </For>
                    </ul>
                </Show>
            </section>

            <section class="mf-measure-section">
                <h3>Energy diagram</h3>
                <Show
                    when={selectedRule() !== null}
                    fallback={<p class="mf-measure-empty">No reaction rules loaded.</p>}
                >
                    <select
                        class="mf-measure-select"
                        value={data().selectedRuleId}
                        onChange={(event) => properties.onSelectRule(event.currentTarget.value)}
                    >
                        <For each={data().rules}>
                            {(rule) => <option value={rule.id}>{humanize(rule.id)}</option>}
                        </For>
                    </select>
                    <Show when={selectedRule()}>{(rule) => <EnergyDiagram rule={rule()} />}</Show>
                </Show>
            </section>

            <section class="mf-measure-section">
                <h3>Cell potentials</h3>
                <Show
                    when={data().potentials.length > 0}
                    fallback={
                        <p class="mf-measure-empty">Add dissolved metals to compare couples.</p>
                    }
                >
                    <ul class="mf-measure-list">
                        <For each={data().potentials.slice(0, 6)}>
                            {(cell) => (
                                <li>
                                    <span class="mf-measure-name">
                                        {cell.oxidized} &rarr; {cell.reduced}
                                    </span>
                                    <span class="mf-measure-count">{cell.volts.toFixed(2)} V</span>
                                </li>
                            )}
                        </For>
                    </ul>
                </Show>
            </section>
        </div>
    );
}
