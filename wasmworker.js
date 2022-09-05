import * as rust from "./pkg/palette_png.js";
rust.default();
onmessage = function (e) {
    const img = e.data[0];
    const pixelno = e.data[1];
    const dithering = e.data[2];
    var quantized = rust.quantize(img.data, img.width, img.height, pixelno, dithering);
    this.postMessage(quantized);
};
