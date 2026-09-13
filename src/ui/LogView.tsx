import { For, type JSX } from "solid-js";
import type { AppViewModel, ILogEntry } from "./AppViewModel";
import type { IReactionEvent } from "../sim/ReactionEngine";

export function LogView(properties: { vm: AppViewModel }): JSX.Element {
    const vm = properties.vm;
    const latest = (): ILogEntry | null => {
        const entries = vm.getLog();
        return entries.length === 0 ? null : entries[entries.length - 1];
    };
    const visible = (): ReadonlyArray<ILogEntry> => {
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
                <span class="mf-log-chevron">{vm.getLogOpen() ? "Hide" : "Show"}</span>
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
                        {(entry) =>
                            entry.event !== undefined ? (
                                <button
                                    class={
                                        entry.flash
                                            ? "mf-log-line mf-log-clickable mf-flash"
                                            : "mf-log-line mf-log-clickable"
                                    }
                                    onClick={() => vm.explainEvent(entry.event as IReactionEvent)}
                                    title="Explain this reaction"
                                >
                                    <span class="mf-time">{entry.time}</span>
                                    {entry.text}
                                </button>
                            ) : (
                                <div class={entry.flash ? "mf-log-line mf-flash" : "mf-log-line"}>
                                    <span class="mf-time">{entry.time}</span>
                                    {entry.text}
                                </div>
                            )
                        }
                    </For>
                </div>
            ) : null}
        </div>
    );
}
