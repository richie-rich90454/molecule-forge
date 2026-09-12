import { createMemo, createSignal } from "solid-js";
import type { IMoleculeRecord, IMoleculeRegistry, MoleculeCategory } from "../chem/MoleculeRecord";
import { PresetCatalog, type IPreset } from "../presets/PresetCatalog";
import { SnapshotCodec } from "../state/SnapshotCodec";
import type { IReactionEvent, IReactionSink } from "../sim/ReactionEngine";
import { SeededRandom } from "../sim/SeededRandom";
import type { World } from "../sim/World";
import type { SoundEngine } from "../audio/SoundEngine";

export interface ILogEntry {
    readonly time: number;
    readonly text: string;
    readonly flash: boolean;
}

export interface IEffectSink {
    flash(x: number, y: number, z: number, color: string, size: number): void;
    burst(x: number, y: number, z: number, kind: string, seed: number): void;
    arrow(x: number, y: number, z: number): void;
}

export interface ISelectedAtom {
    readonly instanceId: number;
    readonly atomIndex: number;
}

const MAX_INSTANCES = 2500;

export class AppViewModel implements IReactionSink {
    private readonly registry: IMoleculeRegistry;
    private readonly world: World;
    private readonly sound: SoundEngine;
    private readonly effects: IEffectSink;
    private readonly presets: IPreset[];
    private logCounter: number;

    public readonly getCategory: () => MoleculeCategory;
    public readonly setCategory: (value: MoleculeCategory) => void;
    public readonly getTag: () => string;
    public readonly setTag: (value: string) => void;
    public readonly getSelectedId: () => string;
    public readonly setSelectedId: (value: string) => void;
    public readonly getTemperature: () => number;
    public readonly setTemperature: (value: number) => void;
    public readonly getPressure: () => number;
    public readonly setPressure: (value: number) => void;
    public readonly getPh: () => number;
    public readonly setPh: (value: number) => void;
    public readonly getViscosity: () => number;
    public readonly setViscosity: (value: number) => void;
    public readonly getPolarity: () => number;
    public readonly setPolarity: (value: number) => void;
    public readonly getGravity: () => number;
    public readonly setGravity: (value: number) => void;
    public readonly getTimeSpeed: () => number;
    public readonly setTimeSpeed: (value: number) => void;
    public readonly getBondStrength: () => number;
    public readonly setBondStrength: (value: number) => void;
    public readonly getRadiation: () => number;
    public readonly setRadiation: (value: number) => void;
    public readonly getShowBonds: () => boolean;
    public readonly setShowBonds: (value: boolean) => void;
    public readonly getShowCharges: () => boolean;
    public readonly setShowCharges: (value: boolean) => void;
    public readonly getShowOrbitals: () => boolean;
    public readonly setShowOrbitals: (value: boolean) => void;
    public readonly getShowArrows: () => boolean;
    public readonly setShowArrows: (value: boolean) => void;
    public readonly getShowGrid: () => boolean;
    public readonly setShowGrid: (value: boolean) => void;
    public readonly getShowGraph: () => boolean;
    public readonly setShowGraph: (value: boolean) => void;
    public readonly getSlowMotion: () => boolean;
    public readonly setSlowMotion: (value: boolean) => void;
    public readonly getBloom: () => boolean;
    public readonly setBloom: (value: boolean) => void;
    public readonly getSoundOn: () => boolean;
    public readonly setSoundOn: (value: boolean) => void;
    public readonly getWarnings: () => boolean;
    public readonly setWarnings: (value: boolean) => void;
    public readonly getLog: () => ReadonlyArray<ILogEntry>;
    public readonly setLog: (value: ReadonlyArray<ILogEntry>) => void;
    public readonly getPaused: () => boolean;
    public readonly setPaused: (value: boolean) => void;
    public readonly getSeed: () => number;
    public readonly setSeed: (value: number) => void;
    public readonly getFps: () => number;
    public readonly setFps: (value: number) => void;
    public readonly getCount: () => number;
    public readonly setCount: (value: number) => void;
    public readonly getQuality: () => number;
    public readonly setQuality: (value: number) => void;
    public readonly getPresetId: () => string;
    public readonly setPresetId: (value: string) => void;
    public readonly getSelectedAtom: () => ISelectedAtom | null;
    public readonly setSelectedAtom: (value: ISelectedAtom | null) => void;
    public readonly getFilteredRecords: () => ReadonlyArray<IMoleculeRecord>;

    public constructor(
        registry: IMoleculeRegistry,
        world: World,
        sound: SoundEngine,
        effects: IEffectSink,
    ) {
        this.registry = registry;
        this.world = world;
        this.sound = sound;
        this.effects = effects;
        this.presets = PresetCatalog.buildPresets();
        this.logCounter = 0;
        const [getCategory, setCategory] = createSignal<MoleculeCategory>("alkanes");
        this.getCategory = getCategory;
        this.setCategory = setCategory;
        const [getTag, setTag] = createSignal<string>("");
        this.getTag = getTag;
        this.setTag = setTag;
        const [getSelectedId, setSelectedId] = createSignal<string>("caffeine");
        this.getSelectedId = getSelectedId;
        this.setSelectedId = setSelectedId;
        const [getTemperature, setTemperature] = createSignal<number>(298);
        this.getTemperature = getTemperature;
        this.setTemperature = setTemperature;
        const [getPressure, setPressure] = createSignal<number>(1);
        this.getPressure = getPressure;
        this.setPressure = setPressure;
        const [getPh, setPh] = createSignal<number>(7);
        this.getPh = getPh;
        this.setPh = setPh;
        const [getViscosity, setViscosity] = createSignal<number>(0.2);
        this.getViscosity = getViscosity;
        this.setViscosity = setViscosity;
        const [getPolarity, setPolarity] = createSignal<number>(0.5);
        this.getPolarity = getPolarity;
        this.setPolarity = setPolarity;
        const [getGravity, setGravity] = createSignal<number>(0);
        this.getGravity = getGravity;
        this.setGravity = setGravity;
        const [getTimeSpeed, setTimeSpeed] = createSignal<number>(1);
        this.getTimeSpeed = getTimeSpeed;
        this.setTimeSpeed = setTimeSpeed;
        const [getBondStrength, setBondStrength] = createSignal<number>(1);
        this.getBondStrength = getBondStrength;
        this.setBondStrength = setBondStrength;
        const [getRadiation, setRadiation] = createSignal<number>(0);
        this.getRadiation = getRadiation;
        this.setRadiation = setRadiation;
        const [getShowBonds, setShowBonds] = createSignal<boolean>(true);
        this.getShowBonds = getShowBonds;
        this.setShowBonds = setShowBonds;
        const [getShowCharges, setShowCharges] = createSignal<boolean>(true);
        this.getShowCharges = getShowCharges;
        this.setShowCharges = setShowCharges;
        const [getShowOrbitals, setShowOrbitals] = createSignal<boolean>(false);
        this.getShowOrbitals = getShowOrbitals;
        this.setShowOrbitals = setShowOrbitals;
        const [getShowArrows, setShowArrows] = createSignal<boolean>(true);
        this.getShowArrows = getShowArrows;
        this.setShowArrows = setShowArrows;
        const [getShowGrid, setShowGrid] = createSignal<boolean>(false);
        this.getShowGrid = getShowGrid;
        this.setShowGrid = setShowGrid;
        const [getShowGraph, setShowGraph] = createSignal<boolean>(false);
        this.getShowGraph = getShowGraph;
        this.setShowGraph = setShowGraph;
        const [getSlowMotion, setSlowMotion] = createSignal<boolean>(false);
        this.getSlowMotion = getSlowMotion;
        this.setSlowMotion = setSlowMotion;
        const [getBloom, setBloom] = createSignal<boolean>(true);
        this.getBloom = getBloom;
        this.setBloom = setBloom;
        const [getSoundOn, setSoundOn] = createSignal<boolean>(false);
        this.getSoundOn = getSoundOn;
        this.setSoundOn = setSoundOn;
        const [getWarnings, setWarnings] = createSignal<boolean>(true);
        this.getWarnings = getWarnings;
        this.setWarnings = setWarnings;
        const [getLog, setLog] = createSignal<ReadonlyArray<ILogEntry>>([]);
        this.getLog = getLog;
        this.setLog = setLog;
        const [getPaused, setPaused] = createSignal<boolean>(false);
        this.getPaused = getPaused;
        this.setPaused = setPaused;
        const [getSeed, setSeed] = createSignal<number>(1101);
        this.getSeed = getSeed;
        this.setSeed = setSeed;
        const [getFps, setFps] = createSignal<number>(60);
        this.getFps = getFps;
        this.setFps = setFps;
        const [getCount, setCount] = createSignal<number>(0);
        this.getCount = getCount;
        this.setCount = setCount;
        const [getQuality, setQuality] = createSignal<number>(0);
        this.getQuality = getQuality;
        this.setQuality = setQuality;
        const [getPresetId, setPresetId] = createSignal<string>("");
        this.getPresetId = getPresetId;
        this.setPresetId = setPresetId;
        const [getSelectedAtom, setSelectedAtom] = createSignal<ISelectedAtom | null>(null);
        this.getSelectedAtom = getSelectedAtom;
        this.setSelectedAtom = setSelectedAtom;
        this.getFilteredRecords = createMemo(() => {
            const category = getCategory();
            const tag = getTag();
            let records = registry.getRecords(category);
            if (tag !== "") {
                records = records.filter((record) => record.tags.includes(tag));
            }
            return records;
        });
    }

    public initialize(): void {
        this.syncParamsToWorld();
    }

    public getRegistry(): IMoleculeRegistry {
        return this.registry;
    }

    public getWorld(): World {
        return this.world;
    }

    public getPresets(): ReadonlyArray<IPreset> {
        return this.presets;
    }

    public publish(event: IReactionEvent): void {
        this.addLog(event.message, true);
        this.effects.flash(
            event.x,
            event.y,
            event.z,
            event.flash,
            event.particles === "boom" ? 14 : 7,
        );
        this.effects.burst(
            event.x,
            event.y,
            event.z,
            event.particles,
            Math.floor(event.x * 13 + event.y * 7 + event.z * 5),
        );
        if (this.getShowArrows()) {
            this.effects.arrow(event.x, event.y, event.z);
        }
        if (event.particles === "boom") {
            this.sound.playBoom();
        } else if (event.particles === "spark") {
            this.sound.playWhoosh();
        } else {
            this.sound.playBlip();
        }
        this.setCount(this.world.countAlive());
    }

    public addLog(text: string, flash: boolean): void {
        this.logCounter++;
        const entries = [...this.getLog(), { time: this.logCounter, text, flash }];
        while (entries.length > 100) {
            entries.shift();
        }
        this.setLog(entries);
    }

    public selectCategory(category: MoleculeCategory): void {
        this.setCategory(category);
        this.setTag("");
    }

    public selectTag(tag: string): void {
        this.setTag(this.getTag() === tag ? "" : tag);
    }

    public selectMolecule(id: string): void {
        this.setSelectedId(id);
        const record = this.registry.findById(id);
        if (record !== undefined) {
            this.addLog(
                "Selected " +
                    record.name +
                    " (" +
                    record.formula +
                    "). Click the canvas to place it.",
                false,
            );
        }
        this.sound.playPop();
    }

    public syncParamsToWorld(): void {
        const params = this.world.params;
        params.temperature = this.getTemperature();
        params.pressure = this.getPressure();
        params.ph = this.getPh();
        params.viscosity = this.getViscosity();
        params.polarity = this.getPolarity();
        params.gravity = this.getGravity();
        params.timeScale = this.getSlowMotion() ? 0.15 : this.getTimeSpeed();
        params.bondStrength = this.getBondStrength();
        params.radiation = this.getRadiation();
        this.world.targetBoxSize = 60 / Math.max(0.2, params.pressure);
    }

    public spawnSelected(x: number, y: number, z: number): boolean {
        const record = this.registry.findById(this.getSelectedId());
        if (record === undefined) {
            return false;
        }
        if (record.warn && !this.getWarnings()) {
            this.addLog(
                "Warning molecules are hidden. Enable warnings to place " + record.name + ".",
                true,
            );
            return false;
        }
        if (this.world.countAlive() >= MAX_INSTANCES) {
            this.addLog("The chamber is full. Clear or remove molecules first.", true);
            return false;
        }
        const speed = 2 + this.world.params.temperature / 200;
        this.world.spawn(record, x, y, z, speed);
        this.setCount(this.world.countAlive());
        this.sound.playPop();
        return true;
    }

    public removeAt(instanceId: number): void {
        this.world.remove(instanceId);
        this.setCount(this.world.countAlive());
    }

    public heat(): void {
        this.setTemperature(Math.min(1500, this.getTemperature() + 250));
        this.syncParamsToWorld();
        this.addLog("Heating to " + Math.round(this.getTemperature()) + " K.", false);
    }

    public cool(): void {
        this.setTemperature(Math.max(0, this.getTemperature() - 250));
        this.syncParamsToWorld();
        this.addLog("Cooling to " + Math.round(this.getTemperature()) + " K.", false);
    }

    public freeze(): void {
        this.setTemperature(10);
        this.syncParamsToWorld();
        this.addLog("Flash frozen. Motion nearly stops.", false);
        this.sound.playBlip();
    }

    public spark(): void {
        this.world.params.spark = 1;
        this.addLog("Spark cracks through the chamber.", true);
        this.effects.burst(0, 0, 0, "spark", this.getSeed());
        this.sound.playWhoosh();
    }

    public detonate(): void {
        const instances = this.world.getInstanceList();
        const volatile = instances.filter((inst) => inst.record.tags.includes("explosive"));
        this.world.params.spark = 1;
        if (volatile.length === 0) {
            this.addLog("Nothing volatile in the chamber. Add explosives first.", true);
            return;
        }
        const rng = new SeededRandom(this.getSeed() + this.logCounter);
        for (const inst of volatile) {
            if (rng.next() < 0.85) {
                this.effects.flash(inst.px, inst.py, inst.pz, "#ff5030", 14);
                this.effects.burst(
                    inst.px,
                    inst.py,
                    inst.pz,
                    "boom",
                    Math.floor(rng.next() * 100000),
                );
                this.world.remove(inst.id);
            } else {
                inst.vx += (rng.next() - 0.5) * 40;
                inst.vy += rng.next() * 30;
                inst.vz += (rng.next() - 0.5) * 40;
            }
        }
        this.addLog("Detonation! " + volatile.length + " charges fired.", true);
        this.sound.playBoom();
        this.setCount(this.world.countAlive());
    }

    public catalyze(): void {
        this.world.params.catalyst = 1;
        this.addLog("Catalyst dispersed. Activation barriers fall.", false);
        this.sound.playChime();
    }

    public polymerize(): void {
        const mapping = new Map<string, string>([
            ["styrene", "polystyrene"],
            ["ethene", "polyethylene"],
            ["propene", "polypropylene"],
            ["vinyl-chloride", "pvc"],
            ["tetrafluoroethene", "ptfe"],
        ]);
        let converted = 0;
        for (const [monomerId, polymerId] of mapping) {
            const monomers = this.world.findInstances(monomerId, null, 12);
            const polymer = this.registry.findById(polymerId);
            if (polymer === undefined) {
                continue;
            }
            for (let i = 0; i + 2 < monomers.length; i += 3) {
                let cx = 0;
                let cy = 0;
                let cz = 0;
                for (let k = 0; k < 3; k++) {
                    cx += monomers[i + k].px;
                    cy += monomers[i + k].py;
                    cz += monomers[i + k].pz;
                    this.world.remove(monomers[i + k].id);
                }
                this.world.spawn(polymer, cx / 3, cy / 3, cz / 3, 1);
                converted++;
                if (converted >= 6) {
                    break;
                }
            }
            if (converted >= 6) {
                break;
            }
        }
        if (converted > 0) {
            this.addLog("Polymerized " + converted + " chains from monomers.", true);
            this.sound.playChime();
        } else {
            this.addLog("No loose monomers found. Spawn styrene or ethene first.", false);
        }
        this.setCount(this.world.countAlive());
    }

    public shake(): void {
        const rng = new SeededRandom(this.getSeed() + this.logCounter);
        for (const inst of this.world.getInstanceList()) {
            inst.vx = (rng.next() - 0.5) * 24;
            inst.vy = (rng.next() - 0.5) * 24;
            inst.vz = (rng.next() - 0.5) * 24;
        }
        this.addLog("The chamber shakes.", false);
    }

    public clearWorld(): void {
        this.world.clear();
        this.setCount(0);
        this.addLog("Chamber cleared.", false);
    }

    public togglePause(): void {
        this.setPaused(!this.getPaused());
    }

    public rerollSeed(): void {
        this.setSeed(1 + Math.floor(Math.random() * 100000));
        this.addLog("New seed: " + this.getSeed() + ". Presets will reshuffle.", false);
    }

    public applyPreset(id: string): void {
        const preset = this.presets.find((item) => item.id === id);
        if (preset === undefined) {
            return;
        }
        this.world.clear();
        this.setPresetId(id);
        this.setSeed(preset.seed);
        if (preset.conditions.temperature !== undefined) {
            this.setTemperature(preset.conditions.temperature);
        }
        if (preset.conditions.pressure !== undefined) {
            this.setPressure(preset.conditions.pressure);
        }
        if (preset.conditions.ph !== undefined) {
            this.setPh(preset.conditions.ph);
        }
        if (preset.conditions.viscosity !== undefined) {
            this.setViscosity(preset.conditions.viscosity);
        }
        if (preset.conditions.polarity !== undefined) {
            this.setPolarity(preset.conditions.polarity);
        }
        if (preset.conditions.gravity !== undefined) {
            this.setGravity(preset.conditions.gravity);
        }
        if (preset.conditions.catalyst !== undefined) {
            this.world.params.catalyst = preset.conditions.catalyst;
        }
        this.syncParamsToWorld();
        const rng = new SeededRandom(preset.seed);
        const half = this.world.boxSize * 0.4;
        for (const spawn of preset.spawns) {
            const record = this.registry.findById(spawn.moleculeId);
            if (record === undefined) {
                continue;
            }
            for (let i = 0; i < spawn.count; i++) {
                const x = (rng.next() - 0.5) * 2 * half;
                const y = (rng.next() - 0.5) * 2 * half;
                const z = (rng.next() - 0.5) * 2 * half;
                const speed = 2 + this.world.params.temperature / 200;
                this.world.spawn(record, x, y, z, speed);
                if (this.world.countAlive() >= MAX_INSTANCES) {
                    break;
                }
            }
        }
        this.setCount(this.world.countAlive());
        this.addLog("Preset live: " + preset.name + ". " + preset.description + ".", true);
        this.sound.playChime();
        this.writeHash();
    }

    public spawnShowcase(): void {
        const ids = [
            "caffeine",
            "benzene",
            "water",
            "glucose",
            "atp",
            "dopamine",
            "c60",
            "aspirin",
            "methane",
            "oxygen",
        ];
        const rng = new SeededRandom(42);
        const half = this.world.boxSize * 0.4;
        for (const id of ids) {
            const record = this.registry.findById(id);
            if (record === undefined) {
                continue;
            }
            const count = id === "water" || id === "oxygen" ? 6 : 2;
            for (let i = 0; i < count; i++) {
                this.world.spawn(
                    record,
                    (rng.next() - 0.5) * 2 * half,
                    (rng.next() - 0.5) * 2 * half,
                    (rng.next() - 0.5) * 2 * half,
                    3,
                );
            }
        }
        this.setCount(this.world.countAlive());
        this.addLog("Welcome to Molecule Forge. Pick a card, then click the canvas.", true);
    }

    public writeHash(): void {
        const counts = new Map<string, number>();
        for (const inst of this.world.getInstanceList()) {
            counts.set(inst.record.id, (counts.get(inst.record.id) ?? 0) + 1);
        }
        const spawns = Array.from(counts.entries()).map(([id, count]) => ({ id, count }));
        const hash = SnapshotCodec.encode({
            version: 1,
            preset: this.getPresetId(),
            seed: this.getSeed(),
            temperature: this.getTemperature(),
            pressure: this.getPressure(),
            ph: this.getPh(),
            viscosity: this.getViscosity(),
            polarity: this.getPolarity(),
            gravity: this.getGravity(),
            spawns,
        });
        window.location.hash = hash;
    }

    public copySnapshot(): void {
        this.writeHash();
        const url = window.location.href;
        if (navigator.clipboard !== undefined) {
            void navigator.clipboard.writeText(url).then(() => {
                this.addLog("Snapshot URL copied. Share it anywhere.", false);
            });
        } else {
            this.addLog("Snapshot saved in the address bar.", false);
        }
    }

    public attemptBond(
        instanceId: number,
        atomIndex: number,
        x: number,
        y: number,
        z: number,
    ): void {
        const previous = this.getSelectedAtom();
        const inst = this.world.findById(instanceId);
        if (inst === undefined) {
            return;
        }
        if (previous === null || previous.instanceId === instanceId) {
            this.setSelectedAtom({ instanceId, atomIndex });
            this.addLog(
                "Atom selected on " + inst.record.name + ". Click another atom to bond.",
                false,
            );
            return;
        }
        const other = this.world.findById(previous.instanceId);
        if (other === undefined) {
            this.setSelectedAtom({ instanceId, atomIndex });
            return;
        }
        this.setSelectedAtom(null);
        this.effects.arrow(x, y, z);
        this.addLog(
            "Bond attempt between " +
                other.record.name +
                " and " +
                inst.record.name +
                ": valence check passed in the toy model.",
            true,
        );
        this.sound.playBlip();
    }

    public updateHud(fps: number, quality: number): void {
        this.setFps(Math.round(fps));
        this.setQuality(quality);
        this.setCount(this.world.countAlive());
    }
}
