import { PanelUI } from "./panelUI.js";

import { BlobTool } from "../BlobTool.js";

import * as rust from "../pkg/palette_png.js";
import { position } from "../blob.js";
rust.default();

export class QuantizeUI extends PanelUI {
  private range: HTMLInputElement;
  private dithering: HTMLInputElement;
  private gamma: HTMLInputElement;
  private palette: HTMLDivElement;

  private worker: Worker;
  private onQuantized: (blob: Blob, colors: Uint8ClampedArray) => void;

  constructor(root: HTMLDivElement, onQuantized: (blob: Blob, colors: Uint8ClampedArray) => void) {
    super(root);

    const menuSlider = this.root.querySelector("#menuslider");
    const ditheringSlider = this.root.querySelector("#ditheringslider");
    const gammaSlider = this.root.querySelector("#gammaslider");
    const palette = this.root.querySelector('#palette');

    if (
      !(menuSlider instanceof HTMLInputElement) ||
      !(ditheringSlider instanceof HTMLInputElement) ||
      !(gammaSlider instanceof HTMLInputElement) ||
      !(palette instanceof HTMLDivElement)
    ) throw new Error("QuantizeUI must have three slider: #menuslider, #ditheringslider, gammaslider; and palette");
    
    this.range = menuSlider;
    this.range.onchange = () => { this.handleRangeChanged() }
    this.dithering = ditheringSlider;
    this.gamma = gammaSlider;
    this.palette = palette

    const plusButton = this.root.querySelector("#plusbutton");
    const minusButton = this.root.querySelector("#minusbutton");
    this.addPaletteColor(0, 0, 0);

    if (
      !(plusButton instanceof HTMLInputElement) ||
      !(minusButton instanceof HTMLInputElement)
    ) throw new Error("QuantizeUI must have #plusbutton and #minusbutton");

    plusButton.onclick = () => { this.handleModifyRange(1) }
    minusButton.onclick = () => { this.handleModifyRange(-1) }

    this.worker = new Worker(`wasmworker.js?version=${Date.now()}`, {type: 'module'});
    this.onQuantized = onQuantized;
  }

  async doMain(): Promise<void> {
    const data = await this.makeCanvas(BlobTool.url, position());
    this.worker.postMessage([
      data,
      this.range.value,
      Number.parseInt(this.dithering.value) / 100,
      Number.parseInt(this.gamma.value) / 100,
      this.getPaletteArray() // fixed palette
    ]);

    this.do.disabled = true;
    const worked: Uint8ClampedArray = await new Promise((resolve) => 
      (this.worker.onmessage = (e) => { resolve(e.data) }));
    this.do.disabled = false;

    
    const pixelized = BlobTool.MakeBufferToBlob(worked.buffer as ArrayBuffer);

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
  private renderPalette(colors?: Uint8ClampedArray) {
  this.palette.innerHTML = "";

  // 초기 color가 없으면 하나 만들어둠
  if (!colors || colors.length === 0) {
    this.addPaletteColor(0xff, 0xff, 0xff); // 흰색 기본
    return;
  }

  const count = colors.length / 4;
  for (let i = 0; i < count; i++) {
    const r = colors[i*4 + 0];
    const g = colors[i*4 + 1];
    const b = colors[i*4 + 2];
    const a = colors[i*4 + 3];
    this.addPaletteColor(r, g, b, a);
  }
}
  private addPaletteColor(r: number, g: number, b: number, a = 255) {
    const input = document.createElement("input");
    input.type = "color";
    input.value = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    
    // 마지막 input인지 체크
    input.oninput = () => {
      this.handlePaletteChanged(input);

      // 마지막 input이면 새로운 color 추가
      const inputs = Array.from(this.palette.querySelectorAll<HTMLInputElement>('input[type=color]'));
      if (inputs[inputs.length - 1] === input) {
        this.addPaletteColor(255, 255, 255); // 기본 흰색
      }
    };

    this.palette.appendChild(input);
  }
  private handlePaletteChanged(input: HTMLInputElement) {
    const index = Array.from(this.palette.children).indexOf(input);
    const hex = input.value;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
  }
  private getPaletteArray(): Uint8ClampedArray {
    const inputs = Array.from(this.palette.querySelectorAll<HTMLInputElement>('input[type=color]'));

    // 마지막 input은 제외
    const count = Math.max(0, inputs.length - 1);
    const arr = new Uint8ClampedArray(count * 4);

    for (let i = 0; i < count; i++) {
      const hex = inputs[i].value;
      arr[i*4 + 0] = parseInt(hex.slice(1, 3), 16);
      arr[i*4 + 1] = parseInt(hex.slice(3, 5), 16);
      arr[i*4 + 2] = parseInt(hex.slice(5, 7), 16);
      arr[i*4 + 3] = 255; // alpha 고정
    }

    return arr;
  }
}
  
function toHex(v: number): string {
  return v.toString(16).padStart(2, "0");
}