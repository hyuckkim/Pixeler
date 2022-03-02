import * as rust from "./pkg/hello_wasm.js";
rust.default();
var inputElement = document.querySelector('body > div > input[type=file]');
var bgElement = document.querySelector('body > div');
var url = "", pixelurl = "";
var filename = "";
var range;
var submit;
var log;
export function logging(s) {
    log.innerText = "status: " + s;
}
async function readFile(event) {
    if (event.target instanceof FileReader && event.target.result instanceof ArrayBuffer) {
        var result = event.target.result;
        url = imageBlob(result);
        setUItoImage(url);
        createInterface();
    }
}
function imageBlob(data) {
    var property = { type: 'image/*' };
    var blob = new Blob([data], property);
    return createUrl(blob);
}
function createUrl(blob) {
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL(blob);
    return imageUrl;
}
function setUItoImage(imageUrl) {
    bgElement.style.backgroundImage = "url('" + imageUrl + "')";
    inputElement.style.display = "none";
    console.log(imageUrl);
}
function createInterface() {
    bgElement.insertAdjacentHTML("beforeend", `
<div id="newmenu">
<input id="menuslider" type="range" min="2" max="256" value="4">
<input id="menubuton" type="button" value="4색 팔레트 만들기!">
<span id="menuarticle"></span>
</div>
    `);
    range = document.querySelector('body > div > div[id=newmenu] > input[type=range]');
    submit = document.querySelector('body > div > div[id=newmenu] > input[type=button]');
    log = document.querySelector('body > div > div[id=newmenu] > span');
    range.addEventListener("change", rangeChanged);
    submit.addEventListener("click", submitPressed);
}
function rangeChanged() {
    submit.value = range.value + "색 팔레트 만들기!";
}
function submitPressed() {
    pixelizeButton(Number.parseInt(range.value));
}
async function pixelizeButton(colors) {
    var data = await makeCanvas(url);
    var pixelized = await quantize(data, colors);
    if (pixelurl === "") {
        createNextInterface();
    }
    pixelurl = pixelized;
    setUItoImage(pixelized);
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
function createNextInterface() {
    bgElement.insertAdjacentHTML("beforeend", `
<div id="palettemenu">
<input id="menubuton" type="button" value="다운로드">
</div>
    `);
    var download = document.querySelector('body > div > div[id=palettemenu] > input[type=button]');
    download.addEventListener("click", downloadPressed);
}
function downloadPressed() {
    const contentType = "image/png";
    var a = document.createElement('a');
    a.download = filename;
    a.href = pixelurl;
    a.click();
}
function changeFile() {
    if (inputElement.files instanceof FileList) {
        var file = inputElement.files[0];
        var reader = new FileReader();
        reader.addEventListener('load', readFile);
        reader.readAsArrayBuffer(file);
        filename = file.name;
    }
}
inputElement.addEventListener('change', changeFile);
