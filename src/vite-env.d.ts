/// <reference types="vite/client" />

declare module 'color-thief-ts' {
  export interface PaletteOptions {
    quality?: number;
    colorType?: 'array' | 'hex';
  }
  export default class ColorThief {
    getPalette(sourceImage: HTMLImageElement | HTMLCanvasElement, colorCount: number, opts?: PaletteOptions): any[];
  }
}
