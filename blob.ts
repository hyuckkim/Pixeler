import * as rust from "./pkg/hello_wasm.js";
rust.default();

var inputElement = document.querySelector('body > div > input[type=file]') as HTMLInputElement;
var bgElement = document.querySelector('body > div') as HTMLElement;
var pixeldata: Blob | undefined = undefined;

var pixelizeui: firstUI;
var pixelui: secondUI;
type secondUI = {
    div: HTMLDivElement;
    button: HTMLInputElement;
    colors: HTMLInputElement[];
    
    addColor: (self: secondUI, newcover: HTMLInputElement) => void;
};
type firstUI = {
    div: HTMLDivElement,
    range: HTMLInputElement,
    submit: HTMLInputElement,

}
var filename = "";

async function readFile(event: ProgressEvent<FileReader>) {
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
function splitColors(data: Uint8ClampedArray): Array<string>{
    var array = [];
    for (var i = 0; i < data.length / 3; i++) {
        array.push(`${data[i * 3].toString(16)}${data[i * 3 + 1].toString(16)}${data[i * 3 + 2].toString(16)}`);
    }
    return array;
}
function imageBlob(data: ArrayBuffer): Blob {
    var property = {type:'image/*'};
    var blob = new Blob([data], property);
    return blob;
}
function createUrl(blob: Blob): string {
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL(blob);
    return imageUrl;
}
function setUItoImage(imageUrl: string) {
    bgElement.style.backgroundImage = "url('" + imageUrl + "')";
    inputElement.style.display = "none";
    pixelurl = imageUrl;
}
function createInterface() {
    var value: firstUI = {
        div: document.createElement('div'),
        range: document.createElement('input'),
        submit: document.createElement('input'),
    };
    value.div.id = `newmenu`;
    value.range.id = `menuslider`;
    value.submit.id = `menubutton`;

    value.range.addEventListener("change", rangeChanged);
    value.submit.addEventListener("click", submitPressed);

    bgElement.insertAdjacentElement("beforeend", value.div);

    value.div.insertAdjacentElement("beforeend", value.range);
    value.div.insertAdjacentElement("beforeend", value.submit);

    pixelizeui = value;
}
function rangeChanged() {
    pixelizeui.submit.value = pixelizeui.range.value + "색 팔레트 만들기!";
}
function submitPressed() {
    pixelizeButton(Number.parseInt(pixelizeui.range.value));
}

var url = "";
async function pixelizeButton(colors: number) {
    var data: ImageData = await makeCanvas(url);
    var pixelized = await quantize(data, colors);
    pixeldata = pixelized;
    
    var pixelcolors = rust.read_palette(new Uint8ClampedArray(await pixelized.arrayBuffer()));

    if (pixeldata == undefined) {
        createNextInterface(splitColors(pixelcolors));
    } else {
        modifyNextInterface(splitColors(pixelcolors));
    }
    setUItoImage(createUrl(pixelized));
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
async function quantize(img: ImageData, colors: number): Promise<Blob> {
    var quantized = await (async () => rust.quantize(img.data, img.width, img.height, colors, 1.0))();
    var blob = imageBlob(quantized.buffer);
    return blob;
}
function createNextInterface(colors: Array<string>) {
    var value: secondUI = {
        div: document.createElement('div'),
        button: document.createElement('input'),
        colors: new Array<HTMLInputElement>(),
        addColor: (self: secondUI, newcover: HTMLInputElement) => {
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

    var i = 0;
    colors.forEach(e => {
        var newcover = makeNewcover(e, i);
        value.addColor(value, newcover);
        i++;
    });

    pixelui = value;
    return value;
}
function makeNewcover(color: string, id: number): HTMLInputElement {
    var newcover = document.createElement('input');
    newcover.type = 'color';
    newcover.value = `#${color}`;
    newcover.id = id.toString();
    newcover.addEventListener("change", colorchanged.bind(newcover));
    return newcover;
}
function modifyNextInterface(colors: Array<string>) {
    var value = pixelui;
    for (var i = 0; i < colors.length; i++) {
        if (value.colors.length <= i) {
            var newcover = makeNewcover(colors[i], i);
            value.addColor(value, newcover);
        } else {
            value.colors[i].value = `#${colors[i]}`;
        }
    }
    while (colors.length < value.colors.length) {
        var moved = value.colors.pop();
        if (moved instanceof HTMLInputElement) {
            moved.remove();
        }
    }
}
async function colorchanged(this: HTMLInputElement) {
    if (pixeldata instanceof Blob) {

        var data = new Uint8ClampedArray(await pixeldata.arrayBuffer());
        var no = Number.parseInt(this.id);
        var color = pixelui.colors[no].value;
        var blob = imageBlob(rust.change_palette(data, Number.parseInt(this.id), 
        Number.parseInt(`0x${color[1]}${color[2]}`),
        Number.parseInt(`0x${color[3]}${color[4]}`),
        Number.parseInt(`0x${color[5]}${color[6]}`)));
        
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