import type { JSX } from "solid-js";
import { ActionsView } from "./ActionsView";
import type { AppViewModel } from "./AppViewModel";
import { LibraryView } from "./LibraryView";
import { LogView } from "./LogView";
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
                <span class="mf-brand">Molecule Forge</span>
                <PresetsView vm={vm} />
                <span class="mf-spacer" />
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
            </header>
            <div class="mf-main">
                <aside class="mf-library">
                    <TabsView vm={vm} />
                    <LibraryView vm={vm} />
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
