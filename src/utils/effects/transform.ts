import { clamp, rgbToHsl } from './common';

export const resizeBuffer = (
    buffer: Float32Array,
    width: number,
    height: number,
    newWidth: number,
    newHeight: number
): Float32Array => {
    const newBuffer = new Float32Array(newWidth * newHeight * 4);
    const xRatio = width / newWidth;
    const yRatio = height / newHeight;

    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            const srcX = Math.min(Math.floor(x * xRatio), width - 1);
            const srcY = Math.min(Math.floor(y * yRatio), height - 1);
            const srcIdx = (srcY * width + srcX) * 4;
            const dstIdx = (y * newWidth + x) * 4;

            newBuffer[dstIdx] = buffer[srcIdx];
            newBuffer[dstIdx + 1] = buffer[srcIdx + 1];
            newBuffer[dstIdx + 2] = buffer[srcIdx + 2];
            newBuffer[dstIdx + 3] = buffer[srcIdx + 3] !== undefined ? buffer[srcIdx + 3] : 255;
        }
    }
    return newBuffer;
};

export const applyPixelSort = (
    buffer: Float32Array,
    width: number,
    height: number,
    mode: 'brightness' | 'hue' | 'saturation' | 'intensity' | 'red' | 'green' | 'blue',
    direction: 'horizontal' | 'vertical',
    thresholdLow: number,
    thresholdHigh: number,
    reverse: boolean
): Float32Array => {
    const newBuffer = new Float32Array(buffer);

    const getVal = (r: number, g: number, b: number) => {
        if (mode === 'brightness') return 0.299 * r + 0.587 * g + 0.114 * b;
        if (mode === 'hue') return rgbToHsl(r, g, b).h;
        if (mode === 'saturation') return rgbToHsl(r, g, b).s;
        if (mode === 'intensity') return (r + g + b) / 3;
        if (mode === 'red') return r;
        if (mode === 'green') return g;
        if (mode === 'blue') return b;
        return 0;
    };

    const sortLine = (line: number[]) => {
        const pixels: { r: number, g: number, b: number, a: number, v: number }[] = [];
        for (let i = 0; i < line.length; i += 4) {
            pixels.push({
                r: line[i], g: line[i + 1], b: line[i + 2], a: line[i + 3],
                v: getVal(line[i], line[i + 1], line[i + 2])
            });
        }

        let start = 0;
        while (start < pixels.length) {
            if (pixels[start].v >= thresholdLow && pixels[start].v <= thresholdHigh) {
                let end = start + 1;
                while (end < pixels.length && pixels[end].v >= thresholdLow && pixels[end].v <= thresholdHigh) {
                    end++;
                }
                const segment = pixels.slice(start, end);
                segment.sort((a, b) => reverse ? b.v - a.v : a.v - b.v);
                for (let k = 0; k < segment.length; k++) {
                    pixels[start + k] = segment[k];
                }
                start = end;
            } else {
                start++;
            }
        }

        const res = [];
        for (const p of pixels) {
            res.push(p.r, p.g, p.b, p.a);
        }
        return res;
    };

    if (direction === 'horizontal') {
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                row.push(newBuffer[i], newBuffer[i + 1], newBuffer[i + 2], newBuffer[i + 3]);
            }
            const sortedRow = sortLine(row);
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                newBuffer[i] = sortedRow[x * 4];
                newBuffer[i + 1] = sortedRow[x * 4 + 1];
                newBuffer[i + 2] = sortedRow[x * 4 + 2];
                newBuffer[i + 3] = sortedRow[x * 4 + 3];
            }
        }
    } else {
        for (let x = 0; x < width; x++) {
            const col = [];
            for (let y = 0; y < height; y++) {
                const i = (y * width + x) * 4;
                col.push(newBuffer[i], newBuffer[i + 1], newBuffer[i + 2], newBuffer[i + 3]);
            }
            const sortedCol = sortLine(col);
            for (let y = 0; y < height; y++) {
                const i = (y * width + x) * 4;
                newBuffer[i] = sortedCol[y * 4];
                newBuffer[i + 1] = sortedCol[y * 4 + 1];
                newBuffer[i + 2] = sortedCol[y * 4 + 2];
                newBuffer[i + 3] = sortedCol[y * 4 + 3];
            }
        }
    }

    return newBuffer;
};

export const applyHalftone = (
    buffer: Float32Array,
    width: number,
    height: number,
    shape: 'circle' | 'square' | 'line',
    size: number,
    angle: number,
    contrast: number,
    colorMode: 'mono' | 'cmyk' | 'rgb',
    invert: boolean = false,
    intensity: number = 100
): Float32Array => {
    const newBuffer = new Float32Array(buffer.length);
    const rad = (angle * Math.PI) / 180;
    const sin = Math.sin(rad);
    const cos = Math.cos(rad);
    const cellSize = Math.max(2, size);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const rx = x * cos - y * sin;
            const ry = x * sin + y * cos;

            const cx = Math.floor(rx / cellSize) * cellSize;
            const cy = Math.floor(ry / cellSize) * cellSize;

            const srcX = Math.round(cx * cos + cy * sin);
            const srcY = Math.round(-cx * sin + cy * cos);

            const sx = clamp(srcX, 0, width - 1);
            const sy = clamp(srcY, 0, height - 1);
            const i = (sy * width + sx) * 4;

            const r = buffer[i];
            const g = buffer[i + 1];
            const b = buffer[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            const dx = (rx - cx) / cellSize;
            const dy = (ry - cy) / cellSize;
            const dist = Math.sqrt((dx - 0.5) ** 2 + (dy - 0.5) ** 2) * 2;

            let threshold = 0;
            if (shape === 'circle') {
                threshold = 1 - dist;
            } else if (shape === 'square') {
                threshold = 1 - Math.max(Math.abs(dx - 0.5), Math.abs(dy - 0.5)) * 2;
            } else if (shape === 'line') {
                threshold = 1 - Math.abs(dy - 0.5) * 2;
            }

            threshold = (threshold - 0.5) * (1 + contrast / 100) + 0.5;

            const val = (lum / 255) < threshold ? 0 : 255;

            const destI = (y * width + x) * 4;
            if (colorMode === 'mono') {
                newBuffer[destI] = val;
                newBuffer[destI + 1] = val;
                newBuffer[destI + 2] = val;
            } else if (colorMode === 'cmyk') {
                const c = 255 - r;
                const m = 255 - g;
                const yVal = 255 - b;
                const k = 255 - Math.max(r, g, b);

                const kThresh = (k / 255) > threshold ? 0 : 255;

                newBuffer[destI] = (c / 255) > threshold ? 0 : 255;
                newBuffer[destI + 1] = (m / 255) > threshold ? 0 : 255;
                newBuffer[destI + 2] = (yVal / 255) > threshold ? 0 : 255;

                if (kThresh === 0) {
                    newBuffer[destI] = 0;
                    newBuffer[destI + 1] = 0;
                    newBuffer[destI + 2] = 0;
                }

                newBuffer[destI] = 255 - newBuffer[destI];
                newBuffer[destI + 1] = 255 - newBuffer[destI + 1];
                newBuffer[destI + 2] = 255 - newBuffer[destI + 2];

            } else {
                newBuffer[destI] = (r / 255) < threshold ? 0 : r;
                newBuffer[destI + 1] = (g / 255) < threshold ? 0 : g;
                newBuffer[destI + 2] = (b / 255) < threshold ? 0 : b;
            }

            if (invert) {
                newBuffer[destI] = 255 - newBuffer[destI];
                newBuffer[destI + 1] = 255 - newBuffer[destI + 1];
                newBuffer[destI + 2] = 255 - newBuffer[destI + 2];
            }
            newBuffer[destI + 3] = 255;
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

export const applyDatamosh = (
    buffer: Float32Array,
    width: number,
    height: number,
    mode: 'smear' | 'block-shift' | 'interlace' | 'jitter' | 'slice' | 'compression' | 'echo' | 'vector-warp',
    threshold: number,
    strength: number,
    blockSize: number,
    angle: number
): Float32Array => {
    const newBuffer = new Float32Array(buffer);
    const s = strength / 100;

    if (mode === 'smear') {
        const rad = angle * Math.PI / 180;
        const dx = Math.cos(rad);
        const dy = Math.sin(rad);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;

                const px = clamp(Math.round(x - dx), 0, width - 1);
                const py = clamp(Math.round(y - dy), 0, height - 1);
                const pi = (py * width + px) * 4;

                const lum = 0.299 * buffer[i] + 0.587 * buffer[i + 1] + 0.114 * buffer[i + 2];
                if (lum < threshold) {
                    newBuffer[i] = newBuffer[pi] * s + buffer[i] * (1 - s);
                    newBuffer[i + 1] = newBuffer[pi + 1] * s + buffer[i + 1] * (1 - s);
                    newBuffer[i + 2] = newBuffer[pi + 2] * s + buffer[i + 2] * (1 - s);
                }
            }
        }
    } else if (mode === 'block-shift') {
        const bs = Math.max(4, blockSize);
        const shiftAmount = Math.floor(s * 50);

        for (let y = 0; y < height; y += bs) {
            for (let x = 0; x < width; x += bs) {
                if (Math.random() > 0.8) {
                    const shiftX = (Math.random() - 0.5) * shiftAmount;
                    const shiftY = (Math.random() - 0.5) * shiftAmount;

                    for (let by = 0; by < bs; by++) {
                        for (let bx = 0; bx < bs; bx++) {
                            const cy = y + by;
                            const cx = x + bx;
                            if (cy >= height || cx >= width) continue;

                            const srcX = clamp(Math.round(cx - shiftX), 0, width - 1);
                            const srcY = clamp(Math.round(cy - shiftY), 0, height - 1);

                            const dstI = (cy * width + cx) * 4;
                            const srcI = (srcY * width + srcX) * 4;

                            newBuffer[dstI] = buffer[srcI];
                            newBuffer[dstI + 1] = buffer[srcI + 1];
                            newBuffer[dstI + 2] = buffer[srcI + 2];
                        }
                    }
                }
            }
        }
    } else if (mode === 'interlace') {
        const shift = Math.floor(s * 20);
        for (let y = 0; y < height; y++) {
            const isEven = y % 2 === 0;
            const xShift = isEven ? shift : -shift;

            for (let x = 0; x < width; x++) {
                const srcX = clamp(x - xShift, 0, width - 1);
                const dstI = (y * width + x) * 4;
                const srcI = (y * width + srcX) * 4;

                newBuffer[dstI] = buffer[srcI];
                newBuffer[dstI + 1] = buffer[srcI + 1];
                newBuffer[dstI + 2] = buffer[srcI + 2];
            }
        }
    } else if (mode === 'jitter') {
        const amount = s * 10;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const jx = (Math.random() - 0.5) * amount;
                const jy = (Math.random() - 0.5) * amount;

                const srcX = clamp(Math.round(x + jx), 0, width - 1);
                const srcY = clamp(Math.round(y + jy), 0, height - 1);

                const dstI = (y * width + x) * 4;
                const srcI = (srcY * width + srcX) * 4;

                newBuffer[dstI] = buffer[srcI];
                newBuffer[dstI + 1] = buffer[srcI + 1];
                newBuffer[dstI + 2] = buffer[srcI + 2];
            }
        }
    } else if (mode === 'slice') {
        const sliceHeight = Math.max(1, blockSize);
        const maxShift = s * 100;

        for (let y = 0; y < height; y += sliceHeight) {
            const shift = (Math.random() - 0.5) * maxShift;
            for (let sy = 0; sy < sliceHeight; sy++) {
                const cy = y + sy;
                if (cy >= height) break;

                for (let x = 0; x < width; x++) {
                    const srcX = clamp(Math.round(x - shift), 0, width - 1);
                    const dstI = (cy * width + x) * 4;
                    const srcI = (cy * width + srcX) * 4;

                    newBuffer[dstI] = buffer[srcI];
                    newBuffer[dstI + 1] = buffer[srcI + 1];
                    newBuffer[dstI + 2] = buffer[srcI + 2];
                }
            }
        }
    } else if (mode === 'compression') {
        const bs = Math.max(4, blockSize);
        for (let y = 0; y < height; y += bs) {
            for (let x = 0; x < width; x += bs) {
                let rAcc = 0, gAcc = 0, bAcc = 0, count = 0;
                for (let by = 0; by < bs; by++) {
                    for (let bx = 0; bx < bs; bx++) {
                        if (y + by < height && x + bx < width) {
                            const idx = ((y + by) * width + (x + bx)) * 4;
                            rAcc += buffer[idx];
                            gAcc += buffer[idx + 1];
                            bAcc += buffer[idx + 2];
                            count++;
                        }
                    }
                }
                const avgR = rAcc / count;
                const avgG = gAcc / count;
                const avgB = bAcc / count;

                const q = Math.max(1, threshold);
                const qR = Math.round(avgR / q) * q;
                const qG = Math.round(avgG / q) * q;
                const qB = Math.round(avgB / q) * q;

                for (let by = 0; by < bs; by++) {
                    for (let bx = 0; bx < bs; bx++) {
                        if (y + by < height && x + bx < width) {
                            const idx = ((y + by) * width + (x + bx)) * 4;
                            newBuffer[idx] = buffer[idx] * (1 - s) + qR * s;
                            newBuffer[idx + 1] = buffer[idx + 1] * (1 - s) + qG * s;
                            newBuffer[idx + 2] = buffer[idx + 2] * (1 - s) + qB * s;
                        }
                    }
                }
            }
        }
    } else if (mode === 'echo') {
        const offset = Math.floor(s * 50);
        const rad = angle * Math.PI / 180;
        const dx = Math.round(Math.cos(rad) * offset);
        const dy = Math.round(Math.sin(rad) * offset);

        for (let i = 0; i < buffer.length; i += 4) {
            const x = (i / 4) % width;
            const y = Math.floor((i / 4) / width);

            const sx = clamp(x - dx, 0, width - 1);
            const sy = clamp(y - dy, 0, height - 1);
            const si = (sy * width + sx) * 4;

            newBuffer[i] = Math.max(buffer[i], buffer[si] * 0.8);
            newBuffer[i + 1] = Math.max(buffer[i + 1], buffer[si + 1] * 0.8);
            newBuffer[i + 2] = Math.max(buffer[i + 2], buffer[si + 2] * 0.8);
        }
    } else if (mode === 'vector-warp') {
        const freq = blockSize / 100;
        const amp = s * 50;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dstI = (y * width + x) * 4;

                const offsetX = Math.sin(y * freq) * amp;
                const offsetY = Math.cos(x * freq) * amp;

                const srcX = clamp(Math.round(x + offsetX), 0, width - 1);
                const srcY = clamp(Math.round(y + offsetY), 0, height - 1);
                const srcI = (srcY * width + srcX) * 4;

                newBuffer[dstI] = buffer[srcI];
                newBuffer[dstI + 1] = buffer[srcI + 1];
                newBuffer[dstI + 2] = buffer[srcI + 2];
            }
        }
    }
    return newBuffer;
};

export const applyGlitch = (
    buffer: Float32Array,
    width: number,
    height: number,
    mode: 'rgb-split' | 'scanlines' | 'noise' | 'digital-distortion' | 'crt',
    amount: number,
    seed: number,
    iterations: number,
    quality: number,
    distortionX: number = 50,
    distortionY: number = 50,
    colCrunch: number = 50,
    scanlineIntensity: number = 50,
    vignetteStrength: number = 50,
    aberrationStrength: number = 50,
    noiseStrength: number = 30
): Float32Array => {
    const newBuffer = new Float32Array(buffer);
    const a = amount / 100;
    const s = seed / 100;

    for (let k = 0; k < iterations; k++) {
        const iterOffset = k * 5;

        if (mode === 'rgb-split') {
            const offset = Math.floor(a * 30) + 1 + iterOffset;
            const temp = new Float32Array(newBuffer);
            for (let i = 0; i < buffer.length; i += 4) {
                const x = (i / 4) % width;
                const y = Math.floor((i / 4) / width);

                let rx = Math.round(x - offset);
                if (rx < 0) rx = 0;
                const ri = (y * width + rx) * 4;

                let bx = Math.round(x + offset);
                if (bx >= width) bx = width - 1;
                const bi = (y * width + bx) * 4;

                newBuffer[i] = temp[ri];
                newBuffer[i + 1] = temp[i + 1];
                newBuffer[i + 2] = temp[bi + 2];
            }
        } else if (mode === 'scanlines') {
            const density = Math.max(2, Math.floor(10 - (quality / 100) * 8));
            const opacity = a;

            for (let y = 0; y < height; y++) {
                if ((y + k) % density === 0) {
                    for (let x = 0; x < width; x++) {
                        const i = (y * width + x) * 4;
                        newBuffer[i] *= (1 - opacity);
                        newBuffer[i + 1] *= (1 - opacity);
                        newBuffer[i + 2] *= (1 - opacity);
                    }
                }
            }
        } else if (mode === 'noise') {
            for (let i = 0; i < buffer.length; i += 4) {
                if (Math.random() < a) {
                    const noise = (Math.random() - 0.5) * 255 * s * 2;
                    newBuffer[i] = Math.min(255, Math.max(0, newBuffer[i] + noise));
                    newBuffer[i + 1] = Math.min(255, Math.max(0, newBuffer[i + 1] + noise));
                    newBuffer[i + 2] = Math.min(255, Math.max(0, newBuffer[i + 2] + noise));
                }
            }
        } else if (mode === 'digital-distortion') {
            const blockSize = Math.max(4, Math.floor(32 * (1 - quality / 100) + 4));
            const thresh = 1 - a * 0.9; // Threshold for applying distortion (more amount = lower threshold = more distortion)

            for (let y = 0; y < height; y += blockSize) {
                for (let x = 0; x < width; x += blockSize) {
                    // Use pseudo-random based on seed + position
                    if (Math.random() > thresh) {
                        const dX = (distortionX / 100);
                        const dY = (distortionY / 100);

                        const shiftX = Math.floor((Math.random() - 0.5) * 100 * dX);
                        const shiftY = Math.floor((Math.random() - 0.5) * 100 * dY);
                        const invert = Math.random() > 0.8; // Occasional invert

                        for (let by = 0; by < blockSize; by++) {
                            for (let bx = 0; bx < blockSize; bx++) {
                                const cy = y + by;
                                const cx = x + bx;
                                if (cy >= height || cx >= width) continue;

                                const srcX = clamp(cx + shiftX, 0, width - 1);
                                const srcY = clamp(cy + shiftY, 0, height - 1);

                                const dstI = (cy * width + cx) * 4;
                                const srcI = (srcY * width + srcX) * 4;

                                if (invert) {
                                    newBuffer[dstI] = 255 - newBuffer[srcI];
                                    newBuffer[dstI + 1] = 255 - newBuffer[srcI + 1];
                                    newBuffer[dstI + 2] = 255 - newBuffer[srcI + 2];
                                } else {
                                    newBuffer[dstI] = newBuffer[srcI];
                                    newBuffer[dstI + 1] = newBuffer[srcI + 1];
                                    newBuffer[dstI + 2] = newBuffer[srcI + 2];
                                }

                                // Color Crunch
                                const crunch = Math.floor(1 + (colCrunch / 100) * 32);
                                newBuffer[dstI] = Math.floor(newBuffer[dstI] / crunch) * crunch;
                                newBuffer[dstI + 1] = Math.floor(newBuffer[dstI + 1] / crunch) * crunch;
                                newBuffer[dstI + 2] = Math.floor(newBuffer[dstI + 2] / crunch) * crunch;
                            }
                        }
                    }
                }
            }
        } else if (mode === 'crt') {
            const scanInt = (scanlineIntensity / 100);
            const vigStr = (vignetteStrength / 100);
            const abStr = (aberrationStrength / 100) * 20;
            const noiseStr = (noiseStrength / 100) * 50;

            for (let y = 0; y < height; y++) {
                // Jitter line
                const jitter = Math.random() < 0.05 * s ? Math.round((Math.random() - 0.5) * 10 * a) : 0;

                for (let x = 0; x < width; x++) {
                    const dstI = (y * width + x) * 4;

                    // Aberration
                    const distFromCenter = Math.abs(x - width / 2) / (width / 2);
                    const shift = Math.floor(abStr * distFromCenter * distFromCenter);

                    const rx = clamp(x - shift + jitter, 0, width - 1);
                    const gx = clamp(x + jitter, 0, width - 1);
                    const bx = clamp(x + shift + jitter, 0, width - 1);

                    const ri = (y * width + rx) * 4;
                    const gi = (y * width + gx) * 4;
                    const bi = (y * width + bx) * 4;

                    let r = buffer[ri];
                    let g = buffer[gi + 1];
                    let b = buffer[bi + 2];

                    // Noise
                    if (noiseStr > 0) {
                        const n = (Math.random() - 0.5) * noiseStr;
                        r += n; g += n; b += n;
                    }

                    // Scanline darkening
                    if (y % 2 === 0) {
                        r *= (1 - scanInt);
                        g *= (1 - scanInt);
                        b *= (1 - scanInt);
                    }

                    // Vignette calculation
                    const dx = (x / width) - 0.5;
                    const dy = (y / height) - 0.5;
                    const vignetteDist = Math.sqrt(dx * dx + dy * dy) * 2;
                    const vignette = 1 - (vignetteDist * 0.5 * vigStr);

                    newBuffer[dstI] = clamp(r * vignette, 0, 255);
                    newBuffer[dstI + 1] = clamp(g * vignette, 0, 255);
                    newBuffer[dstI + 2] = clamp(b * vignette, 0, 255);
                }
            }
        }
    }
    return newBuffer;
};

export const applyAsciiEffect = (
    buffer: Float32Array,
    width: number,
    height: number,
    algorithm: 'standard' | 'blocks' | 'binary' | 'matrix' | 'custom',
    scale: number,
    contrast: number,
    inverted: boolean,
    colorMode: 'mono' | 'original' | 'green' | 'custom',
    customChars: string,
    customColor: string,
    overlay: boolean,
    intensity: number = 100
): Float32Array => {
    const charMap: Record<string, string> = {
        standard: '@%#*+=-:. ',
        blocks: '█▓▒░ ',
        binary: '01 ',
        matrix: '0123456789ABCDEF',
        hex: '0123456789ABCDEF',
        custom: customChars
    };
    const chars = (customChars && customChars.length > 0) ? customChars : (charMap[algorithm] || charMap.standard);
    const len = chars.length;

    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return buffer;

    if (overlay) {
        ctx.clearRect(0, 0, width, height);
    } else {
        ctx.fillStyle = inverted ? '#000' : '#fff';
        ctx.fillRect(0, 0, width, height);
    }

    const fontSize = Math.max(4, scale);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';



    // We need to sample the image at grid points
    // But we can't easily access buffer as 2D in a loop without helper.
    // Let's just loop through grid.

    const cols = Math.floor(width / (fontSize * 0.6)); // Approx char width
    const rows = Math.floor(height / fontSize);

    const cellW = width / cols;
    const cellH = height / rows;

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const posX = Math.floor(x * cellW);
            const posY = Math.floor(y * cellH);

            // Sample center
            const cx = Math.min(width - 1, posX + Math.floor(cellW / 2));
            const cy = Math.min(height - 1, posY + Math.floor(cellH / 2));
            const i = (cy * width + cx) * 4;

            const r = buffer[i];
            const g = buffer[i + 1];
            const b = buffer[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // Contrast
            // Stronger contrast for 0.5 - 3.0 range
            const cLum = clamp(((lum - 128) * contrast) + 128, 0, 255);

            const charIndex = Math.floor((cLum / 255) * (len - 1));
            const char = chars[inverted ? len - 1 - charIndex : charIndex];

            if (colorMode === 'original') {
                ctx.fillStyle = `rgb(${r},${g},${b})`;
            } else if (colorMode === 'green') {
                ctx.fillStyle = '#0f0';
            } else if (colorMode === 'custom') {
                ctx.fillStyle = customColor;
            } else {
                ctx.fillStyle = inverted ? '#fff' : '#000';
            }

            ctx.fillText(char, posX, posY);
        }
    }

    const result = ctx.getImageData(0, 0, width, height);
    const resBuffer = new Float32Array(result.data.length);
    for (let i = 0; i < result.data.length; i++) resBuffer[i] = result.data[i];

    // If overlay, we need to blend with original buffer
    if (overlay) {
        for (let i = 0; i < buffer.length; i += 4) {
            const alpha = resBuffer[i + 3] / 255; // Assuming text has alpha
            // Actually OffscreenCanvas text might be anti-aliased.
            // But we cleared it.
            if (alpha > 0) {
                resBuffer[i] = resBuffer[i] * alpha + buffer[i] * (1 - alpha);
                resBuffer[i + 1] = resBuffer[i + 1] * alpha + buffer[i + 1] * (1 - alpha);
                resBuffer[i + 2] = resBuffer[i + 2] * alpha + buffer[i + 2] * (1 - alpha);
                resBuffer[i + 3] = 255;
            } else {
                resBuffer[i] = buffer[i];
                resBuffer[i + 1] = buffer[i + 1];
                resBuffer[i + 2] = buffer[i + 2];
                resBuffer[i + 3] = buffer[i + 3];
            }
        }
    }

    if (intensity < 100) {
        const s = intensity / 100;
        for (let i = 0; i < buffer.length; i++) {
            resBuffer[i] = buffer[i] * (1 - s) + resBuffer[i] * s;
        }
    }

    return resBuffer;
};
