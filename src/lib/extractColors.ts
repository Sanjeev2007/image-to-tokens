import ColorThief from 'color-thief-ts';

function clamp(val: number): number {
  return Math.max(0, Math.min(255, Math.round(val)));
}

function toHex(r: number, g: number, b: number): string {
  const hr = clamp(r).toString(16).padStart(2, '0').toUpperCase();
  const hg = clamp(g).toString(16).padStart(2, '0').toUpperCase();
  const hb = clamp(b).toString(16).padStart(2, '0').toUpperCase();
  return `#${hr}${hg}${hb}`;
}

function euclideanDistance(c1: [number, number, number], c2: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2) + Math.pow(c1[2] - c2[2], 2)
  );
}

function parseColor(c: any): [number, number, number] | null {
  if (!c) return null;
  if (Array.isArray(c) && c.length >= 3) return [c[0], c[1], c[2]];
  if (typeof c === 'object' && 'r' in c && 'g' in c && 'b' in c) return [c.r, c.g, c.b];
  if (typeof c === 'string') {
    const hex = c.replace(/^#/, '');
    if (hex.length >= 6) {
      return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
    }
  }
  return null;
}

export async function extractColors(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        // Fix for color-thief-ts canvas compatibility
        (canvas as any).naturalWidth = img.width;
        (canvas as any).naturalHeight = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not found');
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        const colorThief = new ColorThief();
        const rawPalette = colorThief.getPalette(canvas as any, 8, { quality: 1 });
        console.log('color-thief palette sample:', rawPalette?.[0]);
        
        const normalized = (rawPalette || []).map(parseColor).filter(Boolean) as [number, number, number][];
        const kept: [number, number, number][] = [];
        for (const color of normalized) {
          if (!kept.some(k => euclideanDistance(color, k) < 25)) kept.push(color);
        }
        
        resolve(kept.map(c => toHex(c[0], c[1], c[2])));
        URL.revokeObjectURL(url);
      } catch (e) { reject(e); URL.revokeObjectURL(url); }
    };
    img.src = url;
  });
}
