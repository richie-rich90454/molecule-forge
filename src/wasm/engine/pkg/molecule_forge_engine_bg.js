export class EngineHandle {
    static __wrap(ptr) {
        const obj = Object.create(EngineHandle.prototype);
        obj.__wbg_ptr = ptr;
        EngineHandleFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EngineHandleFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_enginehandle_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    body_count() {
        const ret = wasm.enginehandle_body_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {EngineHandle}
     */
    static new() {
        const ret = wasm.enginehandle_new();
        return EngineHandle.__wrap(ret);
    }
    /**
     * @param {Float64Array} positions
     * @param {Float64Array} radii
     * @param {Float64Array} charges
     * @param {Float64Array} donors
     * @param {Float64Array} acceptors
     * @param {number} epsilon
     * @param {number} dielectric
     * @param {number} cutoff
     * @param {number} hb_strength
     * @param {number} hb_distance
     * @param {Float64Array} out_forces
     */
    step_forces(positions, radii, charges, donors, acceptors, epsilon, dielectric, cutoff, hb_strength, hb_distance, out_forces) {
        const ptr0 = passArrayF64ToWasm0(positions, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArrayF64ToWasm0(radii, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArrayF64ToWasm0(charges, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ptr3 = passArrayF64ToWasm0(donors, wasm.__wbindgen_malloc);
        const len3 = WASM_VECTOR_LEN;
        const ptr4 = passArrayF64ToWasm0(acceptors, wasm.__wbindgen_malloc);
        const len4 = WASM_VECTOR_LEN;
        var ptr5 = passArrayF64ToWasm0(out_forces, wasm.__wbindgen_malloc);
        var len5 = WASM_VECTOR_LEN;
        wasm.enginehandle_step_forces(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, epsilon, dielectric, cutoff, hb_strength, hb_distance, ptr5, len5, out_forces);
    }
}
if (Symbol.dispose) EngineHandle.prototype[Symbol.dispose] = EngineHandle.prototype.free;

/**
 * Computes pairwise forces with the same logic as the TypeScript engine:
 * a packed grid, a per-instance adaptive query range, and a per-pair range
 * cull before each force evaluation. Buffers are reused across calls.
 * @param {Float64Array} positions
 * @param {Float64Array} radii
 * @param {Float64Array} charges
 * @param {Float64Array} donors
 * @param {Float64Array} acceptors
 * @param {Float64Array} masses
 * @param {number} max_radius
 * @param {boolean} has_donor
 * @param {boolean} has_acceptor
 * @param {number} epsilon
 * @param {number} lj_cutoff_scale
 * @param {number} coulomb_strength
 * @param {number} coulomb_cutoff
 * @param {number} dielectric
 * @param {number} hb_strength
 * @param {number} hb_distance
 * @param {number} cutoff
 * @param {number} cell_size
 * @param {Float64Array} out_forces
 */
export function compute_forces(positions, radii, charges, donors, acceptors, masses, max_radius, has_donor, has_acceptor, epsilon, lj_cutoff_scale, coulomb_strength, coulomb_cutoff, dielectric, hb_strength, hb_distance, cutoff, cell_size, out_forces) {
    const ptr0 = passArrayF64ToWasm0(positions, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArrayF64ToWasm0(radii, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArrayF64ToWasm0(charges, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passArrayF64ToWasm0(donors, wasm.__wbindgen_malloc);
    const len3 = WASM_VECTOR_LEN;
    const ptr4 = passArrayF64ToWasm0(acceptors, wasm.__wbindgen_malloc);
    const len4 = WASM_VECTOR_LEN;
    const ptr5 = passArrayF64ToWasm0(masses, wasm.__wbindgen_malloc);
    const len5 = WASM_VECTOR_LEN;
    var ptr6 = passArrayF64ToWasm0(out_forces, wasm.__wbindgen_malloc);
    var len6 = WASM_VECTOR_LEN;
    wasm.compute_forces(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4, ptr5, len5, max_radius, has_donor, has_acceptor, epsilon, lj_cutoff_scale, coulomb_strength, coulomb_cutoff, dielectric, hb_strength, hb_distance, cutoff, cell_size, ptr6, len6, out_forces);
}
export function __wbg___wbindgen_copy_to_typed_array_c5728021fabd0236(arg0, arg1, arg2) {
    new Uint8Array(arg2.buffer, arg2.byteOffset, arg2.byteLength).set(getArrayU8FromWasm0(arg0, arg1));
}
export function __wbg___wbindgen_throw_ea4887a5f8f9a9db(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
}
export function __wbindgen_init_externref_table() {
    const table = wasm.__wbindgen_externrefs;
    const offset = table.grow(4);
    table.set(0, undefined);
    table.set(offset + 0, undefined);
    table.set(offset + 1, null);
    table.set(offset + 2, true);
    table.set(offset + 3, false);
}
const EngineHandleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_enginehandle_free(ptr, 1));

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let WASM_VECTOR_LEN = 0;


let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}
