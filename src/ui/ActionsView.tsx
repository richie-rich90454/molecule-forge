import type { JSX } from "solid-js";
import type { AppViewModel } from "./AppViewModel";

export function ActionsView(properties: { vm: AppViewModel }): JSX.Element {
    const vm = properties.vm;
    return (
        <div class="mf-actions">
            <button class="mf-btn" onClick={() => vm.heat()}>
                Heat
            </button>
            <button class="mf-btn" onClick={() => vm.cool()}>
                Cool
            </button>
            <button class="mf-btn" onClick={() => vm.spark()}>
                Spark
            </button>
            <button class="mf-btn mf-danger" onClick={() => vm.detonate()}>
                Detonate
            </button>
            <button class="mf-btn" onClick={() => vm.catalyze()}>
                Catalyze
            </button>
            <button class="mf-btn" onClick={() => vm.polymerize()}>
                Polymerize
            </button>
            <button class="mf-btn" onClick={() => vm.freeze()}>
                Freeze
            </button>
            <button class="mf-btn" onClick={() => vm.shake()}>
                Shake
            </button>
            <button class="mf-btn" onClick={() => vm.copySnapshot()}>
                Snapshot
            </button>
            <button class="mf-btn" onClick={() => vm.clearWorld()}>
                Clear
            </button>
        </div>
    );
}
