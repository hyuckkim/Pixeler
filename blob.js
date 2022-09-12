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
class QuantizeUI {
    static rangeChanged() {
        QuantizeUI.submit.value = QuantizeUI.range.value + "색 팔레트 만들기!";
    }
    static async submitPressed() {
        var colors = QuantizeUI.range.value;
        var data = await makeCanvas(url);
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
    }
    static Show() {
        QuantizeUI.div.style.display = "";
        QuantizeUI.isactivated = true;
    }
}
QuantizeUI.Worker = new Worker('wasmworker.js', { type: 'module' });
QuantizeUI.div = document.querySelector('#newmenu');
QuantizeUI.submit = document.querySelector('#newmenu > .menubutton');
QuantizeUI.range = document.querySelector('#menuslider');
QuantizeUI.isactivated = false;
(() => {
    QuantizeUI.div.style.display = "none";
    QuantizeUI.range.onchange = QuantizeUI.rangeChanged;
    QuantizeUI.submit.onclick = QuantizeUI.submitPressed;
    QuantizeUI.Worker.onmessage = QuantizeUI.onGetPaletteImage;
})();
class RecolorUI {
    static addColor(color, id) {
        var newcover = document.createElement('input');
        newcover.type = 'color';
        newcover.value = `#${color}`;
        newcover.id = id.toString();
        newcover.addEventListener("change", RecolorUI.colorchanged.bind(newcover));
        RecolorUI.div.insertAdjacentElement("beforeend", newcover);
        RecolorUI.colors.push(newcover);
    }
    static SetColors(colors) {
        for (var i = 0; i < colors.length; i++) {
            if (RecolorUI.colors.length <= i) {
                RecolorUI.addColor(colors[i], i);
            }
            else {
                RecolorUI.colors[i].value = `#${colors[i]}`;
            }
        }
        while (colors.length < RecolorUI.colors.length) {
            var moved = RecolorUI.colors.pop();
            if (moved instanceof HTMLInputElement) {
                moved.remove();
            }
        }
        RecolorUI.button.ariaLabel = `파일 팔레트화가 완료되었습니다. 아래에 변경할 수 있는 색 목록이 있습니다. 색 목록을 변경한 뒤 이 버튼을 눌러주세요.`;
        RecolorUI.button.focus();
    }
    static Show() {
        RecolorUI.div.style.display = "";
        RecolorUI.button.focus();
        RecolorUI.button.addEventListener('focusout', function () {
            this.ariaLabel = `다운로드 버튼. 색 목록을 변경한 뒤 이 버튼을 눌러주세요.`;
        });
        RecolorUI.isactivated = true;
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
RecolorUI.colors = new Array();
RecolorUI.div = document.querySelector('#palettemenu');
RecolorUI.button = document.querySelector('#palettemenu > .menubutton');
RecolorUI.isactivated = false;
(() => {
    RecolorUI.div.style.display = "none";
    RecolorUI.button.addEventListener("click", downloadPressed);
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
}
BlobTool.data = undefined;
function readFileAndCallback(file, callback) {
    var reader = new FileReader();
    reader.addEventListener('load', callback);
    reader.readAsArrayBuffer(file);
}
var bgElement = document.querySelector('body > div');
async function readFile(event) {
    if (event.target instanceof FileReader && event.target.result instanceof ArrayBuffer) {
        var result = event.target.result;
        var blob = BlobTool.MakeBufferToBlob(result);
        url = createUrl(blob);
        setUItoImage(url);
        QuantizeUI.Show();
        colornizeIfPaletted(result);
    }
}
async function loadFile(width, height) {
    var blob = await loadXHR(`https://picsum.photos/${width}/${height}`).then((response) => {
        return response;
    });
    url = createUrl(blob);
    setUItoImage(url);
    QuantizeUI.Show();
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
    bgElement.style.backgroundImage = "url('" + imageUrl + "')";
    inputElement.style.display = "none";
    roremElement.style.display = "none";
    pixelurl = imageUrl;
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
        var r = data[i * 3].toString(16), g = data[i * 3 + 1].toString(16), b = data[i * 3 + 2].toString(16);
        array.push(`${r}${g}${b}`);
    }
    return array;
}
var url = "";
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
var pixelurl = "";
function downloadPressed() {
    var a = document.createElement('a');
    a.download = newName;
    a.href = pixelurl;
    a.click();
}
function makeNewName(oldName) {
    return `${oldName.split('.')[0]}.png`;
}
