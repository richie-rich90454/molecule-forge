import { For, Show, createSignal, type JSX } from "solid-js";
import {
    ElementReference,
    type IElementReference,
    type IReferenceData,
} from "../chem/ElementReference";

export type { IReferenceData } from "../chem/ElementReference";

function BarChart(props: {
    values: ReadonlyArray<{ label: string; value: number }>;
    format: (value: number) => string;
}): JSX.Element {
    const max = (): number => Math.max(1, ...props.values.map((entry) => entry.value));
    return (
        <div class="mf-bars">
            <For each={props.values}>
                {(entry) => (
                    <div class="mf-bar-row">
                        <span class="mf-bar-label">{entry.label}</span>
                        <span class="mf-bar-track">
                            <span
                                class="mf-bar-fill"
                                style={{ width: (entry.value / max()) * 100 + "%" }}
                            />
                        </span>
                        <span class="mf-bar-value">{props.format(entry.value)}</span>
                    </div>
                )}
            </For>
        </div>
    );
}

export function ReferenceView(properties: { data: IReferenceData }): JSX.Element {
    const data = () => properties.data;
    const metals = (): IElementReference[] =>
        data().elements.filter((element) => element.cations.length > 0);
    const anionFormers = (): IElementReference[] =>
        data().elements.filter((element) => element.anion !== null);
    const [selectedSymbol, setSelectedSymbol] = createSignal<string>(
        data().elements[0]?.symbol ?? "",
    );
    const [period, setPeriod] = createSignal<number>(
        data().elements.find((element) => !element.fBlock)?.period ?? 2,
    );
    const [cationSymbol, setCationSymbol] = createSignal<string>(metals()[0]?.symbol ?? "");
    const [anionSymbol, setAnionSymbol] = createSignal<string>(anionFormers()[0]?.symbol ?? "");
    const selected = (): IElementReference | null =>
        data().elements.find((element) => element.symbol === selectedSymbol()) ?? null;
    const periods = (): number[] => {
        const seen = new Set<number>();
        for (const element of data().elements) {
            if (!element.fBlock) {
                seen.add(element.period);
            }
        }
        return Array.from(seen).sort((a, b) => a - b);
    };
    const trend = (): IElementReference[] =>
        ElementReference.periodTrend(data().elements, period());
    const fBlock = (row: number): IElementReference[] =>
        data().elements.filter((element) => element.fBlock && element.period === row);
    const nomenclature = (): { formula: string; name: string } | null => {
        const cation = metals().find((element) => element.symbol === cationSymbol());
        const anion = anionFormers().find((element) => element.symbol === anionSymbol());
        if (cation === undefined || anion === undefined) {
            return null;
        }
        return ElementReference.nomenclature(cation, cation.cations[0], anion);
    };
    return (
        <div class="mf-reference">
            <section class="mf-measure-section">
                <h3>Periodic table</h3>
                <div class="mf-periodic">
                    <For each={data().elements.filter((element) => !element.fBlock)}>
                        {(element) => (
                            <button
                                class={
                                    element.symbol === selectedSymbol()
                                        ? "mf-element mf-active"
                                        : "mf-element"
                                }
                                style={{
                                    "grid-column": String(element.group),
                                    "grid-row": String(element.period),
                                    "border-color": element.color,
                                }}
                                title={element.name + " (" + element.number + ")"}
                                onClick={() => setSelectedSymbol(element.symbol)}
                            >
                                <span class="mf-element-number">{element.number}</span>
                                <span class="mf-element-symbol">{element.symbol}</span>
                            </button>
                        )}
                    </For>
                    <For each={fBlock(6)}>
                        {(element, index) => (
                            <button
                                class={
                                    element.symbol === selectedSymbol()
                                        ? "mf-element mf-active"
                                        : "mf-element"
                                }
                                style={{
                                    "grid-column": String(index() + 3),
                                    "grid-row": "9",
                                    "border-color": element.color,
                                }}
                                title={element.name + " (" + element.number + ")"}
                                onClick={() => setSelectedSymbol(element.symbol)}
                            >
                                <span class="mf-element-number">{element.number}</span>
                                <span class="mf-element-symbol">{element.symbol}</span>
                            </button>
                        )}
                    </For>
                    <For each={fBlock(7)}>
                        {(element, index) => (
                            <button
                                class={
                                    element.symbol === selectedSymbol()
                                        ? "mf-element mf-active"
                                        : "mf-element"
                                }
                                style={{
                                    "grid-column": String(index() + 3),
                                    "grid-row": "10",
                                    "border-color": element.color,
                                }}
                                title={element.name + " (" + element.number + ")"}
                                onClick={() => setSelectedSymbol(element.symbol)}
                            >
                                <span class="mf-element-number">{element.number}</span>
                                <span class="mf-element-symbol">{element.symbol}</span>
                            </button>
                        )}
                    </For>
                </div>
                <Show
                    when={selected() !== null}
                    fallback={<p class="mf-measure-empty">Pick an element.</p>}
                >
                    <div class="mf-measure-grid">
                        <span class="mf-measure-label">Name</span>
                        <span class="mf-measure-value">{selected()?.name}</span>
                        <span class="mf-measure-label">Molar mass</span>
                        <span class="mf-measure-value">{selected()?.mass} g/mol</span>
                        <span class="mf-measure-label">Electronegativity</span>
                        <span class="mf-measure-value">
                            {selected()?.electronegativity === 0
                                ? "—"
                                : selected()?.electronegativity}
                        </span>
                        <span class="mf-measure-label">Covalent radius</span>
                        <span class="mf-measure-value">{selected()?.covalentRadius} Å</span>
                        <span class="mf-measure-label">Common cations</span>
                        <span class="mf-measure-value">
                            {selected()?.cations.length === 0
                                ? "—"
                                : selected()
                                      ?.cations.map((charge) => "+" + charge)
                                      .join(", ")}
                        </span>
                        <span class="mf-measure-label">Anion</span>
                        <span class="mf-measure-value">
                            {selected()?.anion === null
                                ? "—"
                                : selected()?.anion + " (" + selected()?.anionName + ")"}
                        </span>
                        <span class="mf-measure-label">Category</span>
                        <span class="mf-measure-value">{selected()?.kind}</span>
                    </div>
                </Show>
            </section>

            <section class="mf-measure-section">
                <h3>Period trends</h3>
                <select
                    class="mf-measure-select"
                    value={String(period())}
                    onChange={(event) => setPeriod(Number(event.currentTarget.value))}
                >
                    <For each={periods()}>
                        {(value) => <option value={String(value)}>{"Period " + value}</option>}
                    </For>
                </select>
                <span class="mf-measure-label">Electronegativity</span>
                <BarChart
                    values={trend().map((element) => ({
                        label: element.symbol,
                        value: element.electronegativity,
                    }))}
                    format={(value) => value.toFixed(1)}
                />
                <span class="mf-measure-label">Covalent radius (Å)</span>
                <BarChart
                    values={trend().map((element) => ({
                        label: element.symbol,
                        value: element.covalentRadius,
                    }))}
                    format={(value) => value.toFixed(2)}
                />
            </section>

            <section class="mf-measure-section">
                <h3>Naming ionic compounds</h3>
                <Show
                    when={nomenclature() !== null}
                    fallback={<p class="mf-measure-empty">No ion pairs available.</p>}
                >
                    <div class="mf-measure-grid">
                        <span class="mf-measure-label">Cation</span>
                        <select
                            class="mf-measure-select"
                            value={cationSymbol()}
                            onChange={(event) => setCationSymbol(event.currentTarget.value)}
                        >
                            <For each={metals()}>
                                {(element) => (
                                    <option value={element.symbol}>
                                        {element.name + " (+" + element.cations[0] + ")"}
                                    </option>
                                )}
                            </For>
                        </select>
                        <span class="mf-measure-label">Anion</span>
                        <select
                            class="mf-measure-select"
                            value={anionSymbol()}
                            onChange={(event) => setAnionSymbol(event.currentTarget.value)}
                        >
                            <For each={anionFormers()}>
                                {(element) => (
                                    <option value={element.symbol}>
                                        {element.name + " (" + element.anion + ")"}
                                    </option>
                                )}
                            </For>
                        </select>
                        <span class="mf-measure-label">Formula</span>
                        <span class="mf-measure-value">{nomenclature()?.formula}</span>
                        <span class="mf-measure-label">Name</span>
                        <span class="mf-measure-value">{nomenclature()?.name}</span>
                    </div>
                </Show>
            </section>

            <section class="mf-measure-section">
                <h3>Constants</h3>
                <ul class="mf-measure-list">
                    <For each={data().constants}>
                        {(entry) => (
                            <li>
                                <span class="mf-measure-name">{entry.label}</span>
                                <span class="mf-measure-formula">{entry.detail}</span>
                            </li>
                        )}
                    </For>
                </ul>
            </section>

            <section class="mf-measure-section">
                <h3>Equations</h3>
                <ul class="mf-measure-list">
                    <For each={data().equations}>
                        {(entry) => (
                            <li>
                                <span class="mf-measure-name">{entry.label}</span>
                                <span class="mf-measure-formula">{entry.detail}</span>
                            </li>
                        )}
                    </For>
                </ul>
            </section>
        </div>
    );
}
