import { clamp } from './common';

export const applyBlur = (
    buffer: Float32Array,
    width: number,
    height: number,
    type: 'gaussian' | 'box' | 'motion',
    radius: number,
    angle: number,
    intensity: number = 100
): Float32Array => {
    if (radius <= 0) return new Float32Array(buffer);
    const newBuffer = new Float32Array(buffer.length);
    const r = Math.ceil(radius);

    if (type === 'motion') {
        const rad = angle * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let rAcc = 0, gAcc = 0, bAcc = 0, count = 0;
                for (let i = -r; i <= r; i++) {
                    const nx = Math.round(x + i * cos);
                    const ny = Math.round(y + i * sin);

                    const cx = clamp(nx, 0, width - 1);
                    const cy = clamp(ny, 0, height - 1);

                    const idx = (cy * width + cx) * 4;
                    rAcc += buffer[idx];
                    gAcc += buffer[idx + 1];
                    bAcc += buffer[idx + 2];
                    count++;
                }
                const idx = (y * width + x) * 4;
                newBuffer[idx] = rAcc / count;
                newBuffer[idx + 1] = gAcc / count;
                newBuffer[idx + 2] = bAcc / count;
                newBuffer[idx + 3] = buffer[idx + 3];
            }
        }
    } else {
        // Generate Kernel
        let kernel: number[] = [];
        if (type === 'gaussian') {
            const sigma = radius / 2;
            const kSize = 2 * r + 1;
            let sum = 0;
            for (let i = 0; i < kSize; i++) {
                const x = i - r;
                const w = Math.exp(-(x * x) / (2 * sigma * sigma));
                kernel.push(w);
                sum += w;
            }
            for (let i = 0; i < kSize; i++) kernel[i] /= sum;
        }

        const tempBuffer = new Float32Array(buffer.length);

        // Horizontal Pass
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let rAcc = 0, gAcc = 0, bAcc = 0;
                let weightSum = 0;

                for (let dx = -r; dx <= r; dx++) {
                    const nx = clamp(x + dx, 0, width - 1);
                    const idx = (y * width + nx) * 4;
                    const weight = type === 'gaussian' ? kernel[dx + r] : 1;

                    rAcc += buffer[idx] * weight;
                    gAcc += buffer[idx + 1] * weight;
                    bAcc += buffer[idx + 2] * weight;
                    weightSum += weight;
                }

                const idx = (y * width + x) * 4;
                if (type === 'box') {
                    tempBuffer[idx] = rAcc / weightSum;
                    tempBuffer[idx + 1] = gAcc / weightSum;
                    tempBuffer[idx + 2] = bAcc / weightSum;
                } else {
                    tempBuffer[idx] = rAcc;
                    tempBuffer[idx + 1] = gAcc;
                    tempBuffer[idx + 2] = bAcc;
                }
                tempBuffer[idx + 3] = buffer[idx + 3];
            }
        }

        // Vertical Pass
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let rAcc = 0, gAcc = 0, bAcc = 0;
                let weightSum = 0;

                for (let dy = -r; dy <= r; dy++) {
                    const ny = clamp(y + dy, 0, height - 1);
                    const idx = (ny * width + x) * 4;
                    const weight = type === 'gaussian' ? kernel[dy + r] : 1;

                    rAcc += tempBuffer[idx] * weight;
                    gAcc += tempBuffer[idx + 1] * weight;
                    bAcc += tempBuffer[idx + 2] * weight;
                    weightSum += weight;
                }

                const idx = (y * width + x) * 4;
                if (type === 'box') {
                    newBuffer[idx] = rAcc / weightSum;
                    newBuffer[idx + 1] = gAcc / weightSum;
                    newBuffer[idx + 2] = bAcc / weightSum;
                } else {
                    newBuffer[idx] = rAcc;
                    newBuffer[idx + 1] = gAcc;
                    newBuffer[idx + 2] = bAcc;
                }
                newBuffer[idx + 3] = tempBuffer[idx + 3];
            }
        }
    }

    if (intensity < 100) {
        const s = intensity / 100;
        for (let i = 0; i < buffer.length; i++) {
            newBuffer[i] = buffer[i] * (1 - s) + newBuffer[i] * s;
        }
    }
    return newBuffer;
};

export const applySharpen = (
    buffer: Float32Array,
    width: number,
    height: number,
    amount: number,
    method: 'standard' | 'unsharp-mask' | 'laplacian',
    radius: number,
    threshold: number
): Float32Array => {
    const newBuffer = new Float32Array(buffer.length);
    const amt = amount / 100;

    if (method === 'laplacian') {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                let rAcc = 0, gAcc = 0, bAcc = 0;

                const kernel = [
                    0, -1, 0,
                    -1, 5, -1,
                    0, -1, 0
                ];

                let kIdx = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const nx = clamp(x + kx, 0, width - 1);
                        const ny = clamp(y + ky, 0, height - 1);
                        const nIdx = (ny * width + nx) * 4;
                        const weight = kernel[kIdx++];

                        rAcc += buffer[nIdx] * weight;
                        gAcc += buffer[nIdx + 1] * weight;
                        bAcc += buffer[nIdx + 2] * weight;
                    }
                }

                const r = buffer[idx];
                const g = buffer[idx + 1];
                const b = buffer[idx + 2];

                newBuffer[idx] = clamp(r * (1 - amt) + rAcc * amt, 0, 255);
                newBuffer[idx + 1] = clamp(g * (1 - amt) + gAcc * amt, 0, 255);
                newBuffer[idx + 2] = clamp(b * (1 - amt) + bAcc * amt, 0, 255);
                newBuffer[idx + 3] = buffer[idx + 3];
            }
        }
    } else {
        const blurred = applyBlur(buffer, width, height, 'gaussian', radius, 0, 100);
        for (let i = 0; i < buffer.length; i += 4) {
            const r = buffer[i];
            const g = buffer[i + 1];
            const b = buffer[i + 2];

            const br = blurred[i];
            const bg = blurred[i + 1];
            const bb = blurred[i + 2];

            if (Math.abs(r - br) > threshold) newBuffer[i] = clamp(r + (r - br) * amt, 0, 255);
            else newBuffer[i] = r;

            if (Math.abs(g - bg) > threshold) newBuffer[i + 1] = clamp(g + (g - bg) * amt, 0, 255);
            else newBuffer[i + 1] = g;

            if (Math.abs(b - bb) > threshold) newBuffer[i + 2] = clamp(b + (b - bb) * amt, 0, 255);
            else newBuffer[i + 2] = b;

            newBuffer[i + 3] = buffer[i + 3];
        }
    }
    return newBuffer;
};

export const applyAntialias = (
    buffer: Float32Array,
    width: number,
    height: number,
    strength: number,
    threshold: number,
    iterations: number
): Float32Array => {
    let currentBuffer = new Float32Array(buffer);
    const s = strength / 100;

    for (let iter = 0; iter < iterations; iter++) {
        const nextBuffer = new Float32Array(currentBuffer.length);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                let rAcc = 0, gAcc = 0, bAcc = 0, count = 0;

                const neighbors = [
                    { dx: 0, dy: -1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }
                ];

                for (const n of neighbors) {
                    const nx = x + n.dx;
                    const ny = y + n.dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const ni = (ny * width + nx) * 4;
                        rAcc += currentBuffer[ni];
                        gAcc += currentBuffer[ni + 1];
                        bAcc += currentBuffer[ni + 2];
                        count++;
                    }
                }

                const avgR = rAcc / count;
                const avgG = gAcc / count;
                const avgB = bAcc / count;

                const diff = Math.abs(currentBuffer[i] - avgR) + Math.abs(currentBuffer[i + 1] - avgG) + Math.abs(currentBuffer[i + 2] - avgB);

                if (diff > threshold) {
                    nextBuffer[i] = currentBuffer[i] * (1 - s) + avgR * s;
                    nextBuffer[i + 1] = currentBuffer[i + 1] * (1 - s) + avgG * s;
                    nextBuffer[i + 2] = currentBuffer[i + 2] * (1 - s) + avgB * s;
                } else {
                    nextBuffer[i] = currentBuffer[i];
                    nextBuffer[i + 1] = currentBuffer[i + 1];
                    nextBuffer[i + 2] = currentBuffer[i + 2];
                }
                nextBuffer[i + 3] = currentBuffer[i + 3];
            }
        }
        currentBuffer = nextBuffer;
    }
    return currentBuffer;
};

export const applyGlow = (
    buffer: Float32Array,
    width: number,
    height: number,
    radius: number,
    strength: number,
    threshold: number,
    feather: number = 0
): Float32Array => {
    const blurred = applyBlur(buffer, width, height, 'gaussian', radius, 0, 100);
    const newBuffer = new Float32Array(buffer.length);
    const s = strength / 100;

    // Threshold and Feather Logic
    const t = (threshold / 100) * 255;
    const f = (feather / 100) * 255;

    const tMin = t - f / 2;
    const tMax = t + f / 2;
    const range = tMax - tMin;

    for (let i = 0; i < buffer.length; i += 4) {
        const r = buffer[i];
        const g = buffer[i + 1];
        const b = buffer[i + 2];

        const br = blurred[i];
        const bg = blurred[i + 1];
        const bb = blurred[i + 2];

        const lum = 0.299 * br + 0.587 * bg + 0.114 * bb;

        let alpha = 0;
        if (f === 0) {
            alpha = lum > t ? 1 : 0;
        } else {
            if (lum <= tMin) alpha = 0;
            else if (lum >= tMax) alpha = 1;
            else {
                const n = (lum - tMin) / range;
                alpha = n * n * (3 - 2 * n);
            }
        }

        if (alpha > 0) {
            const glowR = 255 - (255 - r) * (255 - br * s) / 255;
            const glowG = 255 - (255 - g) * (255 - bg * s) / 255;
            const glowB = 255 - (255 - b) * (255 - bb * s) / 255;

            newBuffer[i] = r * (1 - alpha) + glowR * alpha;
            newBuffer[i + 1] = g * (1 - alpha) + glowG * alpha;
            newBuffer[i + 2] = b * (1 - alpha) + glowB * alpha;
        } else {
            newBuffer[i] = r;
            newBuffer[i + 1] = g;
            newBuffer[i + 2] = b;
        }
        newBuffer[i + 3] = buffer[i + 3];
    }
    return newBuffer;
};
