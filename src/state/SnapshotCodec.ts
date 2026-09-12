export interface ISnapshotSpawn {
    readonly id: string;
    readonly count: number;
}

export interface ISnapshot {
    readonly version: number;
    readonly preset: string;
    readonly seed: number;
    readonly temperature: number;
    readonly pressure: number;
    readonly ph: number;
    readonly viscosity: number;
    readonly polarity: number;
    readonly gravity: number;
    readonly spawns: ReadonlyArray<ISnapshotSpawn>;
}

export class SnapshotCodec {
    public static encode(snapshot: ISnapshot): string {
        const parts: string[] = [];
        parts.push("v" + snapshot.version);
        parts.push("p" + snapshot.preset);
        parts.push("s" + snapshot.seed);
        parts.push("t" + Math.round(snapshot.temperature));
        parts.push("r" + snapshot.pressure.toFixed(2));
        parts.push("h" + snapshot.ph.toFixed(1));
        parts.push("v" + snapshot.viscosity.toFixed(2));
        parts.push("o" + snapshot.polarity.toFixed(2));
        parts.push("g" + snapshot.gravity.toFixed(2));
        for (const spawn of snapshot.spawns) {
            parts.push(spawn.id + "x" + spawn.count);
        }
        const text = parts.join(";");
        return SnapshotCodec.toBase64Url(text);
    }

    public static decode(hash: string): ISnapshot | null {
        try {
            const clean = hash.startsWith("#") ? hash.substring(1) : hash;
            if (clean.length === 0) {
                return null;
            }
            const text = SnapshotCodec.fromBase64Url(clean);
            const parts = text.split(";");
            const snapshot: {
                version: number;
                preset: string;
                seed: number;
                temperature: number;
                pressure: number;
                ph: number;
                viscosity: number;
                polarity: number;
                gravity: number;
                spawns: ISnapshotSpawn[];
            } = {
                version: 1,
                preset: "",
                seed: 1,
                temperature: 298,
                pressure: 1,
                ph: 7,
                viscosity: 0.2,
                polarity: 0.5,
                gravity: 0,
                spawns: [],
            };
            for (const part of parts) {
                if (part.startsWith("v") && snapshot.spawns.length === 0 && part.indexOf("x") < 0) {
                    const first = part;
                    if (/^v\d+$/.test(first)) {
                        snapshot.version = parseInt(first.substring(1), 10);
                        continue;
                    }
                }
                if (part.startsWith("p") && !part.includes("x")) {
                    snapshot.preset = part.substring(1);
                } else if (part.startsWith("s") && !part.includes("x")) {
                    snapshot.seed = parseInt(part.substring(1), 10) || 1;
                } else if (part.startsWith("t") && !part.includes("x")) {
                    snapshot.temperature = parseFloat(part.substring(1)) || 298;
                } else if (part.startsWith("r")) {
                    snapshot.pressure = parseFloat(part.substring(1)) || 1;
                } else if (part.startsWith("h")) {
                    snapshot.ph = parseFloat(part.substring(1)) || 7;
                } else if (part.startsWith("o")) {
                    snapshot.polarity = parseFloat(part.substring(1)) || 0.5;
                } else if (part.startsWith("g")) {
                    snapshot.gravity = parseFloat(part.substring(1)) || 0;
                } else if (part.includes("x")) {
                    const at = part.lastIndexOf("x");
                    const id = part.substring(0, at);
                    const count = parseInt(part.substring(at + 1), 10) || 0;
                    if (id.length > 0 && count > 0 && count < 500) {
                        snapshot.spawns.push({ id, count });
                    }
                } else if (/^v[\d.]+$/.test(part)) {
                    snapshot.viscosity = parseFloat(part.substring(1)) || 0.2;
                }
            }
            return snapshot;
        } catch (error) {
            void error;
            return null;
        }
    }

    private static toBase64Url(text: string): string {
        const bytes = new TextEncoder().encode(text);
        let binary = "";
        for (const byte of bytes) {
            binary += String.fromCharCode(byte);
        }
        return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    private static fromBase64Url(encoded: string): string {
        let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4 !== 0) {
            base64 += "=";
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    }
}
