import { BlobTool } from "./BlobTool.js";
import { QuantizeUI } from "./QuantizeUI.js";
import { RecolorUI } from "./RecolorUI.js";
import * as rust from "./pkg/palette_png.js";
rust.default();

const quantizeUIDiv = document.querySelector("#menu_quantize");
let quantizeUI = quantizeUIDiv instanceof HTMLDivElement
    ? new QuantizeUI(quantizeUIDiv, (blob, colors) => {
        if (recolorUI !== undefined) {
            recolorUI.SetColors(colors);
            recolorUI.Show();
        }
        BlobTool.setUItoImage(BlobTool.createUrl(blob));
        BlobTool.UpdateImage();
    })
    : undefined;

const RecolorUIDiv = document.querySelector("#menu_palette");
let recolorUI = RecolorUIDiv instanceof HTMLDivElement
    ? new RecolorUI(RecolorUIDiv, "palette.png")
    : undefined;

class LoadPictureUI {
    private static root = document.querySelector('#menu_loadpicture') as HTMLDivElement;
    private static input = document.querySelector('#menu_loadpicture > #file') as HTMLInputElement;
    private static rorem = document.querySelector('#menu_loadpicture > #rorem') as HTMLInputElement;

    static {
        this.input.onchange = this.handleImage;
        this.rorem.onclick = this.handleRorem;
    }

    static async handleImage() {
        const self = LoadPictureUI;
        if (self.input.files instanceof FileList) {
            const file = self.input.files[0];
            const array = await self.loadBuffer(file);
            const blob = BlobTool.MakeBufferToBlob(array);
            BlobTool.url = BlobTool.createUrl(blob);
    
            imageReady();
            colornizeIfPaletted(array);
            if (recolorUI !== undefined) {
                recolorUI.SetName(`${file.name.split('.')[0]}.png`);
            }
        }
    }
    static async loadBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise(function(resolve, reject) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                if (!(e.target instanceof FileReader)) {
                    reject("data type error");
                    return;
                }
                const result = e.target.result;
    
                if (!(result instanceof ArrayBuffer)) {
                    reject("data type error");
                    return;
                }
                resolve(result);
            }
            reader.onerror = () => reject("network error");
            reader.readAsArrayBuffer(file);
        });
    }

    static async handleRorem() {
        const self = LoadPictureUI;
        self.rorem.disabled = true;
        await self.loadFile(600, 600);
        self.rorem.disabled = false;
    }
    
    static async loadFile(width: number, height: number) {
        const blob = await this.loadXHR(`https://picsum.photos/${width}/${height}`);
        if (!(blob instanceof Blob)) return;

        BlobTool.url = BlobTool.createUrl(blob);
        imageReady();
    }
    static hide() {
        LoadPictureUI.root.classList.add("hidden");
    }
    
    static async loadXHR(lorem: string): Promise<Blob> {
        return new Promise(function(resolve, reject) {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", lorem);
            xhr.responseType = "blob";
            xhr.onerror = function() {reject("Network error.")};
            xhr.onload = function() {
                if (xhr.status === 200) {resolve(xhr.response)}
                else {reject("Loading error:" + xhr.statusText)}
            };
            xhr.send();
        });
    }
}

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
function imageReady() {
    BlobTool.setUItoImage(BlobTool.url);

    LoadPictureUI.hide();

    quantizeUI?.Show();
    CanvasLogic.StartDraw();
}
function colornizeIfPaletted(data: ArrayBuffer) {
    const colors = rust.read_palette(new Uint8ClampedArray(data));
    if (colors.length != 0 && recolorUI !== undefined) {
        recolorUI.SetColors(splitColors(colors));
        recolorUI.Show();
    }
}

export function splitColors(data: Uint8ClampedArray): Array<string> {
    return Array.from({ length: data.length / 3 }, (_, i) => {
        const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
        return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    });
}