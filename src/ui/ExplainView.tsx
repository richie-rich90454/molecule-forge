import { For, Show, type JSX } from "solid-js";
import type { IExplainData } from "../chem/ReactionExplainer";

function signedEnergy(value: number): string {
    const rounded = Math.round(value);
    const sign = rounded > 0 ? "+" : "";
    const label = rounded < 0 ? "released" : rounded > 0 ? "absorbed" : "no net change";
    return sign + rounded + " kJ/mol (" + label + ")";
}

export function ExplainView(properties: { data: IExplainData }): JSX.Element {
    const data = () => properties.data;
    return (
        <div class="mf-explain">
            <section class="mf-measure-section">
                <h3>Last reaction</h3>
                <Show
                    when={data().reaction}
                    fallback={
                        <p class="mf-measure-empty">
                            No reaction yet. Click a log line or run the chamber.
                        </p>
                    }
                >
                    {(reaction) => (
                        <div class="mf-explain-card">
                            <h4>{reaction().name}</h4>
                            <Show when={reaction().equation !== ""}>
                                <p class="mf-explain-equation">{reaction().equation}</p>
                            </Show>
                            <p class="mf-explain-message">{reaction().message}</p>
                            <div class="mf-measure-grid">
                                <Show when={reaction().deltaH !== null}>
                                    <span class="mf-measure-label">Net &Delta;H</span>
                                    <span class="mf-measure-value">
                                        {signedEnergy(reaction().deltaH as number)}
                                    </span>
                                </Show>
                                <Show when={reaction().activationEnergy !== null}>
                                    <span class="mf-measure-label">Activation energy</span>
                                    <span class="mf-measure-value">
                                        {Math.round(reaction().activationEnergy as number)} kJ/mol
                                    </span>
                                </Show>
                                <span class="mf-measure-label">Conditions</span>
                                <span class="mf-measure-value">{reaction().conditions}</span>
                                <Show when={reaction().rateLaw !== ""}>
                                    <span class="mf-measure-label">Rate law</span>
                                    <span class="mf-measure-value">{reaction().rateLaw}</span>
                                </Show>
                                <Show when={reaction().reference !== ""}>
                                    <span class="mf-measure-label">Reference</span>
                                    <span class="mf-measure-value">{reaction().reference}</span>
                                </Show>
                            </div>
                        </div>
                    )}
                </Show>
            </section>

            <section class="mf-measure-section">
                <h3>Selected molecule</h3>
                <Show
                    when={data().molecule}
                    fallback={<p class="mf-measure-empty">Select a molecule in the library.</p>}
                >
                    {(molecule) => (
                        <div class="mf-explain-card">
                            <h4>
                                {molecule().name}{" "}
                                <span class="mf-measure-formula">{molecule().formula}</span>
                            </h4>
                            <p class="mf-explain-message">{molecule().summary}</p>
                            <div class="mf-measure-grid">
                                <span class="mf-measure-label">Molar mass</span>
                                <span class="mf-measure-value">{molecule().mass} g/mol</span>
                                <span class="mf-measure-label">Atoms</span>
                                <span class="mf-measure-value">{molecule().atomCount}</span>
                                <span class="mf-measure-label">Net charge</span>
                                <span class="mf-measure-value">
                                    {molecule().netCharge > 0 ? "+" : ""}
                                    {molecule().netCharge}
                                </span>
                                <span class="mf-measure-label">H-bond donors</span>
                                <span class="mf-measure-value">{molecule().donors}</span>
                                <span class="mf-measure-label">H-bond acceptors</span>
                                <span class="mf-measure-value">{molecule().acceptors}</span>
                                <span class="mf-measure-label">Rotatable bonds</span>
                                <span class="mf-measure-value">{molecule().rotatable}</span>
                                <span class="mf-measure-label">TPSA</span>
                                <span class="mf-measure-value">{molecule().tpsa}</span>
                                <span class="mf-measure-label">logP</span>
                                <span class="mf-measure-value">{molecule().logP}</span>
                                <span class="mf-measure-label">Aromatic rings</span>
                                <span class="mf-measure-value">{molecule().aromaticRings}</span>
                                <Show when={molecule().hazard}>
                                    <span class="mf-measure-label">Hazard</span>
                                    <span class="mf-measure-value">Handle with care</span>
                                </Show>
                            </div>
                            <Show when={molecule().atomCounts.length > 0}>
                                <div class="mf-measure-chips">
                                    <For each={molecule().atomCounts}>
                                        {(tally) => (
                                            <span class="mf-measure-chip">
                                                {tally.element} {tally.count}
                                            </span>
                                        )}
                                    </For>
                                </div>
                            </Show>
                            <Show when={molecule().groups.length > 0}>
                                <ul class="mf-measure-list">
                                    <For each={molecule().groups}>
                                        {(group) => (
                                            <li>
                                                <span class="mf-measure-name">{group.label}</span>
                                                <span class="mf-measure-count">{group.count}</span>
                                            </li>
                                        )}
                                    </For>
                                </ul>
                            </Show>
                        </div>
                    )}
                </Show>
            </section>
        </div>
    );
}
