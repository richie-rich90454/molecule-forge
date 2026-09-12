import { For, type JSX } from "solid-js";
import type { AppViewModel } from "./AppViewModel";

export function LogView(properties: { vm: AppViewModel }): JSX.Element {
    const vm = properties.vm;
    const visible = (): ReadonlyArray<{ time: number; text: string; flash: boolean }> => {
        const entries = vm.getLog();
        return entries.slice(Math.max(0, entries.length - 6));
    };
    return (
        <div class="mf-footer">
            <div class="mf-log-title">Reaction Log</div>
            <For each={visible()}>
                {(entry) => (
                    <div class={entry.flash ? "mf-log-line mf-flash" : "mf-log-line"}>
                        <span class="mf-time">{entry.time}</span>
                        {entry.text}
                    </div>
                )}
            </For>
        </div>
    );
}
