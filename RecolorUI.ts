import { PanelUI } from "./panelUI.js";

import { BlobTool } from "./BlobTool.js";

export class RecolorUI extends PanelUI {
  private palette: HTMLDivElement;
  private colors: HTMLInputElement[];

  private naming: HTMLInputElement;

  constructor(root: HTMLDivElement, name: string) {
    super(root);

    const paletteDiv = this.root.querySelector("#palette");
    const namingInput = this.root.querySelector("._top > ._name");

    if (
      !(paletteDiv instanceof HTMLDivElement) ||
      !(namingInput instanceof HTMLInputElement)
    ) throw new Error("RecolorUI must have #palette and ._top > ._name");

    this.palette = paletteDiv;

    this.naming = namingInput;
    this.naming.value = name;
    
    this.colors = [];
  }

  public SetColors(colors: string[]) {
    for (let i = 0; i < colors.length; i++) {
      if (this.colors.length <= i) {
          this.addColor(colors[i], i);
      } else {
          this.colors[i].value = `#${colors[i]}`;
      }
    }
    while (colors.length < this.colors.length) {
      const moved = this.colors.pop();
      if (moved instanceof HTMLInputElement) {
          moved.remove();
      }
    }
  }
  private addColor(color: string, id: number) {
      const newcover = document.createElement('input');
      newcover.type = 'color';
      newcover.value = `#${color}`;
      newcover.id = id.toString();
      newcover.onchange = () => { this.handleColorChanged(newcover) };
      
      this.palette.insertAdjacentElement("beforeend", newcover);
      this.colors.push(newcover);
  }

  private async handleColorChanged(self: HTMLInputElement) {
    const no = Number.parseInt(self.id);
    const color = this.colors[no].value;

    const blob = await BlobTool.ChangePalette(no, color);
    if (blob instanceof Blob) {
        BlobTool.setUItoImage(BlobTool.createUrl(blob));
    }
  }

  public SetName(name: string) {
    this.naming.value = name;
  }

  doMain(): void {
    const a = document.createElement('a');
    a.download = this.naming.value;
    a.href = BlobTool.qurl;
    a.click();
  }
}