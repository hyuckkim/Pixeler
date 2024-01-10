import { PanelUI } from "./panelUI.js";


export class ResizeUI extends PanelUI {
  private width: HTMLInputElement;
  private height: HTMLInputElement;
  private offsetX: HTMLInputElement;
  private offsetY: HTMLInputElement;
  constructor(root: HTMLDivElement) {
    super(root);

    const widthInput = this.root.querySelector("._top > ._width");
    const heightInput = this.root.querySelector("._top > ._height");
    const offsetXInput = this.root.querySelector("._main > ._x");
    const offsetYInput = this.root.querySelector("._main > ._y");

    if (
      !(widthInput instanceof HTMLInputElement) ||
      !(heightInput instanceof HTMLInputElement) ||
      !(offsetXInput instanceof HTMLInputElement) ||
      !(offsetYInput instanceof HTMLInputElement)
    ) throw new Error("ResizeUI must have #widthInput, #heightInput, offsetInputs");

    this.width = widthInput;
    this.height = heightInput;
    this.offsetX = offsetXInput;
    this.offsetY = offsetYInput;
  }

  doMain(): void { }

  public SetSize(width: number, height: number) {
    this.width.value = width.toString();
    this.height.value = height.toString();
  }

  public GetPositions() {
    return {
      x: Number.parseInt(this.offsetX.value),
      y: Number.parseInt(this.offsetY.value),
      w: Number.parseInt(this.width.value),
      h: Number.parseInt(this.height.value)
    }
  }
}