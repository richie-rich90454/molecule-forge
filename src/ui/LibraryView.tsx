import { For, onCleanup, type JSX } from "solid-js";
import type { IMoleculeRecord } from "../chem/MoleculeRecord";
import type { AppViewModel } from "./AppViewModel";
import { ThumbnailRenderer } from "./ThumbnailRenderer";

const thumbnails = new ThumbnailRenderer();

function MoleculeCard(properties: { vm: AppViewModel; record: IMoleculeRecord }): JSX.Element {
    const vm = properties.vm;
    const record = properties.record;
    let canvas: HTMLCanvasElement | undefined;
    const attach = (element: HTMLCanvasElement): void => {
        /* v8 ignore start -- defensive: Solid always supplies the canvas element */
        if (element === undefined || element === null) {
            return;
        }
        /* v8 ignore stop */
        canvas = element;
        thumbnails.watch(element, record);
    };
    onCleanup(() => {
        /* v8 ignore start -- cleanup only runs after a successful attach */
        if (canvas !== undefined) {
            thumbnails.unwatch(canvas);
        }
        /* v8 ignore stop */
    });
    const disabled = record.warn && !vm.getWarnings();
    const selected = vm.getSelectedId() === record.id;
    return (
        <button
            class={
                record.warn
                    ? selected
                        ? "mf-card mf-warn mf-selected"
                        : "mf-card mf-warn"
                    : selected
                      ? "mf-card mf-selected"
                      : "mf-card"
            }
            disabled={disabled}
            onClick={() => vm.selectMolecule(record.id)}
            title={record.name + " " + record.formula}
        >
            <span class="mf-card-thumb">
                <canvas ref={attach} />
            </span>
            <span class="mf-card-meta">
                <span class="mf-card-name">{record.name}</span>
                <span class="mf-card-formula">{record.formula}</span>
            </span>
            {record.warn ? <span class="mf-card-badge">Hazard</span> : null}
        </button>
    );
}

export function LibraryView(properties: { vm: AppViewModel }): JSX.Element {
    const vm = properties.vm;
    return (
        <div class="mf-cards">
            <For each={vm.getFilteredRecords()}>
                {(record) => <MoleculeCard vm={vm} record={record} />}
            </For>
        </div>
    );
}
