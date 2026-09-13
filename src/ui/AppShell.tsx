import { Show, type JSX } from "solid-js";
import { ActionsView } from "./ActionsView";
import type { AppViewModel } from "./AppViewModel";
import { LibraryView } from "./LibraryView";
import { LogView } from "./LogView";
import { MeasureView } from "./MeasureView";
import { ReferenceView } from "./ReferenceView";
import { ExplainView } from "./ExplainView";
import { PresetsView } from "./PresetsView";
import { SlidersView } from "./SlidersView";
import { TabsView } from "./TabsView";
import { TogglesView } from "./TogglesView";
import { ToolSwitcher } from "./ToolSwitcher";

export interface IAppShellCallbacks {
    onCanvasMount(element: HTMLElement): void;
    onResetCamera(): void;
    onControlsChange(): void;
}

export function AppShell(properties: {
    vm: AppViewModel;
    callbacks: IAppShellCallbacks;
}): JSX.Element {
    const vm = properties.vm;
    const callbacks = properties.callbacks;
    return (
        <div class="mf-app">
            <header class="mf-header">
                <div class="mf-brand">
                    <span class="mf-brand-mark" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </span>
                    <span class="mf-brand-text">Molecule Forge</span>
                </div>
                <PresetsView vm={vm} />
                <span class="mf-spacer" />
                <div class="mf-header-actions">
                    <button class="mf-btn" onClick={() => vm.rerollSeed()} title="Reroll seed">
                        Seed {vm.getSeed()}
                    </button>
                    <button class="mf-btn" onClick={() => vm.togglePause()} title="Pause or resume">
                        {vm.getPaused() ? "Play" : "Pause"}
                    </button>
                    <button
                        class="mf-btn"
                        onClick={() => callbacks.onResetCamera()}
                        title="Reset camera"
                    >
                        View
                    </button>
                </div>
            </header>
            <div class="mf-main">
                <aside class="mf-library">
                    <div class="mf-panel-switch">
                        <button
                            class={
                                vm.getPanel() === "library"
                                    ? "mf-panel-btn mf-active"
                                    : "mf-panel-btn"
                            }
                            onClick={() => vm.selectPanel("library")}
                        >
                            Molecules
                        </button>
                        <button
                            class={
                                vm.getPanel() === "analyze"
                                    ? "mf-panel-btn mf-active"
                                    : "mf-panel-btn"
                            }
                            onClick={() => vm.selectPanel("analyze")}
                        >
                            Analyze
                        </button>
                        <button
                            class={
                                vm.getPanel() === "reference"
                                    ? "mf-panel-btn mf-active"
                                    : "mf-panel-btn"
                            }
                            onClick={() => vm.selectPanel("reference")}
                        >
                            Reference
                        </button>
                        <button
                            class={
                                vm.getPanel() === "explain"
                                    ? "mf-panel-btn mf-active"
                                    : "mf-panel-btn"
                            }
                            onClick={() => vm.selectPanel("explain")}
                        >
                            Explain
                        </button>
                    </div>
                    <Show when={vm.getPanel() === "library"}>
                        <TabsView vm={vm} />
                        <LibraryView vm={vm} />
                    </Show>
                    <Show when={vm.getPanel() === "analyze"}>
                        <MeasureView
                            data={vm.getMeasureData()}
                            onSelectRule={(ruleId) => vm.setSelectedRuleId(ruleId)}
                        />
                    </Show>
                    <Show when={vm.getPanel() === "reference"}>
                        <ReferenceView data={vm.getReferenceData()} />
                    </Show>
                    <Show when={vm.getPanel() === "explain"}>
                        <ExplainView data={vm.getExplainData()} />
                    </Show>
                </aside>
                <div class="mf-stage">
                    <div
                        class="mf-canvas-wrap"
                        ref={(element) => {
                            callbacks.onCanvasMount(element);
                        }}
                    >
                        <div class="mf-vignette" />
                        <ToolSwitcher vm={vm} />
                        <div class="mf-hud">
                            <b>{vm.getFps()}</b> fps &middot; <b>{vm.getCount()}</b> molecules (q
                            {vm.getQuality()})
                        </div>
                    </div>
                    <div class="mf-controls">
                        <SlidersView vm={vm} onChange={() => callbacks.onControlsChange()} />
                        <ActionsView vm={vm} />
                        <TogglesView vm={vm} onChange={() => callbacks.onControlsChange()} />
                    </div>
                </div>
            </div>
            <LogView vm={vm} />
        </div>
    );
}
