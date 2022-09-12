import * as rust from "./pkg/palette_png.js";
rust.default();
var quantizeWorker = new Worker('wasmworker.js', {type: 'module'});

const inputElement = document.querySelector('body > div > input.file') as HTMLInputElement;
const roremElement = document.querySelector('body > div > input.rorem') as HTMLInputElement;

var pixelizeui: firstUI;
pixelizeui = {
    div: document.querySelector('#newmenu') as HTMLDivElement,
    submit: document.querySelector('#newmenu > .menubutton') as HTMLInputElement,
    range: document.querySelector('#menuslider') as HTMLInputElement,
};
pixelizeui.div.style.display = "none";
pixelizeui.range.onchange = rangeChanged;
pixelizeui.submit.onclick = submitPressed;
function rangeChanged() {
    pixelizeui.submit.value = pixelizeui.range.value + "색 팔레트 만들기!";
}
function submitPressed() {
    pixelizeButton(Number.parseInt(pixelizeui.range.value));
}

var pixelui: secondUI;
pixelui = {
    div: document.querySelector('#palettemenu') as HTMLDivElement,
    button: document.querySelector('#palettemenu > .menubutton') as HTMLInputElement,
    colors: new Array<HTMLInputElement>(),
    addColor: (self: secondUI, newcover: HTMLInputElement) => {
        self.div.insertAdjacentElement("beforeend", newcover);
        self.colors.push(newcover);
    },
};
pixelui.div.style.display = "none";
pixelui.button.addEventListener("click", downloadPressed);

var newName = "palette.png";
inputElement.addEventListener('change', function() {
    if (inputElement.files instanceof FileList) {
        var file = inputElement.files[0];
        readFileAndCallback(file, readFile);
        newName = makeNewName(file.name);
    }
});
roremElement.addEventListener('click', async function() {
    roremElement.disabled = true;
    await loadFile(600, 600);
    roremElement.disabled = false;
});
function readFileAndCallback(file: File, callback: (this: FileReader, ev: ProgressEvent<FileReader>) => any) {
    var reader = new FileReader();
    reader.addEventListener('load', callback);
    reader.readAsArrayBuffer(file);
}
var bgElement = document.querySelector('body > div') as HTMLElement;
async function readFile(event: ProgressEvent<FileReader>) {
    if (event.target instanceof FileReader && event.target.result instanceof ArrayBuffer) {
        var result = event.target.result;

        var blob = imageBlob(result);
        url = createUrl(blob);

        setUItoImage(url);
        createInterface();
        colornizeIfPaletted(result, blob);
    }
}
async function loadFile(width: number, height: number) {
    var blob = await loadXHR(`https://picsum.photos/${width}/${height}`).then((response: any) => {
        return response;
    });
    url = createUrl(blob);
    
    setUItoImage(url);
    createInterface();
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
    roremElement.style.display = "none";
    pixelurl = imageUrl;
}
type firstUI = {
    div: HTMLDivElement,
    range: HTMLInputElement,
    submit: HTMLInputElement,
}
function createInterface() {
    pixelizeui.div.style.display = "";
}
function colornizeIfPaletted(data: ArrayBuffer, blob: Blob) {
    var colors = rust.read_palette(new Uint8ClampedArray(data));
    if (colors.length != 0) {
        pixeldata = blob;
        createNextInterface(splitColors(colors));
    }
}
var pixeldata: Blob | undefined = undefined;

type secondUI = {
    div: HTMLDivElement;
    button: HTMLInputElement;
    colors: HTMLInputElement[];
    
    addColor: (self: secondUI, newcover: HTMLInputElement) => void;
};

function splitColors(data: Uint8ClampedArray): Array<string>{
    var array = [];
    for (var i = 0; i < data.length / 3; i++) {
        var r = data[i * 3].toString(16), g = data[i * 3 + 1].toString(16), b = data[i * 3 + 2].toString(16);
        array.push(`${r}${g}${b}`);
    }
    return array;
}

var url = "";
async function pixelizeButton(colors: number) {
    var data: ImageData = await makeCanvas(url);
    quantizeWorker.postMessage([data, colors, 1.0]);
    pixelizeui.submit.disabled = true;
}
quantizeWorker.onmessage = e => {
    pixelizeui.submit.disabled = false;
    var worked : Uint8ClampedArray = e.data;
    console.log(worked);
    var pixelized = imageBlob(worked.buffer);
    var pixelcolors = splitColors(rust.read_palette(new Uint8ClampedArray(worked)));

    if (pixeldata == undefined) {
        createNextInterface(pixelcolors);
    } else {
        modifyColors(pixelcolors);
    }
    pixeldata = pixelized;
    setUItoImage(createUrl(pixelized));
};

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
function createNextInterface(colors: Array<string>) {
    pixelui.div.style.display = "";
    pixelui.button.focus();
    pixelui.button.addEventListener('focusout', function() {
        this.ariaLabel = `다운로드 버튼. 색 목록을 변경한 뒤 이 버튼을 눌러주세요.`;
    });
    modifyColors(colors);
}
function makeNewcover(color: string, id: number): HTMLInputElement {
    var newcover = document.createElement('input');
    newcover.type = 'color';
    newcover.value = `#${color}`;
    newcover.id = id.toString();
    newcover.addEventListener("change", colorchanged.bind(newcover));
    return newcover;
}
function modifyColors(colors: Array<string>) {
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
    value.button.ariaLabel = `파일 팔레트화가 완료되었습니다. 아래에 변경할 수 있는 색 목록이 있습니다. 색 목록을 변경한 뒤 이 버튼을 눌러주세요.`;
    value.button.focus();
}
async function colorchanged(this: HTMLInputElement) {
    if (pixeldata instanceof Blob) {

        var data = new Uint8ClampedArray(await pixeldata.arrayBuffer());
        var no = Number.parseInt(this.id);
        var color = getRGB(pixelui.colors[no].value);

        var newImage = rust.change_palette(data, Number.parseInt(this.id), 
        color.r, color.g, color.b);
        var blob = imageBlob(newImage);
        
        pixeldata = blob;
        setUItoImage(createUrl(blob));
    }
}
function getRGB(color: string): {r: number, g: number, b:number} {
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
function makeNewName(oldName: string): string {
    return `${oldName.split('.')[0]}.png`;
}