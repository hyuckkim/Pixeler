import { PanelUI } from "./panelUI.js";

import { BlobTool } from "../BlobTool.js";

import * as rust from "../pkg/palette_png.js";
import { position } from "../blob.js";
rust.default();

export class QuantizeUI extends PanelUI {
  private range: HTMLInputElement;
  private dithering: HTMLInputElement;
  private gamma: HTMLInputElement;

  private worker: Worker;
  private onQuantized: (blob: Blob, colors: Uint8ClampedArray) => void;

  constructor(root: HTMLDivElement, onQuantized: (blob: Blob, colors: Uint8ClampedArray) => void) {
    super(root);

    const menuSlider = this.root.querySelector("#menuslider");
    const ditheringSlider = this.root.querySelector("#ditheringslider");
    const gammaSlider = this.root.querySelector("#gammaslider");

    if (
      !(menuSlider instanceof HTMLInputElement) ||
      !(ditheringSlider instanceof HTMLInputElement) ||
      !(gammaSlider instanceof HTMLInputElement)
    ) throw new Error("QuantizeUI must have three slider: #menuslider, #ditheringslider, gammaslider");
    
    this.range = menuSlider;
    this.range.onchange = () => { this.handleRangeChanged() }

    this.dithering = ditheringSlider;
    this.gamma = gammaSlider;

    const plusButton = this.root.querySelector("#plusbutton");
    const minusButton = this.root.querySelector("#minusbutton");

    if (
      !(plusButton instanceof HTMLInputElement) ||
      !(minusButton instanceof HTMLInputElement)
    ) throw new Error("QuantizeUI must have #plusbutton and #minusbutton");

    plusButton.onclick = () => { this.handleModifyRange(1) }
    minusButton.onclick = () => { this.handleModifyRange(-1) }

    this.worker = new Worker('wasmworker.js', {type: 'module'});
    this.onQuantized = onQuantized;
  }

  async doMain(): Promise<void> {
    const data = await this.makeCanvas(BlobTool.url, position());
    this.worker.postMessage([
      data,
      this.range.value,
      Number.parseInt(this.dithering.value) / 100,
      Number.parseInt(this.gamma.value) / 100
    ]);

    this.do.disabled = true;
    const worked: Uint8ClampedArray = await new Promise((resolve) => 
      (this.worker.onmessage = (e) => { resolve(e.data) }));
    this.do.disabled = false;

    
    const pixelized = BlobTool.MakeBufferToBlob(worked.buffer);

    this.onQuantized(pixelized, rust.read_palette(
      new Uint8ClampedArray(worked)
    ));
  }
  
  private async makeCanvas(blob: string, pos: {x: number, y: number, dx: number, dy: number, w: number, h: number}): Promise<ImageData> {
    const img = document.createElement('img');
    img.src = blob;
    await new Promise((resolve) => (img.onload = resolve));

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    ctx.drawImage(img, pos.x, pos.y, pos.w, pos.h, 0, 0, pos.dx, pos.dy);
    
    return ctx.getImageData(0, 0, pos.dx, pos.dy);
  }
  private handleRangeChanged() {
    this.do.value = `${this.range.value}색 팔레트 만들기!`;
  }
  private handleModifyRange(i: number) {
    let res = i + Number.parseInt(this.range.value);
    if (res > Number.parseInt(this.range.max)) res = Number.parseInt(this.range.max);
    if (res < Number.parseInt(this.range.min)) res = Number.parseInt(this.range.min);

    this.range.value = res.toString();
    this.handleRangeChanged();
  }
}