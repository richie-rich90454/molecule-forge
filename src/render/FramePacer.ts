export class FramePacer {
    public static readonly STEP_DT = 1 / 240;
    public static readonly MAX_STEPS = 10;
    public static readonly MAX_FRAME_DELTA = 0.1;

    private lastTime: number;
    private accumulator: number;
    private frameCount: number;
    private fpsWindowStart: number;
    private currentFps: number;
    private frameTimeSum: number;
    private frameTimeCount: number;
    private averageFrameMs: number;
    public alpha: number;

    public constructor() {
        this.lastTime = 0;
        this.accumulator = 0;
        this.frameCount = 0;
        this.fpsWindowStart = 0;
        this.currentFps = 60;
        this.frameTimeSum = 0;
        this.frameTimeCount = 0;
        this.averageFrameMs = 16.7;
        this.alpha = 0;
    }

    public begin(nowMs: number): number {
        if (this.lastTime === 0) {
            this.lastTime = nowMs;
            this.fpsWindowStart = nowMs;
        }
        let delta = (nowMs - this.lastTime) / 1000;
        this.lastTime = nowMs;
        if (delta > FramePacer.MAX_FRAME_DELTA) {
            delta = FramePacer.MAX_FRAME_DELTA;
        }
        if (delta < 0) {
            delta = 0;
        }
        this.frameTimeSum += delta * 1000;
        this.frameTimeCount++;
        this.accumulator += delta;
        let steps = 0;
        while (this.accumulator >= FramePacer.STEP_DT && steps < FramePacer.MAX_STEPS) {
            this.accumulator -= FramePacer.STEP_DT;
            steps++;
        }
        if (steps === FramePacer.MAX_STEPS) {
            this.accumulator = 0;
        }
        this.alpha = this.accumulator / FramePacer.STEP_DT;
        this.frameCount++;
        if (nowMs - this.fpsWindowStart >= 1000) {
            const elapsed = (nowMs - this.fpsWindowStart) / 1000;
            this.currentFps = this.frameCount / elapsed;
            this.averageFrameMs = this.frameTimeSum / Math.max(1, this.frameTimeCount);
            this.frameCount = 0;
            this.frameTimeSum = 0;
            this.frameTimeCount = 0;
            this.fpsWindowStart = nowMs;
        }
        return steps;
    }

    public getFps(): number {
        return this.currentFps;
    }

    public getAverageFrameMs(): number {
        return this.averageFrameMs;
    }

    public reset(): void {
        this.lastTime = 0;
        this.accumulator = 0;
        this.alpha = 0;
    }
}
