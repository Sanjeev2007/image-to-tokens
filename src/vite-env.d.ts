/// <reference types="vite/client" />

declare module 'color-thief-ts' {
  export default class ColorThief {
    getPalette(sourceImage: HTMLImageElement, colorCount: number): [number, number, number][];
  }
}
