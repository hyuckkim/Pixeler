import * as rust from "./pkg/hello_wasm";
var inputElement = document.querySelector('body > div > inputElement[type=file]') as HTMLInputElement;
var bgElement = document.querySelector('body > div') as HTMLElement;

function readFile(event: ProgressEvent<FileReader>) {
    if (event.target instanceof FileReader && event.target.result instanceof ArrayBuffer) {
        var result = event.target.result;

        resultToUI(result);
        resultToData(result);
    }
}
function resultToUI(result: ArrayBuffer) {
    var blob = imageBlob(result);
    var imageUrl = createBlobURL(blob);

    setUItoImage(imageUrl);
}
function imageBlob(data: ArrayBuffer): Blob {
    var property = {type:'image/*'};
    var blob = new Blob([data], property);
    return blob;
}
function createBlobURL(blob: Blob): string {
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL(blob);
    return imageUrl;
}
function setUItoImage(imageUrl: string) {
    bgElement.style.backgroundImage =  "url('" + imageUrl + "')";
    inputElement.style.display = "none";
}

function resultToData(result: ArrayBuffer) {
    console.log(rust.ten());
}

function changeFile() {
    if (inputElement.files instanceof FileList) {
        var file = inputElement.files[0];
        var reader = new FileReader();
        reader.addEventListener('load', readFile);
        reader.readAsArrayBuffer(file);
    }
}
inputElement.addEventListener('change', changeFile);