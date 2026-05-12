import { ExtractedColors } from './extractColors';

export interface SemanticColor {
  role: string;
  hex: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace(/^#/, '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function getWcagLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getSaturation(r: number, g: number, b: number): number {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const l = (max + min) / 2;
  
  if (max === min) return 0;
  
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

function euclideanDistance(c1: [number, number, number], c2: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) + Math.pow(c1[1] - c2[1], 2) + Math.pow(c1[2] - c2[2], 2)
  );
}

export function assignRoles(colors: ExtractedColors): SemanticColor[] {
  const bgHex = colors.dominant;
  const [bgR, bgG, bgB] = hexToRgb(bgHex);
  const bgLuminance = getWcagLuminance(bgR, bgG, bgB);
  
  // Synthesize text color based on WCAG luminance
  const textHex = bgLuminance > 0.5 ? '#111111' : '#FAFAFA';
  
  const result: SemanticColor[] = [
    { role: 'bg', hex: bgHex },
    { role: 'text', hex: textHex }
  ];
  
  // Filter out any palette colors that are too close to the text color
  const textRgb = hexToRgb(textHex);
  let remaining = colors.palette.filter(hex => {
    const rgb = hexToRgb(hex);
    return euclideanDistance(rgb, textRgb) >= 30;
  });
  
  if (remaining.length === 0) return result;
  
  // Find primary (most saturated remaining color)
  let primaryIndex = 0;
  let maxSaturation = -1;
  
  for (let i = 0; i < remaining.length; i++) {
    const [r, g, b] = hexToRgb(remaining[i]);
    const sat = getSaturation(r, g, b);
    // If tie, earlier index wins
    if (sat > maxSaturation) {
      maxSaturation = sat;
      primaryIndex = i;
    }
  }
  
  const primaryHex = remaining.splice(primaryIndex, 1)[0];
  result.push({ role: 'primary', hex: primaryHex });
  
  // Assign accent roles to the rest
  remaining.forEach((hex, i) => {
    result.push({ role: `accent-${i + 1}`, hex });
  });
  
  return result;
}
