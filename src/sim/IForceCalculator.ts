export interface ISimParams {
    temperature: number;
    pressure: number;
    ph: number;
    viscosity: number;
    polarity: number;
    gravity: number;
    timeScale: number;
    bondStrength: number;
    radiation: number;
    catalyst: number;
    spark: number;
}

export interface IPairInput {
    readonly ax: number;
    readonly ay: number;
    readonly az: number;
    readonly bx: number;
    readonly by: number;
    readonly bz: number;
    readonly dist: number;
    readonly aRadius: number;
    readonly bRadius: number;
    readonly aCharge: number;
    readonly bCharge: number;
    readonly aDonors: number;
    readonly aAcceptors: number;
    readonly bDonors: number;
    readonly bAcceptors: number;
    readonly params: ISimParams;
}

export interface IForceCalculator {
    getName(): string;
    computeMagnitude(input: IPairInput): number;
}

export type MutablePairInput = {
    -readonly [K in keyof IPairInput]: IPairInput[K];
};

export class SimParamsFactory {
    public static createDefault(): ISimParams {
        return {
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
        };
    }
}
