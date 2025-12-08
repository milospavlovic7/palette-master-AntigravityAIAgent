import { blueNoise32 } from '../blueNoise';
import { clamp } from './common';
import { applyContrastBrightness } from './color';
import { applyBlur } from './filters';

// Bayer Matrices
const bayer4x4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
];

const bayer8x8 = [
    [0, 32, 8, 40, 2, 34, 10, 42],
    [48, 16, 56, 24, 50, 18, 58, 26],
    [12, 44, 4, 36, 14, 46, 6, 38],
    [60, 28, 52, 20, 62, 30, 54, 22],
    [3, 35, 11, 43, 1, 33, 9, 41],
    [51, 19, 59, 27, 49, 17, 57, 25],
    [15, 47, 7, 39, 13, 45, 5, 37],
    [63, 31, 55, 23, 61, 29, 53, 21]
];

export const applyNoiseDither = (
    r: number, g: number, b: number,
    x: number, y: number,
    strength: number,
    grayscale: boolean = true,
    levels: number = 2,
    scale: number = 1
): { r: number, g: number, b: number } => {
    const s = strength / 100;
    const step = 255 / (levels - 1);

    const sx = Math.floor(x / scale);
    const sy = Math.floor(y / scale);

    const noiseVal = (Math.sin(sx * 12.9898 + sy * 78.233) * 43758.5453) % 1;
    const n01 = Math.abs(noiseVal);
    const noise = (n01 - 0.5) * step;

    const ditherFull = (val: number) => {
        const d = val + noise;
        return clamp(Math.round(d / step) * step, 0, 255);
    };

    if (grayscale) {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const res = ditherFull(lum);
        const final = lum * (1 - s) + res * s;
        return { r: final, g: final, b: final };
    } else {
        const dr = ditherFull(r);
        const dg = ditherFull(g);
        const db = ditherFull(b);

        return {
            r: r * (1 - s) + dr * s,
            g: g * (1 - s) + dg * s,
            b: b * (1 - s) + db * s
        };
    }
};

const processPixel = (
    x: number, y: number,
    buffer: Float32Array,
    width: number,
    height: number,
    s: number,
    grayscale: boolean,
    quantize: (v: number) => number,
    kernel: { dx: number, dy: number, factor: number }[],
    errMult: number,
    index: (x: number, y: number) => number
) => {
    const i = index(x, y);
    const oldR = buffer[i];
    const oldG = buffer[i + 1];
    const oldB = buffer[i + 2];

    if (grayscale) {
        const lum = 0.299 * oldR + 0.587 * oldG + 0.114 * oldB;
        const newLum = quantize(lum);
        const finalLum = lum * (1 - s) + newLum * s;

        buffer[i] = finalLum;
        buffer[i + 1] = finalLum;
        buffer[i + 2] = finalLum;

        const err = (lum - newLum) * s * errMult;

        for (const k of kernel) {
            const nx = x + k.dx;
            const ny = y + k.dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const ni = index(nx, ny);
                buffer[ni] += err * k.factor;
                buffer[ni + 1] += err * k.factor;
                buffer[ni + 2] += err * k.factor;
            }
        }
    } else {
        const newR = quantize(oldR);
        const newG = quantize(oldG);
        const newB = quantize(oldB);

        buffer[i] = oldR * (1 - s) + newR * s;
        buffer[i + 1] = oldG * (1 - s) + newG * s;
        buffer[i + 2] = oldB * (1 - s) + newB * s;

        const errR = (oldR - newR) * s * errMult;
        const errG = (oldG - newG) * s * errMult;
        const errB = (oldB - newB) * s * errMult;

        for (const k of kernel) {
            const nx = x + k.dx;
            const ny = y + k.dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const ni = index(nx, ny);
                buffer[ni] += errR * k.factor;
                buffer[ni + 1] += errG * k.factor;
                buffer[ni + 2] += errB * k.factor;
            }
        }
    }
};

const generateScanPath = (w: number, h: number, pattern: string): { x: number, y: number }[] => {
    const path: { x: number, y: number }[] = [];
    if (pattern === 'spiral') {
        let x = 0, y = 0, dx = 1, dy = 0;
        const visited = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i++) {
            path.push({ x, y });
            visited[y * w + x] = 1;
            if (x + dx >= w || x + dx < 0 || y + dy >= h || y + dy < 0 || visited[(y + dy) * w + (x + dx)]) {
                [dx, dy] = [-dy, dx];
            }
            x += dx; y += dy;
        }
    } else if (pattern === 'zig-zag') {
        for (let i = 0; i < w + h - 1; i++) {
            if (i % 2 === 0) {
                let x = i < h ? 0 : i - h + 1;
                let y = i < h ? i : h - 1;
                while (x < w && y >= 0) path.push({ x: x++, y: y-- });
            } else {
                let x = i < w ? i : w - 1;
                let y = i < w ? 0 : i - w + 1;
                while (x >= 0 && y < h) path.push({ x: x--, y: y++ });
            }
        }
    }
    return path;
};

export const applyErrorDiffusionDither = (
    buffer: Float32Array,
    width: number,
    height: number,
    strength: number,
    grayscale: boolean,
    levels: number,
    kernel: { dx: number, dy: number, factor: number }[],
    errorStrength: number = 100,
    scanPattern: 'standard' | 'serpentine' | 'spiral' | 'zig-zag' | 'vertical' | 'hilbert' = 'standard',
    luminanceThreshold: number = 128
) => {
    const s = strength / 100;
    const errMult = errorStrength / 100;
    if (s <= 0) return;

    const step = 255 / (levels - 1);
    const quantize = (val: number) => {
        if (levels === 2) {
            return val >= luminanceThreshold ? 255 : 0;
        }
        return clamp(Math.round(val / step) * step, 0, 255);
    };
    const index = (x: number, y: number) => (y * width + x) * 4;

    if (scanPattern === 'standard') {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                processPixel(x, y, buffer, width, height, s, grayscale, quantize, kernel, errMult, index);
            }
        }
    } else if (scanPattern === 'serpentine') {
        for (let y = 0; y < height; y++) {
            const reverse = y % 2 !== 0;
            if (reverse) {
                const flippedKernel = kernel.map(k => ({ ...k, dx: -k.dx }));
                for (let x = width - 1; x >= 0; x--) {
                    processPixel(x, y, buffer, width, height, s, grayscale, quantize, flippedKernel, errMult, index);
                }
            } else {
                for (let x = 0; x < width; x++) {
                    processPixel(x, y, buffer, width, height, s, grayscale, quantize, kernel, errMult, index);
                }
            }
        }
    } else if (scanPattern === 'vertical') {
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                processPixel(x, y, buffer, width, height, s, grayscale, quantize, kernel, errMult, index);
            }
        }
    } else {
        const path = generateScanPath(width, height, scanPattern);

        for (let i = 0; i < path.length; i++) {
            const { x, y } = path[i];
            const idx = index(x, y);

            const oldR = buffer[idx];
            const oldG = buffer[idx + 1];
            const oldB = buffer[idx + 2];

            let errR = 0, errG = 0, errB = 0;

            if (grayscale) {
                const lum = 0.299 * oldR + 0.587 * oldG + 0.114 * oldB;
                const newLum = quantize(lum);
                const finalLum = lum * (1 - s) + newLum * s;

                buffer[idx] = finalLum;
                buffer[idx + 1] = finalLum;
                buffer[idx + 2] = finalLum;

                const err = (lum - newLum) * s * errMult;
                errR = err; errG = err; errB = err;
            } else {
                const newR = quantize(oldR);
                const newG = quantize(oldG);
                const newB = quantize(oldB);

                buffer[idx] = oldR * (1 - s) + newR * s;
                buffer[idx + 1] = oldG * (1 - s) + newG * s;
                buffer[idx + 2] = oldB * (1 - s) + newB * s;

                errR = (oldR - newR) * s * errMult;
                errG = (oldG - newG) * s * errMult;
                errB = (oldB - newB) * s * errMult;
            }

            if (i < path.length - 1) {
                const next = path[i + 1];
                const nextIdx = index(next.x, next.y);
                buffer[nextIdx] += errR;
                buffer[nextIdx + 1] += errG;
                buffer[nextIdx + 2] += errB;
            }
        }
    }
};

export const applyJJN = (buffer: Float32Array, w: number, h: number, str: number, gray: boolean, lvls: number, errStr: number, scan: any, lumThresh: number) => {
    applyErrorDiffusionDither(buffer, w, h, str, gray, lvls, [
        { dx: 1, dy: 0, factor: 7 / 48 }, { dx: 2, dy: 0, factor: 5 / 48 },
        { dx: -2, dy: 1, factor: 3 / 48 }, { dx: -1, dy: 1, factor: 5 / 48 }, { dx: 0, dy: 1, factor: 7 / 48 }, { dx: 1, dy: 1, factor: 5 / 48 }, { dx: 2, dy: 1, factor: 3 / 48 },
        { dx: -2, dy: 2, factor: 1 / 48 }, { dx: -1, dy: 2, factor: 3 / 48 }, { dx: 0, dy: 2, factor: 5 / 48 }, { dx: 1, dy: 2, factor: 3 / 48 }, { dx: 2, dy: 2, factor: 1 / 48 }
    ], errStr, scan, lumThresh);
};

export const applyStevensonArce = (buffer: Float32Array, w: number, h: number, str: number, gray: boolean, lvls: number, errStr: number, scan: any, lumThresh: number) => {
    applyErrorDiffusionDither(buffer, w, h, str, gray, lvls, [
        { dx: 1, dy: 0, factor: 32 / 200 }, { dx: 2, dy: 0, factor: 12 / 200 },
        { dx: -2, dy: 1, factor: 26 / 200 }, { dx: -1, dy: 1, factor: 30 / 200 }, { dx: 0, dy: 1, factor: 16 / 200 }, { dx: 1, dy: 1, factor: 26 / 200 }, { dx: 2, dy: 1, factor: 12 / 200 },
        { dx: -2, dy: 2, factor: 12 / 200 }, { dx: -1, dy: 2, factor: 26 / 200 }, { dx: 0, dy: 2, factor: 12 / 200 },
        { dx: 0, dy: 3, factor: 5 / 200 }
    ], errStr, scan, lumThresh);
};

export const applyBinaryThreshold = (buffer: Float32Array, _w: number, _h: number, str: number, gray: boolean, _lvls: number, thresh: number) => {
    const s = str / 100;
    const t = thresh;
    for (let i = 0; i < buffer.length; i += 4) {
        const r = buffer[i];
        const g = buffer[i + 1];
        const b = buffer[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const val = lum >= t ? 255 : 0;

        if (gray) {
            buffer[i] = lum * (1 - s) + val * s;
            buffer[i + 1] = lum * (1 - s) + val * s;
            buffer[i + 2] = lum * (1 - s) + val * s;
        } else {
            buffer[i] = r * (1 - s) + (r >= t ? 255 : 0) * s;
            buffer[i + 1] = g * (1 - s) + (g >= t ? 255 : 0) * s;
            buffer[i + 2] = b * (1 - s) + (b >= t ? 255 : 0) * s;
        }
    }
};

export const applyWoodcut = (buffer: Float32Array, w: number, h: number, str: number, gray: boolean, lvls: number, thresh: number) => {
    // Pre-blur to simulate woodcut softness
    const blurred = applyBlur(buffer, w, h, 'gaussian', 1, 0, 100);
    for (let i = 0; i < buffer.length; i++) buffer[i] = blurred[i];

    applyBinaryThreshold(buffer, w, h, str, gray, lvls, thresh);
};

export const applyBlueNoise64 = (
    buffer: Float32Array,
    width: number,
    height: number,
    strength: number,
    grayscale: boolean = true,
    levels: number = 2,
    scale: number = 1
) => {
    const s = strength / 100;
    if (s <= 0) return;

    // Use blueNoise32 but tile it in a way that creates 64x64 non-repeating blocks
    // This is better than maintaining a large 64x64 array file if it was just tiled anyway.
    const map = blueNoise32;
    // const mapSize = 32;
    const step = 255 / (levels - 1);

    const index = (x: number, y: number) => (y * width + x) * 4;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = index(x, y);

            const r = buffer[i];
            const g = buffer[i + 1];
            const b = buffer[i + 2];

            // 64x64 logic:
            // Top Left (0-31, 0-31): Normal
            // Top Right (32-63, 0-31): Flipped X
            // Bottom Left (0-31, 32-63): Flipped Y
            // Bottom Right (32-63, 32-63): Flipped X and Y

            const sx = Math.floor(x / scale);
            const sy = Math.floor(y / scale);

            const qx = Math.floor(sx / 32) % 2;
            const qy = Math.floor(sy / 32) % 2;

            let tx = sx % 32;
            let ty = sy % 32;

            if (qx === 1) tx = 31 - tx;
            if (qy === 1) ty = 31 - ty;

            const noiseValue = (map[ty][tx] / 255) - 0.5;

            const dither = (val: number) => {
                const d = val + noiseValue * step;
                return clamp(Math.round(d / step) * step, 0, 255);
            };

            if (grayscale) {
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                const dithered = dither(lum);
                const final = lum * (1 - s) + dithered * s;

                buffer[i] = final;
                buffer[i + 1] = final;
                buffer[i + 2] = final;
            } else {
                const dr = dither(r);
                const dg = dither(g);
                const db = dither(b);

                buffer[i] = r * (1 - s) + dr * s;
                buffer[i + 1] = g * (1 - s) + dg * s;
                buffer[i + 2] = b * (1 - s) + db * s;
            }
        }
    }
};

export const applyDitherPreProcessing = (
    buffer: Float32Array,
    width: number,
    height: number,
    contrast: number = 0,
    gamma: number = 1.0,
    blurRadius: number = 0,
    invert: boolean = false,
    highlightsCompression: number = 0
) => {
    if (contrast !== 0) {
        for (let i = 0; i < buffer.length; i += 4) {
            const res = applyContrastBrightness(buffer[i], buffer[i + 1], buffer[i + 2], 0, contrast);
            buffer[i] = res.r; buffer[i + 1] = res.g; buffer[i + 2] = res.b;
        }
    }
    if (gamma !== 1.0) {
        for (let i = 0; i < buffer.length; i += 4) {
            buffer[i] = 255 * Math.pow(buffer[i] / 255, 1 / gamma);
            buffer[i + 1] = 255 * Math.pow(buffer[i + 1] / 255, 1 / gamma);
            buffer[i + 2] = 255 * Math.pow(buffer[i + 2] / 255, 1 / gamma);
        }
    }
    if (highlightsCompression > 0) {
        const knee = 1.0 - (highlightsCompression / 100);
        for (let i = 0; i < buffer.length; i += 4) {
            const compress = (v: number) => {
                const n = v / 255;
                if (n <= knee) return v;
                return (knee + (n - knee) / (1 + (n - knee) * 2)) * 255;
            };
            buffer[i] = compress(buffer[i]);
            buffer[i + 1] = compress(buffer[i + 1]);
            buffer[i + 2] = compress(buffer[i + 2]);
        }
    }

    if (invert) {
        for (let i = 0; i < buffer.length; i += 4) {
            buffer[i] = 255 - buffer[i];
            buffer[i + 1] = 255 - buffer[i + 1];
            buffer[i + 2] = 255 - buffer[i + 2];
        }
    }
    if (blurRadius > 0) {
        const blurred = applyBlur(buffer, width, height, 'gaussian', blurRadius, 0, 100);
        for (let i = 0; i < buffer.length; i++) buffer[i] = blurred[i];
    }
};

export const applyAtkinsonDither = (buffer: Float32Array, w: number, h: number, str: number, gray: boolean, lvls: number, errStr: number = 100, scan: any = 'standard', lumThresh: number = 128) => {
    applyErrorDiffusionDither(buffer, w, h, str, gray, lvls, [
        { dx: 1, dy: 0, factor: 1 / 8 }, { dx: 2, dy: 0, factor: 1 / 8 },
        { dx: -1, dy: 1, factor: 1 / 8 }, { dx: 0, dy: 1, factor: 1 / 8 }, { dx: 1, dy: 1, factor: 1 / 8 },
        { dx: 0, dy: 2, factor: 1 / 8 }
    ], errStr, scan, lumThresh);
};

export const applySierraDither = (buffer: Float32Array, w: number, h: number, str: number, gray: boolean, lvls: number, errStr: number = 100, scan: any = 'standard', lumThresh: number = 128) => {
    applyErrorDiffusionDither(buffer, w, h, str, gray, lvls, [
        { dx: 1, dy: 0, factor: 5 / 32 }, { dx: 2, dy: 0, factor: 3 / 32 },
        { dx: -2, dy: 1, factor: 2 / 32 }, { dx: -1, dy: 1, factor: 4 / 32 }, { dx: 0, dy: 1, factor: 5 / 32 }, { dx: 1, dy: 1, factor: 4 / 32 }, { dx: 2, dy: 1, factor: 2 / 32 },
        { dx: -1, dy: 2, factor: 2 / 32 }, { dx: 0, dy: 2, factor: 3 / 32 }, { dx: 1, dy: 2, factor: 2 / 32 }
    ], errStr, scan, lumThresh);
};

export const applySierraLiteDither = (buffer: Float32Array, w: number, h: number, str: number, gray: boolean, lvls: number, errStr: number = 100, scan: any = 'standard', lumThresh: number = 128) => {
    applyErrorDiffusionDither(buffer, w, h, str, gray, lvls, [
        { dx: 1, dy: 0, factor: 2 / 4 },
        { dx: -1, dy: 1, factor: 1 / 4 }, { dx: 0, dy: 1, factor: 1 / 4 }
    ], errStr, scan, lumThresh);
};

export const applyStuckiDither = (buffer: Float32Array, w: number, h: number, str: number, gray: boolean, lvls: number, errStr: number = 100, scan: any = 'standard', lumThresh: number = 128) => {
    applyErrorDiffusionDither(buffer, w, h, str, gray, lvls, [
        { dx: 1, dy: 0, factor: 8 / 42 }, { dx: 2, dy: 0, factor: 4 / 42 },
        { dx: -2, dy: 1, factor: 2 / 42 }, { dx: -1, dy: 1, factor: 4 / 42 }, { dx: 0, dy: 1, factor: 8 / 42 }, { dx: 1, dy: 1, factor: 4 / 42 }, { dx: 2, dy: 1, factor: 2 / 42 },
        { dx: -2, dy: 2, factor: 1 / 42 }, { dx: -1, dy: 2, factor: 2 / 42 }, { dx: 0, dy: 2, factor: 4 / 42 }, { dx: 1, dy: 2, factor: 2 / 42 }, { dx: 2, dy: 2, factor: 1 / 42 }
    ], errStr, scan, lumThresh);
};

export const applyErrorDiffusion1D = (buffer: Float32Array, w: number, h: number, str: number, gray: boolean, lvls: number, errStr: number = 100, scan: any = 'standard', lumThresh: number = 128) => {
    applyErrorDiffusionDither(buffer, w, h, str, gray, lvls, [
        { dx: 1, dy: 0, factor: 1.0 }
    ], errStr, scan, lumThresh);
};

export const applyAdaptiveFS3x3 = (buffer: Float32Array, w: number, h: number, str: number, gray: boolean, lvls: number, errStr: number, scan: any, lumThresh: number) => {
    // Burkes Dither
    applyErrorDiffusionDither(buffer, w, h, str, gray, lvls, [
        { dx: 1, dy: 0, factor: 8 / 32 }, { dx: 2, dy: 0, factor: 4 / 32 },
        { dx: -2, dy: 1, factor: 2 / 32 }, { dx: -1, dy: 1, factor: 4 / 32 }, { dx: 0, dy: 1, factor: 8 / 32 }, { dx: 1, dy: 1, factor: 4 / 32 }, { dx: 2, dy: 1, factor: 2 / 32 }
    ], errStr, scan, lumThresh);
};

export const applyOrderedDither = (
    buffer: Float32Array,
    width: number,
    height: number,
    matrix: 'bayer-4x4' | 'bayer-8x8',
    strength: number,
    grayscale: boolean = true,
    levels: number = 2,
    scale: number = 1
) => {
    const s = strength / 100;
    if (s <= 0) return;

    const map = matrix === 'bayer-8x8' ? bayer8x8 : bayer4x4;
    const mapSize = map.length;
    const step = 255 / (levels - 1);

    const index = (x: number, y: number) => (y * width + x) * 4;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = index(x, y);

            const r = buffer[i];
            const g = buffer[i + 1];
            const b = buffer[i + 2];

            const mx = Math.floor(x / scale) % mapSize;
            const my = Math.floor(y / scale) % mapSize;
            const mapValue = (map[my][mx] / (mapSize * mapSize)) - 0.5;

            const dither = (val: number) => {
                const d = val + mapValue * step;
                return clamp(Math.round(d / step) * step, 0, 255);
            };

            if (grayscale) {
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                const dithered = dither(lum);
                const final = lum * (1 - s) + dithered * s;

                buffer[i] = final;
                buffer[i + 1] = final;
                buffer[i + 2] = final;
            } else {
                const dr = dither(r);
                const dg = dither(g);
                const db = dither(b);

                buffer[i] = r * (1 - s) + dr * s;
                buffer[i + 1] = g * (1 - s) + dg * s;
                buffer[i + 2] = b * (1 - s) + db * s;
            }
        }
    }
};

export const applyBlueNoiseDither = (
    buffer: Float32Array,
    width: number,
    height: number,
    strength: number,
    grayscale: boolean = true,
    levels: number = 2,
    scale: number = 1
) => {
    const s = strength / 100;
    if (s <= 0) return;

    const map = blueNoise32;
    const mapSize = 32;
    const step = 255 / (levels - 1);

    const index = (x: number, y: number) => (y * width + x) * 4;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = index(x, y);

            const r = buffer[i];
            const g = buffer[i + 1];
            const b = buffer[i + 2];

            const mx = Math.floor(x / scale) % mapSize;
            const my = Math.floor(y / scale) % mapSize;
            const noiseValue = (map[my][mx] / 255) - 0.5;

            const dither = (val: number) => {
                const d = val + noiseValue * step;
                return clamp(Math.round(d / step) * step, 0, 255);
            };

            if (grayscale) {
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                const dithered = dither(lum);
                const final = lum * (1 - s) + dithered * s;

                buffer[i] = final;
                buffer[i + 1] = final;
                buffer[i + 2] = final;
            } else {
                const dr = dither(r);
                const dg = dither(g);
                const db = dither(b);

                buffer[i] = r * (1 - s) + dr * s;
                buffer[i + 1] = g * (1 - s) + dg * s;
                buffer[i + 2] = b * (1 - s) + db * s;
            }
        }
    }
};

export const applyFloydSteinberg = (
    buffer: Float32Array,
    width: number,
    height: number,
    strength: number,
    grayscale: boolean = true,
    levels: number = 2,
    errStr: number = 100,
    scan: any = 'standard',
    lumThresh: number = 128
) => {
    applyErrorDiffusionDither(buffer, width, height, strength, grayscale, levels, [
        { dx: 1, dy: 0, factor: 7 / 16 },
        { dx: -1, dy: 1, factor: 3 / 16 }, { dx: 0, dy: 1, factor: 5 / 16 }, { dx: 1, dy: 1, factor: 1 / 16 }
    ], errStr, scan, lumThresh);
};

export const applyVoidClusterDither = (
    buffer: Float32Array,
    width: number,
    height: number,
    strength: number,
    grayscale: boolean = true,
    levels: number = 2,
    scale: number = 1
) => {
    // Inverted Blue Noise logic
    const s = strength / 100;
    if (s <= 0) return;

    const map = blueNoise32;
    const mapSize = 32;
    const step = 255 / (levels - 1);

    const index = (x: number, y: number) => (y * width + x) * 4;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = index(x, y);

            const r = buffer[i];
            const g = buffer[i + 1];
            const b = buffer[i + 2];

            const mx = Math.floor(x / scale) % mapSize;
            const my = Math.floor(y / scale) % mapSize;
            // Invert noise
            const noiseValue = ((255 - map[my][mx]) / 255) - 0.5;

            const dither = (val: number) => {
                const d = val + noiseValue * step;
                return clamp(Math.round(d / step) * step, 0, 255);
            };

            if (grayscale) {
                const lum = 0.299 * r + 0.587 * g + 0.114 * b;
                const dithered = dither(lum);
                const final = lum * (1 - s) + dithered * s;

                buffer[i] = final;
                buffer[i + 1] = final;
                buffer[i + 2] = final;
            } else {
                const dr = dither(r);
                const dg = dither(g);
                const db = dither(b);

                buffer[i] = r * (1 - s) + dr * s;
                buffer[i + 1] = g * (1 - s) + dg * s;
                buffer[i + 2] = b * (1 - s) + db * s;
            }
        }
    }
};
