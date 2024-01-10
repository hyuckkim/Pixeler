export class UI {
  protected root: HTMLDivElement;
  public Show(): void {
    this.root.classList.remove("hidden");
  }
  public Hide(): void {
    this.root.classList.add("hidden");
  }

  constructor(root: HTMLDivElement) {
    this.root = root;
  }
}

export abstract class PanelUI extends UI {
  private minimize: HTMLButtonElement;
  protected do: HTMLInputElement;

  constructor(root: HTMLDivElement) {
    super(root);
    this.root = root;

    const minimizeButton = this.root.querySelector("._top > ._minimize");
    if (!(minimizeButton instanceof HTMLButtonElement)) throw new Error("PanelUI Must have the minimize button in > _top > _minimize");
    this.minimize = minimizeButton;
    this.minimize.onclick = () => this.root.classList.toggle("minimized");
  
    const doButton = this.root.querySelector("._top > ._do");
    if (!(doButton instanceof HTMLInputElement)) throw new Error("PanelUI Must have the do button in > _top > _do");
    this.do = doButton;
    this.do.onclick = () => this.doMain();
  }

  abstract doMain(): void;
}
