export class QualityManager {
    public static readonly MAX_LEVEL = 5;

    private level: number;
    private overBudgetTime: number;
    private underBudgetTime: number;

    public constructor() {
        this.level = 0;
        this.overBudgetTime = 0;
        this.underBudgetTime = 0;
    }

    public getLevel(): number {
        return this.level;
    }

    public isBloomEnabled(): boolean {
        return this.level < 1;
    }

    public getParticleScale(): number {
        return this.level < 2 ? 1 : 0.5;
    }

    public getBondStride(): number {
        return this.level < 2 ? 1 : 2;
    }

    public getPixelRatio(nativeDpr: number): number {
        const capped = Math.min(nativeDpr, 4);
        if (this.level === 0 || this.level === 1) {
            return capped;
        }
        if (this.level === 2) {
            return Math.min(capped, 2);
        }
        if (this.level === 3) {
            return Math.min(capped, 1.5);
        }
        if (this.level === 4) {
            return Math.min(capped, 1.25);
        }
        return 1;
    }

    public update(averageFrameMs: number, dtSeconds: number): void {
        const budget = 12;
        if (averageFrameMs > budget && this.level < QualityManager.MAX_LEVEL) {
            this.overBudgetTime += dtSeconds;
            this.underBudgetTime = 0;
            if (this.overBudgetTime > 1) {
                this.level++;
                this.overBudgetTime = 0;
            }
        } else if (averageFrameMs < budget * 0.5 && this.level > 0) {
            this.underBudgetTime += dtSeconds;
            this.overBudgetTime = 0;
            if (this.underBudgetTime > 4) {
                this.level--;
                this.underBudgetTime = 0;
            }
        } else {
            this.overBudgetTime = 0;
            this.underBudgetTime = 0;
        }
    }

    public setManualBloom(enabled: boolean): void {
        if (!enabled && this.level < 1) {
            this.level = 1;
        } else if (enabled && this.level === 1) {
            this.level = 0;
        }
    }
}
