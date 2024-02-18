import { PanelUI } from "./panelUI.js";

import { BlobTool } from "../BlobTool.js";

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

  public SetColors(colors: Uint8ClampedArray) {
    const splitted = this.splitColors(colors);
    
    for (let i = 0; i < splitted.length; i++) {
      if (this.colors.length <= i) {
          this.addColor(splitted[i], i);
      } else {
          this.colors[i].value = `#${splitted[i]}`;
      }
    }
  
    while (splitted.length < this.colors.length) {
      const moved = this.colors.pop();
      if (moved instanceof HTMLInputElement) {
          moved.remove();
      }
    }
  }
  
  private splitColors(data: Uint8ClampedArray) : string[] {
    return Array.from({ length: data.length / 3 }, (_, i) => {
      const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
      return ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    });
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