import type { JSX } from "solid-js";
import type { AppViewModel } from "./AppViewModel";

export function TogglesView(properties: { vm: AppViewModel; onChange: () => void }): JSX.Element {
    const vm = properties.vm;
    const onChange = properties.onChange;
    const toggles: Array<{ label: string; get: () => boolean; set: (value: boolean) => void }> = [
        { label: "Bonds", get: vm.getShowBonds, set: vm.setShowBonds },
        { label: "Charges", get: vm.getShowCharges, set: vm.setShowCharges },
        { label: "Orbitals", get: vm.getShowOrbitals, set: vm.setShowOrbitals },
        { label: "Arrows", get: vm.getShowArrows, set: vm.setShowArrows },
        { label: "Grid", get: vm.getShowGrid, set: vm.setShowGrid },
        { label: "Graph", get: vm.getShowGraph, set: vm.setShowGraph },
        { label: "Slow", get: vm.getSlowMotion, set: vm.setSlowMotion },
        { label: "Bloom", get: vm.getBloom, set: vm.setBloom },
        { label: "Sound", get: vm.getSoundOn, set: vm.setSoundOn },
        { label: "Warnings", get: vm.getWarnings, set: vm.setWarnings },
    ];
    return (
        <div class="mf-toggles">
            {toggles.map((toggle) => (
                <label class="mf-toggle">
                    <input
                        type="checkbox"
                        checked={toggle.get()}
                        onChange={(event) => {
                            toggle.set((event.target as HTMLInputElement).checked);
                            onChange();
                        }}
                    />
                    {toggle.label}
                </label>
            ))}
        </div>
    );
}
