import { BlobTool } from "./BlobTool.js";
import { CanvasUI } from "./CanvasUI.js";
import { LoadPictureUI } from "./LoadPictureUI.js";
import { QuantizeUI } from "./QuantizeUI.js";
import { RecolorUI } from "./RecolorUI.js";
import * as rust from "./pkg/palette_png.js";
rust.default();

const canvasUIElement = document.querySelector("#pic");
const canvasUI = canvasUIElement instanceof HTMLCanvasElement
    ? new CanvasUI(canvasUIElement)
    : undefined;

const loadPictureUIDiv = document.querySelector('#menu_loadpicture');
const loadPictureUI = loadPictureUIDiv instanceof HTMLDivElement
    ? new LoadPictureUI(loadPictureUIDiv, (name, palette) => {
        recolorUI?.SetName(name);

        BlobTool.setUItoImage(BlobTool.url);
    
        loadPictureUI?.Hide();
        quantizeUI?.Show();
        canvasUI?.Show();

        if (palette !== undefined) {
            recolorUI?.SetColors(palette);
            recolorUI?.Show();
        }
    })
    : undefined;

const quantizeUIDiv = document.querySelector("#menu_quantize");
const quantizeUI = quantizeUIDiv instanceof HTMLDivElement
    ? new QuantizeUI(quantizeUIDiv, (blob, colors) => {
        recolorUI?.SetColors(colors);
        recolorUI?.Show();

        BlobTool.setUItoImage(BlobTool.createUrl(blob));
        BlobTool.UpdateImage();
    })
    : undefined;

const RecolorUIDiv = document.querySelector("#menu_palette");
const recolorUI = RecolorUIDiv instanceof HTMLDivElement
    ? new RecolorUI(RecolorUIDiv, "palette.png")
    : undefined;