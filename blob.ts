import { BlobTool } from "./BlobTool.js";
import { CanvasUI } from "./CanvasUI.js";
import { LoadPictureUI } from "./LoadPictureUI.js";
import { QuantizeUI } from "./QuantizeUI.js";
import { RecolorUI } from "./RecolorUI.js";
import { ResizeUI } from "./ResizeUI.js";
import * as rust from "./pkg/palette_png.js";
rust.default();

const canvasUIElement = document.querySelector("#menu_canvas");
const canvasUI = canvasUIElement instanceof HTMLDivElement
    ? new CanvasUI(canvasUIElement)
    : undefined;

const loadPictureUIDiv = document.querySelector('#menu_loadpicture');
const loadPictureUI = loadPictureUIDiv instanceof HTMLDivElement
    ? new LoadPictureUI(loadPictureUIDiv, async (name, palette) => {
        recolorUI?.SetName(name);

        await BlobTool.setUItoImage(BlobTool.url);
    
        loadPictureUI?.Hide();
        quantizeUI?.Show();
        canvasUI?.Show();
        
        const img = await BlobTool.GetImage();
        if (img instanceof HTMLImageElement && resizeUI !== undefined) {
            resizeUI.Show();
            resizeUI.SetSize(img.width, img.height);
            canvasUI?.AddStrokeRect(position);
        }

        if (palette !== undefined) {
            recolorUI?.SetColors(palette);
            recolorUI?.Show();
        }
    })
    : undefined;

export const position = () => { 
    return resizeUI?.GetPositions() 
    ?? {x: 0, y: 0, dx: 0, dy: 0, w: 0, h: 0} };

const resizeUIDiv = document.querySelector("#menu_resize");
const resizeUI = resizeUIDiv instanceof HTMLDivElement
    ? new ResizeUI(resizeUIDiv)
    : undefined;

const quantizeUIDiv = document.querySelector("#menu_quantize");
const quantizeUI = quantizeUIDiv instanceof HTMLDivElement
    ? new QuantizeUI(quantizeUIDiv, (blob, colors) => {
        recolorUI?.SetColors(colors);
        recolorUI?.Show();
        canvasUI?.RemoveStrokeRect(position);

        BlobTool.setUItoImage(BlobTool.createUrl(blob));
        BlobTool.UpdateImage();
    })
    : undefined;

const RecolorUIDiv = document.querySelector("#menu_palette");
const recolorUI = RecolorUIDiv instanceof HTMLDivElement
    ? new RecolorUI(RecolorUIDiv, "palette.png")
    : undefined;