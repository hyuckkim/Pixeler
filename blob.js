var _a, _b, _c;
import * as rust from "./pkg/palette_png.js";
rust.default();
var newName = "palette.png";
const inputElement = document.querySelector('body > div > input.file');
const roremElement = document.querySelector('body > div > input.rorem');
inputElement.addEventListener('change', function () {
    if (inputElement.files instanceof FileList) {
        var file = inputElement.files[0];
        readFileAndCallback(file, readFile);
        newName = makeNewName(file.name);
    }
});
roremElement.addEventListener('click', async function () {
    roremElement.disabled = true;
    await loadFile(600, 600);
    roremElement.disabled = false;
});
document.querySelector('#plusbutton').addEventListener('click', function () {
    QuantizeUI.ModifyRange(1);
});
document.querySelector('#minusbutton').addEventListener('click', function () {
    QuantizeUI.ModifyRange(-1);
});
class QuantizeUI {
    static rangeChanged() {
        QuantizeUI.submit.value = QuantizeUI.range.value + "색 팔레트 만들기!";
    }
    static async submitPressed() {
        var colors = QuantizeUI.range.value;
        var data = await makeCanvas(BlobTool.url);
        QuantizeUI.Worker.postMessage([data, colors, 1.0]);
        QuantizeUI.submit.disabled = true;
    }
    static onGetPaletteImage(e) {
        QuantizeUI.submit.disabled = false;
        var worked = e.data;
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
    static Show() {
        QuantizeUI.div.style.display = "";
        QuantizeUI.isactivated = true;
    }
    static ModifyRange(i) {
        var res = i + Number.parseInt(this.range.value);
        if (res > Number.parseInt(this.range.max))
            res = Number.parseInt(this.range.max);
        if (res < Number.parseInt(this.range.min))
            res = Number.parseInt(this.range.min);
        this.range.value = res.toString();
        this.rangeChanged();
    }
}
_a = QuantizeUI;
QuantizeUI.Worker = new Worker('wasmworker.js', { type: 'module' });
QuantizeUI.div = document.querySelector('#newmenu');
QuantizeUI.submit = document.querySelector('#newmenu > .menubutton');
QuantizeUI.range = document.querySelector('#menuslider');
QuantizeUI.isactivated = false;
(() => {
    _a.div.style.display = "none";
    _a.range.onchange = _a.rangeChanged;
    _a.submit.onclick = _a.submitPressed;
    _a.Worker.onmessage = _a.onGetPaletteImage;
})();
class RecolorUI {
    static addColor(color, id) {
        var newcover = document.createElement('input');
        newcover.type = 'color';
        newcover.value = `#${color}`;
        newcover.id = id.toString();
        newcover.addEventListener("change", this.colorchanged.bind(newcover));
        this.div.insertAdjacentElement("beforeend", newcover);
        this.colors.push(newcover);
    }
    static SetColors(colors) {
        for (var i = 0; i < colors.length; i++) {
            if (this.colors.length <= i) {
                this.addColor(colors[i], i);
            }
            else {
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
    static Show() {
        this.div.style.display = "";
        this.button.focus();
        this.button.addEventListener('focusout', function () {
            this.ariaLabel = `다운로드 버튼. 색 목록을 변경한 뒤 이 버튼을 눌러주세요.`;
        });
        this.isactivated = true;
    }
    static async colorchanged() {
        var no = Number.parseInt(this.id);
        var color = getRGB(RecolorUI.colors[no].value);
        var blob = await BlobTool.ChangePalette(no, color);
        if (blob instanceof Blob) {
            setUItoImage(createUrl(blob));
        }
    }
}
_b = RecolorUI;
RecolorUI.colors = new Array();
RecolorUI.div = document.querySelector('#palettemenu');
RecolorUI.button = document.querySelector('#palettemenu > .menubutton');
RecolorUI.isactivated = false;
(() => {
    _b.div.style.display = "none";
    _b.button.addEventListener("click", downloadPressed);
})();
class BlobTool {
    static async ChangePalette(id, color) {
        if (!(BlobTool.data instanceof Blob))
            return undefined;
        var data = new Uint8ClampedArray(await BlobTool.data.arrayBuffer());
        var newdata = rust.change_palette(data, id, color.r, color.g, color.b);
        BlobTool.data = BlobTool.MakeBufferToBlob(newdata);
        return BlobTool.data;
    }
    static MakeBufferToBlob(data) {
        var blob = new Blob([data], { type: 'image/*' });
        BlobTool.data = blob;
        return blob;
    }
    static GetImage() {
        if (this.image instanceof HTMLImageElement)
            return this.image;
        else
            this.UpdateImage();
        return this.image;
    }
    static UpdateImage() {
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
BlobTool.data = undefined;
BlobTool.image = undefined;
BlobTool.url = "";
BlobTool.qurl = "";
class CanvasLogic {
    static StartDraw() {
        this.canvas.style.display = "";
        this.canvas.width = this.background.clientWidth;
        this.canvas.height = this.background.clientHeight;
        setInterval(this.Draw, 34);
        this.canvas.addEventListener('mousedown', this.OnMouseDown);
        this.canvas.addEventListener('mousemove', this.OnMouseMove);
        this.canvas.addEventListener('mouseup', this.OnMouseUp);
        this.canvas.addEventListener('mouseout', this.OnMouseUp);
        this.canvas.addEventListener('touchstart', this.OnHandDown);
        this.canvas.addEventListener('touchmove', this.OnHandMove);
        this.canvas.addEventListener('touechend', this.OnHandUp);
    }
    static Draw() {
        var self = CanvasLogic;
        var width = self.background.clientWidth, height = self.background.clientHeight;
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
    static OnMouseDown(ev) {
        CanvasLogic.mouseX = ev.clientX;
        CanvasLogic.mouseY = ev.clientY;
        CanvasLogic.clicked = true;
    }
    static OnMouseMove(ev) {
        if (CanvasLogic.clicked) {
            CanvasLogic.dx += CanvasLogic.mouseX - ev.clientX;
            CanvasLogic.dy += CanvasLogic.mouseY - ev.clientY;
            CanvasLogic.mouseX = ev.clientX;
            CanvasLogic.mouseY = ev.clientY;
        }
    }
    static OnMouseUp() {
        CanvasLogic.clicked = false;
    }
    static OnHandDown(ev) {
        CanvasLogic.mouseX = ev.touches[0].clientX;
        CanvasLogic.mouseY = ev.touches[0].clientY;
        CanvasLogic.clicked = true;
        ev.preventDefault();
    }
    static OnHandMove(ev) {
        if (CanvasLogic.clicked) {
            CanvasLogic.dx += CanvasLogic.mouseX - ev.touches[0].clientX;
            CanvasLogic.dy += CanvasLogic.mouseY - ev.touches[0].clientY;
            CanvasLogic.mouseX = ev.touches[0].clientX;
            CanvasLogic.mouseY = ev.touches[0].clientY;
        }
        ev.preventDefault();
        return false;
    }
    static OnHandUp() {
        CanvasLogic.clicked = false;
    }
}
_c = CanvasLogic;
CanvasLogic.canvas = document.querySelector('body > div > canvas');
CanvasLogic.background = document.querySelector("body > div");
CanvasLogic.dx = 0;
CanvasLogic.dy = 0;
CanvasLogic.clicked = false;
(() => {
    _c.canvas.style.display = "none";
    _c.ctx = _c.canvas.getContext("2d");
})();
CanvasLogic.mouseX = 0;
CanvasLogic.mouseY = 0;
function readFileAndCallback(file, callback) {
    var reader = new FileReader();
    reader.addEventListener('load', callback);
    reader.readAsArrayBuffer(file);
}
async function readFile(event) {
    if (event.target instanceof FileReader && event.target.result instanceof ArrayBuffer) {
        var result = event.target.result;
        var blob = BlobTool.MakeBufferToBlob(result);
        BlobTool.url = createUrl(blob);
        imageReady();
        colornizeIfPaletted(result);
    }
}
async function loadFile(width, height) {
    var blob = await loadXHR(`https://picsum.photos/${width}/${height}`).then((response) => {
        return response;
    });
    BlobTool.url = createUrl(blob);
    imageReady();
}
function imageReady() {
    setUItoImage(BlobTool.url);
    QuantizeUI.Show();
    CanvasLogic.StartDraw();
}
async function loadXHR(lorem) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", lorem);
        xhr.responseType = "blob";
        xhr.onerror = function () { reject("Network error."); };
        xhr.onload = function () {
            if (xhr.status === 200) {
                resolve(xhr.response);
            }
            else {
                reject("Loading error:" + xhr.statusText);
            }
        };
        xhr.send();
    });
}
function createUrl(blob) {
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL(blob);
    return imageUrl;
}
function setUItoImage(imageUrl) {
    inputElement.style.display = "none";
    roremElement.style.display = "none";
    BlobTool.qurl = imageUrl;
    BlobTool.UpdateImage();
}
function colornizeIfPaletted(data) {
    var colors = rust.read_palette(new Uint8ClampedArray(data));
    if (colors.length != 0) {
        RecolorUI.SetColors(splitColors(colors));
        RecolorUI.Show();
    }
}
function splitColors(data) {
    var array = [];
    for (var i = 0; i < data.length / 3; i++) {
        var r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
        array.push(((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1));
    }
    return array;
}
async function makeCanvas(blob) {
    const img = document.createElement('img');
    img.src = blob;
    await new Promise((resolve) => (img.onload = resolve));
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, img.width, img.height);
}
function getRGB(color) {
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
function makeNewName(oldName) {
    return `${oldName.split('.')[0]}.png`;
}
