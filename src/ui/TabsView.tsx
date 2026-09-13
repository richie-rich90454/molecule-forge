import { For, type JSX } from "solid-js";
import type { MoleculeCategory } from "../chem/MoleculeRecord";
import type { AppViewModel } from "./AppViewModel";

const TABS: Array<{ id: MoleculeCategory; label: string }> = [
    { id: "alkanes", label: "Alkanes" },
    { id: "alkenes", label: "Alkenes" },
    { id: "aromatics", label: "Aromatics" },
    { id: "functional", label: "Groups" },
    { id: "amino", label: "Amino" },
    { id: "sugars", label: "Sugars" },
    { id: "nucleotides", label: "Nucleo" },
    { id: "lipids", label: "Lipids" },
    { id: "pharma", label: "Pharma" },
    { id: "neuro", label: "Neuro" },
    { id: "polymers", label: "Polymers" },
    { id: "explosives", label: "Boom" },
    { id: "toxins", label: "Toxins" },
    { id: "exotic", label: "Exotic" },
    { id: "biomolecules", label: "Bio" },
    { id: "natural", label: "Natural" },
    { id: "elemental", label: "Elements" },
];

export function TabsView(properties: { vm: AppViewModel }): JSX.Element {
    const vm = properties.vm;
    return (
        <div class="mf-tabs">
            <For each={TABS}>
                {(tab) => (
                    <button
                        class={vm.getCategory() === tab.id ? "mf-tab mf-active" : "mf-tab"}
                        onClick={() => vm.selectCategory(tab.id)}
                    >
                        {tab.label}
                    </button>
                )}
            </For>
        </div>
    );
}
