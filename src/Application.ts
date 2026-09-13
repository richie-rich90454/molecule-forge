import { render } from "solid-js/web";
import { SoundEngine } from "./audio/SoundEngine";
import { MoleculeFactory } from "./chem/MoleculeFactory";
import { MoleculeRegistry } from "./chem/MoleculeRegistry";
import { PresetCatalog } from "./presets/PresetCatalog";
import { FramePacer } from "./render/FramePacer";
import { Renderer } from "./render/Renderer";
import { CoulombCalculator } from "./sim/CoulombCalculator";
import { HydrogenBondCalculator } from "./sim/HydrogenBondCalculator";
import { LennardJonesCalculator } from "./sim/LennardJonesCalculator";
import { ReactionCatalog } from "./sim/ReactionCatalog";
import { ReactionEngine } from "./sim/ReactionEngine";
import { SeededRandom } from "./sim/SeededRandom";
import { World } from "./sim/World";
import { PhysicsEngine } from "./sim/PhysicsEngine";
import { SnapshotCodec } from "./state/SnapshotCodec";
import { AppShell } from "./ui/AppShell";
import { AppViewModel, type IEffectSink } from "./ui/AppViewModel";

export class Application implements IEffectSink {
    private readonly root: HTMLElement;
    private readonly registry: MoleculeRegistry;
    private readonly world: World;
    private readonly engine: PhysicsEngine;
    private readonly reactions: ReactionEngine;
    private readonly sound: SoundEngine;
    private readonly vm: AppViewModel;
    private readonly simRng: SeededRandom;
    private renderer: Renderer | null;
    private running: boolean;
    private lastHud: number;
    private lastQualityLevel: number;
    private timeDebt: number;
    private reactionTick: number;
    private pointerDown: { x: number; y: number; button: number; moved: boolean } | null;
    private lastPaint: number;

    public constructor(root: HTMLElement) {
        this.root = root;
        const factory = new MoleculeFactory();
        this.registry = new MoleculeRegistry(factory);
        this.engine = new PhysicsEngine(
            [
                new LennardJonesCalculator(2.2, 3),
                new CoulombCalculator(60, 20),
                new HydrogenBondCalculator(3, 3.5),
            ],
            {
                temperature: 298,
                pressure: 1,
                ph: 7,
                viscosity: 0.2,
                polarity: 0.5,
                gravity: 0,
                timeScale: 1,
                bondStrength: 1,
                radiation: 0,
                catalyst: 0,
                spark: 0,
            },
        );
        this.world = new World(this.engine, 1101);
        this.reactions = new ReactionEngine(ReactionCatalog.buildRules(), this.registry);
        this.sound = new SoundEngine();
        this.vm = new AppViewModel(this.registry, this.world, this.sound, this);
        this.vm.initialize();
        this.simRng = new SeededRandom(1101);
        this.renderer = null;
        this.running = false;
        this.lastHud = 0;
        this.lastQualityLevel = 0;
        this.timeDebt = 0;
        this.reactionTick = 0;
        this.pointerDown = null;
        this.lastPaint = 0;
    }

    public getViewModel(): AppViewModel {
        return this.vm;
    }

    public start(): void {
        render(
            () =>
                AppShell({
                    vm: this.vm,
                    callbacks: {
                        onCanvasMount: (element: HTMLElement) => {
                            this.attachCanvas(element);
                        },
                        onResetCamera: () => {
                            /* v8 ignore next -- only fires from the mounted shell, where the renderer is attached */
                            if (this.renderer !== null) {
                                this.renderer.getController().reset();
                            }
                        },
                        onControlsChange: () => {
                            this.applyControls();
                        },
                    },
                }),
            this.root,
        );
        this.initializeScene();
        this.running = true;
        const loop = (now: number): void => {
            if (!this.running) {
                return;
            }
            this.frame(now);
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    public stop(): void {
        this.running = false;
    }

    public flash(x: number, y: number, z: number, color: string, size: number): void {
        if (this.renderer !== null) {
            this.renderer.getEffects().spawnFlash(x, y, z, color, size);
        }
    }

    public burst(x: number, y: number, z: number, kind: string, seed: number): void {
        if (this.renderer !== null) {
            this.renderer.getEffects().spawnBurst(x, y, z, kind, seed);
        }
    }

    public arrow(x: number, y: number, z: number): void {
        if (this.renderer !== null && this.vm.getShowArrows()) {
            this.renderer.getEffects().showArrow(x, y, z);
        }
    }

    private attachCanvas(element: HTMLElement): void {
        if (this.renderer !== null) {
            return;
        }
        if (element === undefined || element === null) {
            return;
        }
        this.renderer = new Renderer(element);
        this.applyControls();
        const canvas = this.renderer.getCanvas();
        canvas.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });
        canvas.addEventListener("pointerdown", (event) => {
            this.pointerDown = {
                x: event.clientX,
                y: event.clientY,
                button: event.button,
                moved: false,
            };
            canvas.setPointerCapture(event.pointerId);
        });
        canvas.addEventListener("pointermove", (event) => {
            if (this.pointerDown === null || this.renderer === null) {
                return;
            }
            const tool = this.vm.getTool();
            const dx = event.clientX - this.pointerDown.x;
            const dy = event.clientY - this.pointerDown.y;
            if (Math.sqrt(dx * dx + dy * dy) > 6) {
                this.pointerDown.moved = true;
            }
            if (tool === "erase" && this.pointerDown.button === 0 && event.buttons === 1) {
                const now = performance.now();
                if (now - this.lastPaint > 83) {
                    this.lastPaint = now;
                    const hit = this.renderer.pickAtom(
                        event.clientX,
                        event.clientY,
                        this.world.getInstanceList(),
                        30,
                    );
                    if (hit !== null) {
                        this.vm.removeAt(hit.instance.id);
                    }
                }
                return;
            }
            if (
                tool === "place" &&
                this.pointerDown.moved &&
                this.pointerDown.button === 0 &&
                event.buttons === 1
            ) {
                const now = performance.now();
                if (now - this.lastPaint > 83) {
                    this.lastPaint = now;
                    const point = this.renderer.screenToWorld(event.clientX, event.clientY, 30);
                    this.vm.spawnSelected(point.x, point.y, point.z);
                }
            }
        });
        canvas.addEventListener("pointerup", (event) => {
            const info = this.pointerDown;
            this.pointerDown = null;
            if (info === null || info.moved || this.renderer === null) {
                return;
            }
            const tool = this.vm.getTool();
            if (info.button === 2 || tool === "erase") {
                const hit = this.renderer.pickAtom(
                    event.clientX,
                    event.clientY,
                    this.world.getInstanceList(),
                    30,
                );
                if (hit !== null) {
                    this.vm.removeAt(hit.instance.id);
                }
                return;
            }
            if (info.button !== 0) {
                return;
            }
            if (tool === "orbit") {
                const hit = this.renderer.pickAtom(
                    event.clientX,
                    event.clientY,
                    this.world.getInstanceList(),
                    22,
                );
                if (hit !== null) {
                    const point = this.renderer.screenToWorld(event.clientX, event.clientY, 30);
                    this.vm.attemptBond(hit.instance.id, hit.atomIndex, point.x, point.y, point.z);
                }
                return;
            }
            if (tool === "place") {
                const point = this.renderer.screenToWorld(event.clientX, event.clientY, 30);
                this.vm.spawnSelected(point.x, point.y, point.z);
            }
        });
    }

    private applyControls(): void {
        if (this.renderer === null) {
            return;
        }
        this.vm.syncParamsToWorld();
        this.renderer.setShowBonds(this.vm.getShowBonds());
        this.renderer.setShowOrbitals(this.vm.getShowOrbitals());
        this.renderer.setShowGraph(this.vm.getShowGraph());
        this.renderer.setGridVisible(this.vm.getShowGrid());
        this.renderer.setChargeGlow(this.vm.getShowCharges() ? 1 : 0);
        this.renderer.setHaloEnabled(this.vm.getBloom());
        this.renderer.getQuality().setManualBloom(this.vm.getBloom());
        this.sound.setEnabled(this.vm.getSoundOn());
        this.renderer.resize();
    }

    private initializeScene(): void {
        const snapshot = SnapshotCodec.decode(window.location.hash);
        if (snapshot !== null && (snapshot.spawns.length > 0 || snapshot.preset !== "")) {
            this.applySnapshot(snapshot);
            return;
        }
        this.vm.spawnShowcase();
    }

    private applySnapshot(snapshot: {
        preset: string;
        seed: number;
        temperature: number;
        pressure: number;
        ph: number;
        viscosity: number;
        polarity: number;
        gravity: number;
        spawns: ReadonlyArray<{ id: string; count: number }>;
    }): void {
        if (snapshot.preset !== "") {
            const presets = PresetCatalog.buildPresets();
            if (presets.some((preset) => preset.id === snapshot.preset)) {
                this.vm.applyPreset(snapshot.preset);
                return;
            }
        }
        this.world.clear();
        this.vm.setSeed(snapshot.seed);
        this.vm.setTemperature(snapshot.temperature);
        this.vm.setPressure(snapshot.pressure);
        this.vm.setPh(snapshot.ph);
        this.vm.setViscosity(snapshot.viscosity);
        this.vm.setPolarity(snapshot.polarity);
        this.vm.setGravity(snapshot.gravity);
        this.vm.syncParamsToWorld();
        const rng = new SeededRandom(snapshot.seed);
        const half = this.world.boxSize * 0.4;
        for (const spawn of snapshot.spawns) {
            const record = this.registry.findById(spawn.id);
            if (record === undefined) {
                continue;
            }
            for (let i = 0; i < Math.min(spawn.count, 60); i++) {
                this.world.spawn(
                    record,
                    (rng.next() - 0.5) * 2 * half,
                    (rng.next() - 0.5) * 2 * half,
                    (rng.next() - 0.5) * 2 * half,
                    3,
                );
            }
        }
        this.vm.addLog("Snapshot restored from the address bar.", true);
    }

    private frame(nowMs: number): void {
        if (this.renderer === null) {
            return;
        }
        this.renderer.getController().setNavigationEnabled(this.vm.getTool() === "orbit");
        const pacer = this.renderer.getPacer();
        const steps = pacer.begin(nowMs);
        const frameDt = Math.min(0.05, pacer.getAverageFrameMs() / 1000 + 0.001);
        if (!this.vm.getPaused()) {
            this.timeDebt += steps * this.world.params.timeScale;
            let budgeted = Math.floor(this.timeDebt);
            this.timeDebt -= budgeted;
            if (budgeted > 0) {
                this.world.snapshotPrevious();
                while (budgeted > 0) {
                    this.world.step(FramePacer.STEP_DT, this.simRng);
                    this.reactionTick++;
                    if (this.reactionTick % 12 === 0) {
                        this.reactions.update(this.world, this.simRng, this.vm);
                    }
                    budgeted--;
                    if (this.world.countAlive() === 0) {
                        break;
                    }
                }
            }
        }
        this.renderer.renderFrame(
            this.world.getInstanceList(),
            pacer.alpha,
            frameDt,
            this.world.params.temperature,
        );
        const quality = this.renderer.getQuality();
        quality.update(pacer.getAverageFrameMs(), frameDt);
        if (quality.getLevel() !== this.lastQualityLevel) {
            this.lastQualityLevel = quality.getLevel();
            this.renderer.resize();
        }
        if (nowMs - this.lastHud > 250) {
            this.lastHud = nowMs;
            this.vm.updateHud(pacer.getFps(), quality.getLevel());
        }
    }
}
