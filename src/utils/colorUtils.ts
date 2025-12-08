// Basic color conversion and K-Means implementation

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export const rgbToHex = ({ r, g, b }: RGB): string => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

export const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

export const getLuminance = (c: RGB): number => {
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
};

export const lerpColor = (c1: RGB, c2: RGB, t: number): RGB => {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t)
  };
};

export const sortColorsByLuminance = (colors: string[]): string[] => {
  return [...colors].sort((a, b) => {
    return getLuminance(hexToRgb(a)) - getLuminance(hexToRgb(b));
  });
};

// Calculate Euclidean distance between two colors
const colorDistance = (c1: RGB, c2: RGB): number => {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
};

export const extractColors = (
  imageData: ImageData,
  k: number = 5,
  maxIterations: number = 10
): string[] => {
  const pixels: RGB[] = [];
  // Sample pixels to improve performance (step by 4 for RGBA, and skip every Nth pixel)
  const step = 4 * 10; // Sample every 10th pixel

  for (let i = 0; i < imageData.data.length; i += step) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3];

    // Skip transparent or very dark/white pixels if desired, but for now keep all opaque
    if (a >= 128) {
      pixels.push({ r, g, b });
    }
  }

  if (pixels.length === 0) return Array(k).fill('#000000');

  // Initialize centroids randomly
  let centroids: RGB[] = [];
  for (let i = 0; i < k; i++) {
    centroids.push(pixels[Math.floor(Math.random() * pixels.length)]);
  }

  for (let iter = 0; iter < maxIterations; iter++) {
    const clusters: RGB[][] = Array.from({ length: k }, () => []);

    // Assign pixels to closest centroid
    for (const pixel of pixels) {
      let minDist = Infinity;
      let clusterIndex = 0;

      centroids.forEach((centroid, index) => {
        const dist = colorDistance(pixel, centroid);
        if (dist < minDist) {
          minDist = dist;
          clusterIndex = index;
        }
      });

      clusters[clusterIndex].push(pixel);
    }

    // Recalculate centroids
    const newCentroids: RGB[] = [];
    let changed = false;

    for (let i = 0; i < k; i++) {
      const cluster = clusters[i];
      if (cluster.length === 0) {
        newCentroids.push(centroids[i]); // Keep old if empty
        continue;
      }

      const sum = cluster.reduce((acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }), { r: 0, g: 0, b: 0 });
      const newCentroid = {
        r: Math.round(sum.r / cluster.length),
        g: Math.round(sum.g / cluster.length),
        b: Math.round(sum.b / cluster.length)
      };

      if (colorDistance(newCentroid, centroids[i]) > 1) {
        changed = true;
      }
      newCentroids.push(newCentroid);
    }

    centroids = newCentroids;
    if (!changed) break;
  }

  return centroids.map(rgbToHex);
};
