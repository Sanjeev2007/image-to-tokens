import { SemanticColor } from './assignRoles';

export function generateTailwindConfig(colors: SemanticColor[]): string {
  const colorEntries = colors.map(c => `        '${c.role}': '${c.hex}',`).join('\n');
  
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
${colorEntries}
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '16px',
      },
      fontFamily: {
        'sans': ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};`;
}
