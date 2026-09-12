import { For, type JSX } from "solid-js";
import type { AppViewModel } from "./AppViewModel";

const PINNED_TAGS = [
    "aromatic",
    "toxin",
    "amino",
    "polymer",
    "explosive",
    "natural",
    "sugar",
    "drug",
    "hormone",
    "lipid",
    "gas",
    "ring",
];

export function TagCloudView(properties: { vm: AppViewModel }): JSX.Element {
    const vm = properties.vm;
    return (
        <div class="mf-tags">
            <For each={PINNED_TAGS}>
                {(tag) => (
                    <button
                        class={vm.getTag() === tag ? "mf-tag mf-active" : "mf-tag"}
                        onClick={() => vm.selectTag(tag)}
                    >
                        {tag}
                    </button>
                )}
            </For>
        </div>
    );
}
