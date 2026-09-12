export class SoundEngine {
    private context: AudioContext | null;
    private enabled: boolean;
    private master: GainNode | null;

    public constructor() {
        this.context = null;
        this.enabled = false;
        this.master = null;
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (enabled) {
            this.ensureContext();
        }
    }

    public playPop(): void {
        if (!this.ensureReady()) {
            return;
        }
        this.tone(520, 0.09, 0.12, "sine");
    }

    public playBlip(): void {
        if (!this.ensureReady()) {
            return;
        }
        this.tone(740, 0.07, 0.1, "triangle");
    }

    public playWhoosh(): void {
        if (!this.ensureReady()) {
            return;
        }
        this.tone(220, 0.25, 0.14, "sawtooth");
        this.tone(330, 0.2, 0.1, "triangle");
    }

    public playBoom(): void {
        if (!this.ensureReady()) {
            return;
        }
        this.tone(70, 0.5, 0.3, "sawtooth");
        this.noise(0.4, 0.25);
    }

    public playChime(): void {
        if (!this.ensureReady()) {
            return;
        }
        this.tone(660, 0.12, 0.1, "sine");
        window.setTimeout(() => {
            this.tone(880, 0.16, 0.1, "sine");
        }, 110);
    }

    private ensureReady(): boolean {
        if (!this.enabled) {
            return false;
        }
        return this.ensureContext();
    }

    private ensureContext(): boolean {
        if (this.context !== null) {
            if (this.context.state === "suspended") {
                void this.context.resume();
            }
            return true;
        }
        try {
            const ctor = window.AudioContext !== undefined ? window.AudioContext : null;
            if (ctor === null) {
                return false;
            }
            this.context = new ctor();
            this.master = this.context.createGain();
            this.master.gain.value = 0.5;
            this.master.connect(this.context.destination);
            return true;
        } catch (error) {
            void error;
            return false;
        }
    }

    private tone(frequency: number, duration: number, volume: number, kind: OscillatorType): void {
        if (this.context === null || this.master === null) {
            return;
        }
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = kind;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(volume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start();
        osc.stop(this.context.currentTime + duration);
    }

    private noise(duration: number, volume: number): void {
        if (this.context === null || this.master === null) {
            return;
        }
        const length = Math.floor(this.context.sampleRate * duration);
        const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / length);
        }
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        const gain = this.context.createGain();
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(this.master);
        source.start();
    }
}
