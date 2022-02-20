var inputElement = document.querySelector('body > div > input[type=file]');
var bgElement = document.querySelector('body > div');
function readFile(event) {
    if (event.target instanceof FileReader && event.target.result instanceof ArrayBuffer) {
        var result = event.target.result;
        resultToUI(result);
        resultToData(result);
    }
}
function resultToUI(result) {
    var blob = imageBlob(result);
    var imageUrl = createBlobURL(blob);
    setUItoImage(imageUrl);
}
function imageBlob(data) {
    var property = { type: 'image/*' };
    var blob = new Blob([data], property);
    return blob;
}
function createBlobURL(blob) {
    var urlCreator = window.URL || window.webkitURL;
    var imageUrl = urlCreator.createObjectURL(blob);
    return imageUrl;
}
function setUItoImage(imageUrl) {
    bgElement.style.backgroundImage = "url('" + imageUrl + "')";
    inputElement.style.display = "none";
}
function resultToData(result) {
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
export {};
