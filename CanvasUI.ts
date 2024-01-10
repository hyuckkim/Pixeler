import { UI } from "./panelUI.js";

import { BlobTool } from "./BlobTool.js";

export class CanvasUI extends UI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private dx = 0;
  private dy = 0;
  private isPressed = false;

  constructor(root: HTMLCanvasElement) {
    super(root);

    if (!(root instanceof HTMLCanvasElement))
      throw new Error("CanvasUI's root must be a Canvas");
    this.canvas = root;

    const context = this.canvas.getContext("2d");
    if (!(context instanceof CanvasRenderingContext2D))
      throw new Error("CanvasUI's context already used");
    this.ctx = context;
  }

  public Show(): void {
    super.Show();

    this.canvas.width = document.body.clientWidth;
    this.canvas.height = document.body.clientHeight;
    setInterval(() => { this.Draw() }, 34);

    this.canvas.onmousedown = (e) => { this.OnMouseDown(e) };
    this.canvas.onmousemove = (e) => { this.OnMouseMove(e) };
    this.canvas.onmouseup = () => { this.OnMouseUp() };
    this.canvas.onmouseout = () => { this.OnMouseUp() };

    this.canvas.ontouchstart = (e) => { this.OnHandDown(e) };
    this.canvas.ontouchmove = (e) => { this.OnHandMove(e) };
    this.canvas.ontouchend = () => { this.OnHandUp() };
  }
  private Draw() {
    const width = document.body.clientWidth, height = document.body.clientHeight;
    this.canvas.width = width;
    this.canvas.height = height;

    this.ctx.beginPath();
    this.ctx.fillStyle = "#aea5a5";
    this.ctx.rect(0, 0, width, height);

    this.ctx.fill();
    const img = BlobTool.GetImage();
    if (img instanceof HTMLImageElement) {
      this.ctx.drawImage(img, (width - img.width) / 2 + this.dx, (height - img.height) / 2 + this.dy);
    }
  }
  private mouseX = 0;
  private mouseY = 0;
  private OnMouseDown(ev: MouseEvent) {
      this.mouseX = ev.clientX;
      this.mouseY = ev.clientY;

      this.isPressed = true;
  }
  private OnMouseMove(ev: MouseEvent) {
      if (this.isPressed) {
          this.dx += this.mouseX - ev.clientX;
          this.dy += this.mouseY - ev.clientY;
          
          this.mouseX = ev.clientX;
          this.mouseY = ev.clientY;
      }
  }
  private OnMouseUp() {
      this.isPressed = false;
  }
  private OnHandDown(ev: TouchEvent) {
      this.mouseX = ev.touches[0].clientX;
      this.mouseY = ev.touches[0].clientY;

      this.isPressed = true;
      ev.preventDefault();
  }
  private OnHandMove(ev: TouchEvent) {
      if (this.isPressed) {
          this.dx += this.mouseX - ev.touches[0].clientX;
          this.dy += this.mouseY - ev.touches[0].clientY;
          
          this.mouseX = ev.touches[0].clientX;
          this.mouseY = ev.touches[0].clientY;
      }
      ev.preventDefault();
      return false;
  }
  private OnHandUp() {
      this.isPressed = false;
  }
}