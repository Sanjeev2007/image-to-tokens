import ColorThief from 'color-thief-ts';

export async function extractColors(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas context not found');
        }
        
        // Letterbox fit - preserve aspect ratio
        const scale = Math.min(300 / img.width, 300 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (300 - w) / 2;
        const y = (300 - h) / 2;
        
        ctx.drawImage(img, x, y, w, h);
        
        // Convert back to image for ColorThief
        const resizedImg = new Image();
        resizedImg.onload = () => {
          try {
            const colorThief = new ColorThief();
            const palette = colorThief.getPalette(resizedImg, 8);
            
            const hexColors = palette.map(([r, g, b]) => {
              const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
              return `#${hex}`;
            });
            
            URL.revokeObjectURL(url);
            resolve(hexColors);
          } catch (e) {
            URL.revokeObjectURL(url);
            reject(e);
          }
        };
        resizedImg.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load resized image'));
        };
        resizedImg.src = canvas.toDataURL('image/png');
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}
