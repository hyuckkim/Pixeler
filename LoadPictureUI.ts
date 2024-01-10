import { UI } from "./panelUI.js";

import { BlobTool } from "./BlobTool.js";

import * as rust from "./pkg/palette_png.js";
rust.default();

export class LoadPictureUI extends UI {

  private file: HTMLInputElement;
  private rorem: HTMLInputElement;
  private onImageLoad: (name: string, palette: Uint8ClampedArray | undefined) => void;

  constructor(root: HTMLDivElement, onImageLoad: (name: string, isPaletted: Uint8ClampedArray | undefined) => void) {
    super(root);

    const fileInput = this.root.querySelector('#file');
    const roremInput = this.root.querySelector('#rorem');

    if (
      !(fileInput instanceof HTMLInputElement) ||
      !(roremInput instanceof HTMLInputElement)
    ) throw new Error("LoadPictureUI must have #file, #rorem");

    this.file = fileInput;
    this.file.onchange = () => { this.handleFile() };

    this.rorem = roremInput;
    this.rorem.onclick = () => { this. handleRorem() };

    this.onImageLoad = onImageLoad;
  }

  private async handleFile() {
    if (!(this.file.files instanceof FileList)) throw new Error("file uncatched");
    this.file.disabled = true;
    this.loadFile(this.file.files[0]);
    this.file.disabled = false;
  }

  private async loadFile(file: File) {
    const array = await this.loadBuffer(file);
    const blob = BlobTool.MakeBufferToBlob(array);
    BlobTool.url = BlobTool.createUrl(blob);

    const palette = rust.read_palette(new Uint8ClampedArray(array));

    this.onImageLoad(
      `${file.name.split('.')[0]}.png`, 
      palette.length !== 0 ? palette : undefined);
  }

  async loadBuffer(file: File): Promise<ArrayBuffer> {
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

  private async handleRorem() {
    this.rorem.disabled = true;
    await this.loadRorem(600, 600);
    this.rorem.disabled = false;
  }

  private async loadRorem(width: number, height: number) {
    const blob = await this.loadXHR(`https://picsum.photos/${width}/${height}`);
    if (!(blob.body instanceof Blob)) return;

    BlobTool.url = BlobTool.createUrl(blob.body);
    this.onImageLoad(`${blob.name.split('.')[0]}.png`, undefined);
  }

  private async loadXHR(lorem: string): Promise<{
    body: Blob,
    name: string
  }> {
    return new Promise(function(resolve, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", lorem);
        xhr.responseType = "blob";
        xhr.onload = function() {
          xhr.responseURL
          if (xhr.status === 200) {resolve({
            body: xhr.response,
            name: xhr.responseURL.split("?hmac=")[1]
          })}
          else {reject("Loading error:" + xhr.statusText)}
        };
        xhr.onerror = function() {reject("Network error.")};

        xhr.send();
    });
}
}