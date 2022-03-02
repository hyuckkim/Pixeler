/* tslint:disable */
/* eslint-disable */
/**
* @returns {number}
*/
export function ten(): number;
/**
* @param {Uint8ClampedArray} rawimage
* @param {number} image_width
* @param {number} image_height
* @param {number} num_color
* @param {number} dithering
* @returns {Uint8ClampedArray}
*/
export function quantize(rawimage: Uint8ClampedArray, image_width: number, image_height: number, num_color: number, dithering: number): Uint8ClampedArray;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly ten: () => number;
  readonly quantize: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly __wbindgen_free: (a: number, b: number) => void;
  readonly __wbindgen_malloc: (a: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number) => number;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
