import * as rust from "./pkg/palette_png.js";
rust.default();

var newName = "palette.png";

class LoadPictureUI {
    private static root = document.querySelector('#menu_loadpicture') as HTMLDivElement;
    private static input = document.querySelector('#menu_loadpicture > input.file') as HTMLInputElement;
    private static rorem = document.querySelector('#menu_loadpicture > input.rorem') as HTMLInputElement;

    static {
        this.input.onchange = this.loadImage;
        this.rorem.onclick = this.loadRorem;

    }

    static loadImage() {
        const self = LoadPictureUI;
        if (self.input.files instanceof FileList) {
            var file = self.input.files[0];
            self.readFileAndCallback(file, self.readFile);
            newName = makeNewName(file.name);
        }
    }
    static readFileAndCallback(file: File, callback: (this: FileReader, ev: ProgressEvent<FileReader>) => any) {
        var reader = new FileReader();
        reader.addEventListener('load', callback);
        reader.readAsArrayBuffer(file);
    }
    static async readFile(event: ProgressEvent<FileReader>) {
        if (event.target instanceof FileReader && event.target.result instanceof ArrayBuffer) {
            var result = event.target.result;
    
            var blob = BlobTool.MakeBufferToBlob(result);
            BlobTool.url = createUrl(blob);
    
            imageReady();
            colornizeIfPaletted(result);
        }
    }

    static async loadRorem() {
        LoadPictureUI.rorem.disabled = true;
        await LoadPictureUI.loadFile(600, 600);
        LoadPictureUI.rorem.disabled = false;
    }
    
    static async loadFile(width: number, height: number) {
        var blob = await loadXHR(`https://picsum.photos/${width}/${height}`).then((response: any) => {
            return response;
        });
        BlobTool.url = createUrl(blob);
        imageReady();
    }
    static hide() {
        LoadPictureUI.root.style.display = "none";
    }
}

(document.querySelector('#plusbutton') as HTMLInputElement).addEventListener('click', function() {
    QuantizeUI.ModifyRange(1);
});
(document.querySelector('#minusbutton') as HTMLInputElement).addEventListener('click', function() {
    QuantizeUI.ModifyRange(-1);
});

type rgbColor = {r: number, g: number, b:number};
class QuantizeUI {
    private static Worker = new Worker('wasmworker.js', {type: 'module'});
    private static div = document.querySelector('#menu_quantize') as HTMLDivElement;
    private static submit = document.querySelector('#menu_quantize > .menubutton') as HTMLInputElement;
    private static range = document.querySelector('#menuslider') as HTMLInputElement;
    private static dithering = document.querySelector('#ditheringslider') as HTMLInputElement;
    private static gamma = document.querySelector('#gammaslider') as HTMLInputElement;

    public static isactivated = false;
    
    static {
        this.div.style.display = "none";
        this.range.onchange = this.rangeChanged;
        this.submit.onclick = this.submitPressed;
        this.Worker.onmessage = this.onGetPaletteImage;
    }

    private static rangeChanged() {
        QuantizeUI.submit.value = QuantizeUI.range.value + "색 팔레트 만들기!";
    }
    private static async submitPressed() {
        var colors = QuantizeUI.range.value;
        
        var data: ImageData = await makeCanvas(BlobTool.url);
        QuantizeUI.Worker.postMessage([
            data, 
            colors, 
            Number.parseInt(QuantizeUI.dithering.value) / 100,
            Number.parseInt(QuantizeUI.gamma.value) / 100]);
        QuantizeUI.submit.disabled = true;
    }
    private static onGetPaletteImage(e: any) {
        QuantizeUI.submit.disabled = false;
        var worked : Uint8ClampedArray = e.data;
        console.log(worked);
        var pixelized = BlobTool.MakeBufferToBlob(worked.buffer);
        var pixelcolors = splitColors(rust.read_palette(new Uint8ClampedArray(worked)));
    
        RecolorUI.SetColors(pixelcolors);
        if (!RecolorUI.isactivated) {
            RecolorUI.Show();
        }
        setUItoImage(createUrl(pixelized));
        BlobTool.UpdateImage();
    }
    public static Show() {
        QuantizeUI.div.style.display = "";
        QuantizeUI.isactivated = true;
    }
    public static ModifyRange(i: number) {
        var res = i + Number.parseInt(this.range.value);
        if (res > Number.parseInt(this.range.max)) res = Number.parseInt(this.range.max);
        if (res < Number.parseInt(this.range.min)) res = Number.parseInt(this.range.min);

        this.range.value = res.toString();
        this.rangeChanged();
    }
}

class RecolorUI {
    static colors = new Array<HTMLInputElement>();
    static div = document.querySelector('#menu_palette') as HTMLDivElement;
    static button = document.querySelector('#menu_palette > .menubutton') as HTMLInputElement;
    public static isactivated = false;

    static {
        this.div.style.display = "none";
        this.button.addEventListener("click", downloadPressed);
    }

    private static addColor(color: string, id: number) {
        var newcover = document.createElement('input');
        newcover.type = 'color';
        newcover.value = `#${color}`;
        newcover.id = id.toString();
        newcover.addEventListener("change", this.colorchanged.bind(newcover));
        
        this.div.insertAdjacentElement("beforeend", newcover);
        this.colors.push(newcover);
    }
    public static SetColors(colors: Array<string>) {
        for (var i = 0; i < colors.length; i++) {
            if (this.colors.length <= i) {
                this.addColor(colors[i], i);
            } else {
                this.colors[i].value = `#${colors[i]}`;
            }
        }
        while (colors.length < this.colors.length) {
            var moved = this.colors.pop();
            if (moved instanceof HTMLInputElement) {
                moved.remove();
            }
        }
        this.button.ariaLabel = `파일 팔레트화가 완료되었습니다. 아래에 변경할 수 있는 색 목록이 있습니다. 색 목록을 변경한 뒤 이 버튼을 눌러주세요.`;
        this.button.focus();
    }
    public static Show() {
        this.div.style.display = "";
        this.button.focus();
        this.button.addEventListener('focusout', function() {
            this.ariaLabel = `다운로드 버튼. 색 목록을 변경한 뒤 이 버튼을 눌러주세요.`;
        });
        this.isactivated = true;
    }
    private static async colorchanged(this: HTMLInputElement) {
        var no = Number.parseInt(this.id);
        var color = getRGB(RecolorUI.colors[no].value);
        var blob = await BlobTool.ChangePalette(no, color);
        if (blob instanceof Blob) {
            setUItoImage(createUrl(blob));
        }
    }
}

class BlobTool {
    public static data: Blob | undefined = undefined;
    private static image: HTMLImageElement | undefined = undefined;
    public static url = "";
    public static qurl = "";

    public static async ChangePalette(id: number, color: rgbColor): Promise<Blob | undefined> {
        if (!(BlobTool.data instanceof Blob)) return undefined;
        var data = new Uint8ClampedArray(await BlobTool.data.arrayBuffer());
        var newdata = rust.change_palette(data, id, color.r, color.g, color.b);

        BlobTool.data = BlobTool.MakeBufferToBlob(newdata);
        return BlobTool.data;
    }
    public static MakeBufferToBlob(data: ArrayBuffer): Blob {
        var blob = new Blob([data], {type:'image/*'});
        BlobTool.data = blob;
        return blob;
    }
    public static GetImage(): HTMLImageElement | undefined {
        if (this.image instanceof HTMLImageElement) return this.image;
        else this.UpdateImage();

        return this.image;
    }
    public static UpdateImage() {
        if (this.data instanceof Blob) {
            this.qurl = createUrl(this.data);
        }
        if (this.qurl != "") {
            this.image = new Image();
            this.image.src = this.qurl;
            return this.image;
        }
        if (this.url != "") {
            this.image = new Image();
            this.image.src = this.url;
            return this.image;
        }
    }
}

class CanvasLogic {
    public static canvas = document.querySelector('#pic') as HTMLCanvasElement;
    private static ctx: CanvasRenderingContext2D;

    private static dx = 0;
    private static dy = 0;
    private static clicked = false;
    static {
        this.canvas.style.display = "none";
        this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    }
    public static StartDraw() {
        this.canvas.style.display = "";
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
        var self = CanvasLogic;
        var width = document.body.clientWidth, height = document.body.clientHeight;
        self.canvas.width = width;
        self.canvas.height = height;

        self.ctx.beginPath();
        self.ctx.fillStyle = "#aea5a5";
        self.ctx.rect(0, 0, width, height);

        self.ctx.fill();
        var img = BlobTool.GetImage();
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
    setUItoImage(BlobTool.url);

    LoadPictureUI.hide();
    QuantizeUI.Show();
    CanvasLogic.StartDraw();
}
async function loadXHR(lorem: string) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
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
function createUrl(blob: Blob): string {
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL(blob);
    return imageUrl;
}
function setUItoImage(imageUrl: string) {
    BlobTool.qurl = imageUrl;
    BlobTool.UpdateImage();
}
function colornizeIfPaletted(data: ArrayBuffer) {
    var colors = rust.read_palette(new Uint8ClampedArray(data));
    if (colors.length != 0) {
        RecolorUI.SetColors(splitColors(colors));
        RecolorUI.Show();
    }
}

function splitColors(data: Uint8ClampedArray): Array<string>{
    var array = [];
    for (var i = 0; i < data.length / 3; i++) {
        var r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
        array.push(((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1));
    }
    return array;
}

async function makeCanvas(blob: string): Promise<ImageData> {
    const img = document.createElement('img');
    img.src = blob;
    await new Promise((resolve) => (img.onload = resolve));
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
}
function getRGB(color: string): rgbColor {
    return {
        r: Number.parseInt(`0x${color[1]}${color[2]}`),
        g: Number.parseInt(`0x${color[3]}${color[4]}`),
        b: Number.parseInt(`0x${color[5]}${color[6]}`)
    };
}
function downloadPressed() {
    var a = document.createElement('a');
    a.download = newName;
    a.href = BlobTool.qurl;
    a.click();
}
function makeNewName(oldName: string): string {
    return `${oldName.split('.')[0]}.png`;
}