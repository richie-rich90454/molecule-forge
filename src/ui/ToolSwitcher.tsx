import type { JSX } from "solid-js";
import type { AppViewModel, CanvasTool } from "./AppViewModel";

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
                    {tool.label(selectedName())}
                </button>
            ))}
        </div>
    );
}
