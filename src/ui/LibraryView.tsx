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
        if (element === undefined || element === null) {
            return;
        }
        canvas = element;
        thumbnails.watch(element, record);
    };
    onCleanup(() => {
        if (canvas !== undefined) {
            thumbnails.unwatch(canvas);
        }
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
            <canvas ref={attach} />
            <div class="mf-card-name">{record.name}</div>
            <div class="mf-card-formula">{record.formula}</div>
            {record.warn ? <span class="mf-card-badge">skull warn</span> : null}
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
