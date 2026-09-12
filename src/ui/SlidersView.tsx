import type { JSX } from "solid-js";
import type { AppViewModel } from "./AppViewModel";

interface ISliderDef {
    label: string;
    min: number;
    max: number;
    step: number;
    unit: string;
    get: () => number;
    set: (value: number) => void;
}

export function SlidersView(properties: { vm: AppViewModel; onChange: () => void }): JSX.Element {
    const vm = properties.vm;
    const onChange = properties.onChange;
    const sliders: ISliderDef[] = [
        {
            label: "Temp",
            min: 0,
            max: 1500,
            step: 5,
            unit: "K",
            get: vm.getTemperature,
            set: vm.setTemperature,
        },
        {
            label: "Press",
            min: 0.2,
            max: 5,
            step: 0.1,
            unit: "bar",
            get: vm.getPressure,
            set: vm.setPressure,
        },
        { label: "pH", min: 0, max: 14, step: 0.1, unit: "", get: vm.getPh, set: vm.setPh },
        {
            label: "Visc",
            min: 0,
            max: 1,
            step: 0.01,
            unit: "",
            get: vm.getViscosity,
            set: vm.setViscosity,
        },
        {
            label: "Polar",
            min: 0,
            max: 1,
            step: 0.01,
            unit: "",
            get: vm.getPolarity,
            set: vm.setPolarity,
        },
        {
            label: "Grav",
            min: -1,
            max: 2,
            step: 0.05,
            unit: "",
            get: vm.getGravity,
            set: vm.setGravity,
        },
        {
            label: "Speed",
            min: 0.1,
            max: 3,
            step: 0.05,
            unit: "x",
            get: vm.getTimeSpeed,
            set: vm.setTimeSpeed,
        },
        {
            label: "Bonds",
            min: 0.2,
            max: 2,
            step: 0.05,
            unit: "x",
            get: vm.getBondStrength,
            set: vm.setBondStrength,
        },
        {
            label: "Rad",
            min: 0,
            max: 1,
            step: 0.01,
            unit: "",
            get: vm.getRadiation,
            set: vm.setRadiation,
        },
    ];
    return (
        <div class="mf-sliders">
            {sliders.map((slider) => (
                <div class="mf-slider">
                    <label>{slider.label}</label>
                    <input
                        type="range"
                        min={slider.min}
                        max={slider.max}
                        step={slider.step}
                        value={slider.get()}
                        onInput={(event) => {
                            slider.set(parseFloat((event.target as HTMLInputElement).value));
                            onChange();
                        }}
                    />
                    <output>
                        {slider.get().toFixed(slider.step < 0.1 ? 2 : slider.step < 1 ? 1 : 0)}
                        {slider.unit}
                    </output>
                </div>
            ))}
        </div>
    );
}
