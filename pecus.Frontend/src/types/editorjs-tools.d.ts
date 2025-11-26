declare module '@editorjs/checklist' {
  import { BlockTool } from '@editorjs/editorjs';
  export default class Checklist implements BlockTool {
    constructor(config: any);
    render(): HTMLElement;
    save(block: HTMLElement): any;
  }
}

declare module '@editorjs/simple-image' {
  import { BlockTool } from '@editorjs/editorjs';
  export default class SimpleImage implements BlockTool {
    constructor(config: any);
    render(): HTMLElement;
    save(block: HTMLElement): any;
  }
}
