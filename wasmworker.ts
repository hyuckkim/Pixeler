import * as rust from "./pkg/hello_wasm.js";
rust.default();

onmessage = function(e) {
    const img : ImageData = e.data[0];
    const pixelno : number = e.data[1];
    const dithering : number = e.data[2];
    
    var quantized = rust.quantize(img.data, img.width, img.height, pixelno, dithering);
    this.postMessage(quantized);
}