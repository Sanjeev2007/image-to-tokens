import { SemanticColor } from './assignRoles';

export function generateTokensJson(colors: SemanticColor[]): string {
  const colorObj: Record<string, { value: string }> = {};
  colors.forEach(c => {
    colorObj[c.role] = { value: c.hex };
  });

  const tokens = {
    color: colorObj,
    spacing: {
      "1": { value: "4px" },
      "2": { value: "8px" },
      "3": { value: "12px" },
      "4": { value: "16px" }
    },
    radius: {
      sm: { value: "4px" },
      md: { value: "8px" },
      lg: { value: "16px" }
    },
    fontFamily: {
      sans: { value: "system-ui, -apple-system, sans-serif" }
    }
  };

  return JSON.stringify(tokens, null, 2);
}
