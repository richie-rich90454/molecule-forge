import { For, type JSX } from "solid-js";
import type { AppViewModel } from "./AppViewModel";

export function PresetsView(properties: { vm: AppViewModel }): JSX.Element {
    const vm = properties.vm;
    return (
        <div class="mf-presets">
            <select
                value={vm.getPresetId()}
                onChange={(event) => {
                    const id = (event.target as HTMLSelectElement).value;
                    if (id !== "") {
                        vm.applyPreset(id);
                    }
                }}
            >
                <option value="">Presets</option>
                <For each={vm.getPresets()}>
                    {(preset) => <option value={preset.id}>{preset.name}</option>}
                </For>
            </select>
        </div>
    );
}
