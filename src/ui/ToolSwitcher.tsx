import type { JSX } from "solid-js";
import type { AppViewModel, CanvasTool } from "./AppViewModel";
import { IconErase, IconOrbit, IconPlace } from "./Icons";

const TOOLS: Array<{ id: CanvasTool; label: (molecule: string) => string; title: string }> = [
    {
        id: "orbit",
        label: () => "Orbit",
        title: "Drag to orbit, scroll to zoom, click atoms to inspect",
    },
    {
        id: "place",
        label: (molecule) => (molecule === "" ? "Place" : "Place " + molecule),
        title: "Click or drag the canvas to place the selected molecule",
    },
    {
        id: "erase",
        label: () => "Erase",
        title: "Click or drag molecules to remove them",
    },
];

const ICONS: Record<CanvasTool, JSX.Element> = {
    orbit: IconOrbit,
    place: IconPlace,
    erase: IconErase,
};

export function ToolSwitcher(properties: { vm: AppViewModel }): JSX.Element {
    const vm = properties.vm;
    const selectedName = (): string => {
        const record = vm.getRegistry().findById(vm.getSelectedId());
        return record === undefined ? "" : record.name;
    };
    return (
        <div class="mf-tools">
            {TOOLS.map((tool) => (
                <button
                    class={vm.getTool() === tool.id ? "mf-tool mf-active" : "mf-tool"}
                    title={tool.title}
                    onClick={() => vm.setTool(tool.id)}
                >
                    <span class="mf-tool-icon">{ICONS[tool.id]}</span>
                    <span class="mf-tool-label">{tool.label(selectedName())}</span>
                </button>
            ))}
        </div>
    );
}
