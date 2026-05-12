import { SemanticColor } from './assignRoles';

export function generateTokensCss(colors: SemanticColor[]): string {
  const colorLines = colors.map(c => `  --color-${c.role}: ${c.hex};`);
  
  return `:root {
  /* Colors */
${colorLines.join('\n')}

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;

  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
}`;
}
