import { BlobTool } from "./BlobTool.js";
import { LoadPictureUI } from "./LoadPictureUI.js";
import { QuantizeUI } from "./QuantizeUI.js";
import { RecolorUI } from "./RecolorUI.js";
import * as rust from "./pkg/palette_png.js";
rust.default();

const loadPictureUIDiv = document.querySelector('#menu_loadpicture');
const loadPictureUI = loadPictureUIDiv instanceof HTMLDivElement
    ? new LoadPictureUI(loadPictureUIDiv, (name, palette) => {
        recolorUI?.SetName(name);

        BlobTool.setUItoImage(BlobTool.url);
    
        loadPictureUI?.Hide();
        quantizeUI?.Show();
        CanvasLogic.StartDraw();

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


class CanvasLogic {
    public static canvas = document.querySelector('#pic') as HTMLCanvasElement;
    private static ctx: CanvasRenderingContext2D;

    private static dx = 0;
    private static dy = 0;
    private static clicked = false;
    static {
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    }
    public static StartDraw() {
        this.canvas.classList.remove("hidden");
        this.canvas.width = document.body.clientWidth;
        this.canvas.height = document.body.clientHeight;
        setInterval(this.Draw, 34);

        this.canvas.addEventListener('mousedown', this.OnMouseDown);
        this.canvas.addEventListener('mousemove', this.OnMouseMove);
        this.canvas.addEventListener('mouseup', this.OnMouseUp);
        this.canvas.addEventListener('mouseout', this.OnMouseUp);

        this.canvas.addEventListener('touchstart', this.OnHandDown);
        this.canvas.addEventListener('touchmove', this.OnHandMove);
        this.canvas.addEventListener('touechend', this.OnHandUp);
    }
    private static Draw() {
        const self = CanvasLogic;
        const width = document.body.clientWidth, height = document.body.clientHeight;
        self.canvas.width = width;
        self.canvas.height = height;

        self.ctx.beginPath();
        self.ctx.fillStyle = "#aea5a5";
        self.ctx.rect(0, 0, width, height);

        self.ctx.fill();
        const img = BlobTool.GetImage();
        if (img instanceof HTMLImageElement) {
            self.ctx.drawImage(img, (width - img.width) / 2 + self.dx, (height - img.height) / 2 + self.dy);
        }
    }

    private static mouseX = 0;
    private static mouseY = 0;
    private static OnMouseDown(ev: MouseEvent) {
        CanvasLogic.mouseX = ev.clientX;
        CanvasLogic.mouseY = ev.clientY;

        CanvasLogic.clicked = true;
    }
    private static OnMouseMove(ev: MouseEvent) {
        if (CanvasLogic.clicked) {
            CanvasLogic.dx += CanvasLogic.mouseX - ev.clientX;
            CanvasLogic.dy += CanvasLogic.mouseY - ev.clientY;
            
            CanvasLogic.mouseX = ev.clientX;
            CanvasLogic.mouseY = ev.clientY;
        }
    }
    private static OnMouseUp() {
        CanvasLogic.clicked = false;
    }
    private static OnHandDown(ev: TouchEvent) {
        CanvasLogic.mouseX = ev.touches[0].clientX;
        CanvasLogic.mouseY = ev.touches[0].clientY;

        CanvasLogic.clicked = true;
        ev.preventDefault();
    }
    private static OnHandMove(ev: TouchEvent) {
        if (CanvasLogic.clicked) {
            CanvasLogic.dx += CanvasLogic.mouseX - ev.touches[0].clientX;
            CanvasLogic.dy += CanvasLogic.mouseY - ev.touches[0].clientY;
            
            CanvasLogic.mouseX = ev.touches[0].clientX;
            CanvasLogic.mouseY = ev.touches[0].clientY;
        }
        ev.preventDefault();
        return false;
    }
    private static OnHandUp() {
        CanvasLogic.clicked = false;
    }
}