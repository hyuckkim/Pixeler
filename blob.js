import * as rust from "./pkg/hello_wasm.js";
rust.default();
var inputElement = document.querySelector('body > div > input[type=file]');
var bgElement = document.querySelector('body > div');
var pixeldata = undefined;
var pixelizeui;
var pixelui;
var filename = "";
async function readFile(event) {
    if (event.target instanceof FileReader && event.target.result instanceof ArrayBuffer) {
        var result = event.target.result;
        var blob = imageBlob(result);
        url = createUrl(blob);
        setUItoImage(url);
        var colors = rust.read_palette(new Uint8ClampedArray(result));
        if (colors.length != 0) {
            pixeldata = blob;
            createNextInterface(splitColors(colors));
        }
        createInterface();
    }
}
function splitColors(data) {
    var array = [];
    for (var i = 0; i < data.length / 3; i++) {
        array.push(`${data[i * 3].toString(16)}${data[i * 3 + 1].toString(16)}${data[i * 3 + 2].toString(16)}`);
    }
    return array;
}
function imageBlob(data) {
    var property = { type: 'image/*' };
    var blob = new Blob([data], property);
    return blob;
}
function createUrl(blob) {
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL(blob);
    return imageUrl;
}
function setUItoImage(imageUrl) {
    bgElement.style.backgroundImage = "url('" + imageUrl + "')";
    inputElement.style.display = "none";
    pixelurl = imageUrl;
}
function createInterface() {
    var value = {
        div: document.createElement('div'),
        range: document.createElement('input'),
        submit: document.createElement('input'),
    };
    value.div.id = `newmenu`;
    value.range.id = `menuslider`;
    value.range.ariaLabel = `이미지를 변환할 때 사용할 색 개수`;
    value.submit.id = `menubutton`;
    value.submit.ariaLabel = `이미지를 몇 개의 색만을 가지도록 변환합니다. 이 작업은 몇 초 정도 걸립니다.`;
    value.range.type = `range`;
    value.range.value = `4`;
    value.range.min = `2`;
    value.range.max = `256`;
    value.submit.type = `button`;
    value.submit.value = `4색 팔레트 만들기!`;
    value.range.addEventListener("change", rangeChanged);
    value.submit.addEventListener("click", submitPressed);
    bgElement.insertAdjacentElement("beforeend", value.div);
    value.div.insertAdjacentElement("beforeend", value.submit);
    value.div.insertAdjacentElement("beforeend", value.range);
    pixelizeui = value;
}
function rangeChanged() {
    pixelizeui.submit.value = pixelizeui.range.value + "색 팔레트 만들기!";
}
function submitPressed() {
    pixelizeButton(Number.parseInt(pixelizeui.range.value));
}
var url = "";
async function pixelizeButton(colors) {
    var data = await makeCanvas(url);
    var pixelized = await quantize(data, colors);
    var pixelcolors = rust.read_palette(new Uint8ClampedArray(await pixelized.arrayBuffer()));
    if (pixeldata == undefined) {
        createNextInterface(splitColors(pixelcolors));
    }
    else {
        modifyNextInterface(splitColors(pixelcolors));
    }
    pixeldata = pixelized;
    setUItoImage(createUrl(pixelized));
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
async function quantize(img, colors) {
    var quantized = await (async () => rust.quantize(img.data, img.width, img.height, colors, 1.0))();
    var blob = imageBlob(quantized.buffer);
    return blob;
}
function createNextInterface(colors) {
    var value = {
        div: document.createElement('div'),
        button: document.createElement('input'),
        colors: new Array(),
        addColor: (self, newcover) => {
            self.div.insertAdjacentElement("beforeend", newcover);
            self.colors.push(newcover);
        },
    };
    value.div.id = 'palettemenu';
    value.button.id = 'menubutton';
    value.button.type = 'button';
    value.button.value = '다운로드';
    value.button.addEventListener("click", downloadPressed);
    bgElement.insertAdjacentElement("beforeend", value.div);
    value.div.insertAdjacentElement("beforeend", value.button);
    value.button.ariaLabel = `파일 팔레트화가 완료되었습니다. 아래에 변경할 수 있는 색 목록이 있습니다. 색 목록을 변경한 뒤 이 버튼을 눌러주세요.`;
    value.button.focus();
    value.button.addEventListener('focusout', function () {
        this.ariaLabel = `다운로드 버튼. 색 목록을 변경한 뒤 이 버튼을 눌러주세요.`;
    });
    var i = 0;
    colors.forEach(e => {
        var newcover = makeNewcover(e, i);
        value.addColor(value, newcover);
        i++;
    });
    pixelui = value;
    return value;
}
function makeNewcover(color, id) {
    var newcover = document.createElement('input');
    newcover.type = 'color';
    newcover.value = `#${color}`;
    newcover.id = id.toString();
    newcover.addEventListener("change", colorchanged.bind(newcover));
    return newcover;
}
function modifyNextInterface(colors) {
    var value = pixelui;
    for (var i = 0; i < colors.length; i++) {
        if (value.colors.length <= i) {
            var newcover = makeNewcover(colors[i], i);
            value.addColor(value, newcover);
        }
        else {
            value.colors[i].value = `#${colors[i]}`;
        }
    }
    while (colors.length < value.colors.length) {
        var moved = value.colors.pop();
        if (moved instanceof HTMLInputElement) {
            moved.remove();
        }
    }
    value.button.ariaLabel = `파일 팔레트화가 완료되었습니다. 아래에 변경할 수 있는 색 목록이 있습니다. 색 목록을 변경한 뒤 이 버튼을 눌러주세요.`;
    value.button.focus();
}
async function colorchanged() {
    if (pixeldata instanceof Blob) {
        var data = new Uint8ClampedArray(await pixeldata.arrayBuffer());
        var no = Number.parseInt(this.id);
        var color = pixelui.colors[no].value;
        var blob = imageBlob(rust.change_palette(data, Number.parseInt(this.id), Number.parseInt(`0x${color[1]}${color[2]}`), Number.parseInt(`0x${color[3]}${color[4]}`), Number.parseInt(`0x${color[5]}${color[6]}`)));
        pixeldata = blob;
        setUItoImage(createUrl(blob));
    }
}
var pixelurl = "";
function downloadPressed() {
    const contentType = "image/png";
    var a = document.createElement('a');
    a.download = `${filename}.png`;
    a.href = pixelurl;
    a.click();
}
function changeFile() {
    if (inputElement.files instanceof FileList) {
        var file = inputElement.files[0];
        var reader = new FileReader();
        reader.addEventListener('load', readFile);
        reader.readAsArrayBuffer(file);
        filename = file.name.split('.')[0];
    }
}
inputElement.addEventListener('change', changeFile);
