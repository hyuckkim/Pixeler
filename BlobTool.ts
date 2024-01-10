import * as rust from "./pkg/palette_png.js";
rust.default();

type rgbColor = {r: number, g: number, b:number};
export class BlobTool {
  public static data: Blob | undefined = undefined;
  private static image: HTMLImageElement | undefined = undefined;
  public static url = "";
  public static qurl = "";

  public static async ChangePalette(id: number, color: string): Promise<Blob | undefined> {
      if (!(BlobTool.data instanceof Blob)) return undefined;
      const rgb = this.getRGB(color);
      const buffer = await BlobTool.data.arrayBuffer();
      const data = new Uint8ClampedArray(buffer);
      const newdata = rust.change_palette(data, id, rgb.r, rgb.g, rgb.b);

      BlobTool.data = BlobTool.MakeBufferToBlob(newdata);
      return BlobTool.data;
  }
  public static MakeBufferToBlob(data: ArrayBuffer): Blob {
      const blob = new Blob([data], {type:'image/*'});
      BlobTool.data = blob;
      return blob;
  }
  public static async GetImage(): Promise<HTMLImageElement | undefined> {
      if (this.image instanceof HTMLImageElement) return this.image;
      else await this.UpdateImage();

      return this.image;
  }
  public static async UpdateImage() {
      if (this.data instanceof Blob) {
          this.qurl = this.createUrl(this.data);
      }
      if (this.qurl != "") {
          this.image = new Image();
          this.image.src = this.qurl;

          await this.WaitImage(this.image);
          return this.image;
      }
      if (this.url != "") {
          this.image = new Image();
          this.image.src = this.url;

          await this.WaitImage(this.image);
          return this.image;
      }
  }
  public static async WaitImage(image: HTMLImageElement) {
    return new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onabort = reject;
    });
  }

  public static async setUItoImage(imageUrl: string) {
    this.qurl = imageUrl;
    await this.UpdateImage();
  }

  public static createUrl(blob: Blob): string {
    const urlCreator = window.URL || window.webkitURL;
    const imageUrl = urlCreator.createObjectURL(blob);
    return imageUrl;
  }

  private static getRGB(color: string): rgbColor {
      return {
          r: Number.parseInt(`0x${color[1]}${color[2]}`),
          g: Number.parseInt(`0x${color[3]}${color[4]}`),
          b: Number.parseInt(`0x${color[5]}${color[6]}`)
      };
  }
}