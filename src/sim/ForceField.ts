export interface IForceFieldConfig {
    readonly ljEpsilon: number;
    readonly ljCutoffScale: number;
    readonly coulombStrength: number;
    readonly coulombCutoff: number;
    readonly hbStrength: number;
    readonly hbDistance: number;
    readonly cutoff: number;
}

export interface IForceFieldInput {
    readonly positions: Float64Array;
    readonly radii: Float64Array;
    readonly charges: Float64Array;
    readonly donors: Float64Array;
    readonly acceptors: Float64Array;
    readonly masses: Float64Array;
    readonly maxRadius: number;
    readonly hasDonor: boolean;
    readonly hasAcceptor: boolean;
    readonly bondStrength: number;
    readonly polarity: number;
    readonly outForces: Float64Array;
}

export interface IWasmForceModule {
    compute_forces(
        positions: Float64Array,
        radii: Float64Array,
        charges: Float64Array,
        donors: Float64Array,
        acceptors: Float64Array,
        masses: Float64Array,
        maxRadius: number,
        hasDonor: boolean,
        hasAcceptor: boolean,
        epsilon: number,
        ljCutoffScale: number,
        coulombStrength: number,
        coulombCutoff: number,
        dielectric: number,
        hbStrength: number,
        hbDistance: number,
        cutoff: number,
        outForces: Float64Array,
    ): void;
}

export interface IForceFieldBackend {
    compute(input: IForceFieldInput): void;
}

export const DEFAULT_FORCE_FIELD_CONFIG: IForceFieldConfig = {
    ljEpsilon: 2.2,
    ljCutoffScale: 3,
    coulombStrength: 60,
    coulombCutoff: 20,
    hbStrength: 3,
    hbDistance: 3.5,
    cutoff: 10,
};

export class WasmForceField implements IForceFieldBackend {
    private readonly module: IWasmForceModule;
    private readonly config: IForceFieldConfig;

    public constructor(module: IWasmForceModule, config: IForceFieldConfig) {
        this.module = module;
        this.config = config;
    }

    public compute(input: IForceFieldInput): void {
        this.module.compute_forces(
            input.positions,
            input.radii,
            input.charges,
            input.donors,
            input.acceptors,
            input.masses,
            input.maxRadius,
            input.hasDonor,
            input.hasAcceptor,
            this.config.ljEpsilon * input.bondStrength,
            this.config.ljCutoffScale,
            this.config.coulombStrength,
            this.config.coulombCutoff,
            1 + input.polarity * 40,
            this.config.hbStrength,
            this.config.hbDistance,
            this.config.cutoff,
            input.outForces,
        );
    }

    public static isSupported(): boolean {
        return (
            typeof WebAssembly === "object" &&
            WebAssembly !== null &&
            typeof WebAssembly.instantiate === "function"
        );
    }

    public static async load(
        loader: () => Promise<IWasmForceModule | null>,
        config: IForceFieldConfig,
    ): Promise<WasmForceField | null> {
        if (!WasmForceField.isSupported()) {
            return null;
        }
        try {
            const module = await loader();
            return module === null ? null : new WasmForceField(module, config);
        } catch (error) {
            void error;
            return null;
        }
    }
}
