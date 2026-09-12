import { For, type JSX } from "solid-js";
import type { AppViewModel } from "./AppViewModel";

export function LogView(properties: { vm: AppViewModel }): JSX.Element {
    const vm = properties.vm;
    const latest = (): { time: number; text: string; flash: boolean } | null => {
        const entries = vm.getLog();
        return entries.length === 0 ? null : entries[entries.length - 1];
    };
    const visible = (): ReadonlyArray<{ time: number; text: string; flash: boolean }> => {
        const entries = vm.getLog();
        return entries.slice(Math.max(0, entries.length - 8));
    };
    return (
        <div class="mf-footer">
            <button
                class="mf-log-head"
                onClick={() => vm.toggleLog()}
                title="Collapse or expand the reaction log"
            >
                <span class="mf-log-title">Reaction Log</span>
                <span class="mf-log-chevron">{vm.getLogOpen() ? "hide" : "show"}</span>
                {vm.getLogOpen() || latest() === null ? null : (
                    <span class="mf-log-ticker">
                        <span class="mf-time">{latest()?.time}</span>
                        {latest()?.text}
                    </span>
                )}
            </button>
            {vm.getLogOpen() ? (
                <div class="mf-log-list">
                    <For each={visible()}>
                        {(entry) => (
                            <div class={entry.flash ? "mf-log-line mf-flash" : "mf-log-line"}>
                                <span class="mf-time">{entry.time}</span>
                                {entry.text}
                            </div>
                        )}
                    </For>
                </div>
            ) : null}
        </div>
    );
}
