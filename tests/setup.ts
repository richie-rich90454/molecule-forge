class FakeResizeObserver {
    public observe(): void {}
    public unobserve(): void {}
    public disconnect(): void {}
}

interface ITestGlobals {
    ResizeObserver: unknown;
    requestAnimationFrame?: unknown;
    cancelAnimationFrame?: unknown;
    __flushAnimationFrames?: unknown;
}

const testGlobals = globalThis as unknown as ITestGlobals;
testGlobals.ResizeObserver = FakeResizeObserver;

if (typeof globalThis.requestAnimationFrame === "undefined") {
    let nextId = 1;
    const callbacks = new Map<number, FrameRequestCallback>();
    testGlobals.requestAnimationFrame = (callback: FrameRequestCallback): number => {
        const id = nextId++;
        callbacks.set(id, callback);
        return id;
    };
    testGlobals.cancelAnimationFrame = (id: number): void => {
        callbacks.delete(id);
    };
    testGlobals.__flushAnimationFrames = (now: number): void => {
        const pending = Array.from(callbacks.values());
        callbacks.clear();
        for (const callback of pending) {
            callback(now);
        }
    };
}
