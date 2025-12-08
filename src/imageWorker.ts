import {
    applyContrastBrightness, applyHSL, applyFloydSteinberg, applyAtkinsonDither,
    applySierraDither, applySierraLiteDither, applyStuckiDither, applyErrorDiffusion1D,
    applyOrderedDither, applyBlueNoiseDither, applyVoidClusterDither, applyNoiseDither,
    applyCurves, resizeBuffer, applyAsciiEffect, applyAntialias, applyBlur, applySharpen,
    applyPixelSort, applyHalftone, applyGlow, applyDatamosh, applyGlitch,
    applyAdaptiveFS3x3, applyJJN, applyStevensonArce, applyBlueNoise64, applyBinaryThreshold, applyWoodcut, applyDitherPreProcessing
} from './utils/effects';
import { hexToRgb } from './utils/colorUtils';
import type { Effect, FineTuneEffectData, ContrastBrightnessData, HSLData, DitherData, CurvesData, ResizeData, AsciiData, AntialiasData, BlurData, SharpenData, PixelSortData, HalftoneData, GlowData, DatamoshData, GlitchData } from './types';

self.onmessage = (e: MessageEvent) => {
    const { id, imageData, effects, globalIntensity } = e.data as { id: string, imageData: ImageData, effects: Effect[], globalIntensity: number };

    try {
        if (!imageData || !effects) {
            throw new Error("Missing data");
        }

        const width = imageData.width;
        const height = imageData.height;
        const data = new Uint8ClampedArray(imageData.data);

        // We need a working buffer (Float32 for precision)
        let workingBuffer = new Float32Array(data.length);
        // Buffer to track the "original" image but with resizes applied
        let resizedOriginalBuffer = new Float32Array(data.length);

        for (let i = 0; i < data.length; i++) {
            workingBuffer[i] = data[i];
            resizedOriginalBuffer[i] = data[i];
        }

        let currentWidth = width;
        let currentHeight = height;

        // Process Effects Chain
        for (const effect of effects) {
            if (!effect.isEnabled) continue;

            if (effect.type === 'fine-tune') {
                const data = effect.data as FineTuneEffectData;
                const { colors: activeColors, mode } = data;

                if (!activeColors || activeColors.length < 2) continue;

                // Generate LUT for this effect
                const sortedActive = [...activeColors].sort((a, b) => a.stop - b.stop);
                const paletteRgbs = sortedActive.map(c => ({
                    ...c,
                    ...hexToRgb(c.hex),
                    lum: 0.299 * hexToRgb(c.hex).r + 0.587 * hexToRgb(c.hex).g + 0.114 * hexToRgb(c.hex).b
                }));

                const lut: { r: number, g: number, b: number, a: number }[] = [];

                for (let lum = 0; lum < 256; lum++) {
                    const lumPercent = (lum / 255) * 100;

                    if (mode === 'blend') {
                        // Gradient Map Logic
                        let idx1 = 0;
                        let idx2 = paletteRgbs.length - 1;

                        for (let i = 0; i < paletteRgbs.length - 1; i++) {
                            if (lumPercent >= paletteRgbs[i].stop && lumPercent <= paletteRgbs[i + 1].stop) {
                                idx1 = i;
                                idx2 = i + 1;
                                break;
                            } else if (lumPercent < paletteRgbs[0].stop) {
                                idx1 = 0; idx2 = 0; break;
                            } else if (lumPercent > paletteRgbs[paletteRgbs.length - 1].stop) {
                                idx1 = paletteRgbs.length - 1; idx2 = paletteRgbs.length - 1; break;
                            }
                        }

                        const c1 = paletteRgbs[idx1];
                        const c2 = paletteRgbs[idx2];
                        const range = c2.stop - c1.stop;
                        const fraction = range === 0 ? 0 : (lumPercent - c1.stop) / range;

                        const newR = c1.r + (c2.r - c1.r) * fraction;
                        const newG = c1.g + (c2.g - c1.g) * fraction;
                        const newB = c1.b + (c2.b - c1.b) * fraction;

                        // Interpolate weight for alpha blending
                        const w1 = c1.weight / 100;
                        const w2 = c2.weight / 100;
                        const localWeight = w1 + (w2 - w1) * fraction;

                        lut[lum] = { r: newR, g: newG, b: newB, a: localWeight };

                    } else {
                        // Redistribute Logic
                        let rSum = 0, gSum = 0, bSum = 0, wSum = 0;
                        let maxWeight = 0;

                        for (const color of paletteRgbs) {
                            const userWeight = color.weight / 100;
                            if (userWeight <= 0.01) continue;

                            const dist = Math.abs(lumPercent - color.stop);
                            const proximity = 1 / (Math.pow(dist, 2.5) + 1);
                            const weight = userWeight * proximity;

                            rSum += color.r * weight;
                            gSum += color.g * weight;
                            bSum += color.b * weight;
                            wSum += weight;
                            maxWeight = Math.max(maxWeight, userWeight);
                        }

                        if (wSum > 0) {
                            lut[lum] = { r: rSum / wSum, g: gSum / wSum, b: bSum / wSum, a: maxWeight };
                        } else {
                            lut[lum] = { r: lum, g: lum, b: lum, a: 0 };
                        }
                    }
                }

                // Apply LUT
                for (let i = 0; i < workingBuffer.length; i += 4) {
                    const r = workingBuffer[i];
                    const g = workingBuffer[i + 1];
                    const b = workingBuffer[i + 2];

                    const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
                    const mapped = lut[Math.min(255, Math.max(0, lum))];

                    // Blend mapped color with current pixel based on mapped.a (weight)
                    // AND global effect intensity
                    const alpha = mapped.a * (data.intensity / 100);

                    workingBuffer[i] = r + (mapped.r - r) * alpha;
                    workingBuffer[i + 1] = g + (mapped.g - g) * alpha;
                    workingBuffer[i + 2] = b + (mapped.b - b) * alpha;
                }
            } else if (effect.type === 'contrast-brightness') {
                const data = effect.data as ContrastBrightnessData;
                for (let i = 0; i < workingBuffer.length; i += 4) {
                    const res = applyContrastBrightness(workingBuffer[i], workingBuffer[i + 1], workingBuffer[i + 2], data.brightness, data.contrast);
                    workingBuffer[i] = res.r;
                    workingBuffer[i + 1] = res.g;
                    workingBuffer[i + 2] = res.b;
                }
            } else if (effect.type === 'hsl') {
                const data = effect.data as HSLData;
                for (let i = 0; i < workingBuffer.length; i += 4) {
                    const res = applyHSL(workingBuffer[i], workingBuffer[i + 1], workingBuffer[i + 2], data.hue, data.saturation, data.lightness);
                    workingBuffer[i] = res.r;
                    workingBuffer[i + 1] = res.g;
                    workingBuffer[i + 2] = res.b;
                }
            } else if (effect.type === 'dither') {
                const data = effect.data as DitherData;

                // Pre-processing
                applyDitherPreProcessing(
                    workingBuffer, currentWidth, currentHeight,
                    data.contrast, data.gamma, data.blurRadius, data.invert,
                    data.highlightsCompression
                );

                const errStr = data.errorStrength ?? 100;
                const scan = data.scanPattern ?? 'standard';
                const lumThresh = data.luminanceThreshold ?? 128;

                if (data.method === 'floyd-steinberg') {
                    applyFloydSteinberg(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, errStr, scan, lumThresh);
                } else if (data.method === 'atkinson') {
                    applyAtkinsonDither(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, errStr, scan, lumThresh);
                } else if (data.method === 'sierra') {
                    applySierraDither(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, errStr, scan, lumThresh);
                } else if (data.method === 'sierra-lite') {
                    applySierraLiteDither(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, errStr, scan, lumThresh);
                } else if (data.method === 'stucki') {
                    applyStuckiDither(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, errStr, scan, lumThresh);
                } else if (data.method === 'error-diffusion-1d') {
                    applyErrorDiffusion1D(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, errStr, scan, lumThresh);
                } else if (data.method === 'adaptive-fs-3x3') {
                    applyAdaptiveFS3x3(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, errStr, scan, lumThresh);
                } else if (data.method === 'jarvis-judice-ninke') {
                    applyJJN(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, errStr, scan, lumThresh);
                } else if (data.method === 'stevenson-arce') {
                    applyStevensonArce(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, errStr, scan, lumThresh);
                } else if (data.method === 'blue-noise') {
                    applyBlueNoiseDither(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, data.scale);
                } else if (data.method === 'blue-noise-64') {
                    applyBlueNoise64(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, data.scale);
                } else if (data.method === 'void-cluster') {
                    applyVoidClusterDither(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, data.scale);
                } else if (data.method === 'noise') {
                    for (let y = 0; y < currentHeight; y++) {
                        for (let x = 0; x < currentWidth; x++) {
                            const i = (y * currentWidth + x) * 4;
                            const res = applyNoiseDither(workingBuffer[i], workingBuffer[i + 1], workingBuffer[i + 2], x, y, data.strength, data.grayscale, data.levels, data.scale);
                            workingBuffer[i] = res.r;
                            workingBuffer[i + 1] = res.g;
                            workingBuffer[i + 2] = res.b;
                        }
                    }
                } else if (data.method === 'binary-threshold') {
                    applyBinaryThreshold(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, lumThresh);
                } else if (data.method === 'woodcut') {
                    applyWoodcut(workingBuffer, currentWidth, currentHeight, data.strength, data.grayscale, data.levels, lumThresh);
                } else {
                    // Bayer
                    applyOrderedDither(workingBuffer, currentWidth, currentHeight, data.method as any, data.strength, data.grayscale, data.levels, data.scale);
                }
            } else if (effect.type === 'curves') {
                const data = effect.data as CurvesData;
                applyCurves(
                    workingBuffer, data.points, data.channel,
                    data.inputMin, data.inputMax, data.outputMin, data.outputMax, data.gamma
                );
            } else if (effect.type === 'resize') {
                const data = effect.data as ResizeData;
                const newWidth = Math.round(currentWidth * data.scale);
                const newHeight = Math.round(currentHeight * data.scale);
                if (newWidth > 0 && newHeight > 0) {
                    workingBuffer = resizeBuffer(workingBuffer, currentWidth, currentHeight, newWidth, newHeight) as any;
                    resizedOriginalBuffer = resizeBuffer(resizedOriginalBuffer, currentWidth, currentHeight, newWidth, newHeight) as any;
                    currentWidth = newWidth;
                    currentHeight = newHeight;
                }
            } else if (effect.type === 'ascii') {
                const data = effect.data as AsciiData;
                workingBuffer = applyAsciiEffect(
                    workingBuffer, currentWidth, currentHeight,
                    data.algorithm, data.scale, data.contrast, data.inverted, data.colorMode, data.customChars,
                    data.customColor, data.overlay, data.intensity
                ) as any;
            } else if (effect.type === 'antialias') {
                const data = effect.data as AntialiasData;
                workingBuffer = applyAntialias(
                    workingBuffer, currentWidth, currentHeight,
                    data.strength, data.threshold, data.iterations
                ) as any;
            } else if (effect.type === 'blur') {
                const data = effect.data as BlurData;
                workingBuffer = applyBlur(
                    workingBuffer, currentWidth, currentHeight,
                    data.type, data.radius, data.angle, data.intensity
                ) as any;
            } else if (effect.type === 'sharpen') {
                const data = effect.data as SharpenData;
                workingBuffer = applySharpen(
                    workingBuffer, currentWidth, currentHeight,
                    data.amount, data.method, data.radius, data.threshold
                ) as any;
            } else if (effect.type === 'pixel-sort') {
                const data = effect.data as PixelSortData;
                workingBuffer = applyPixelSort(
                    workingBuffer, currentWidth, currentHeight,
                    data.mode, data.direction, data.thresholdLow, data.thresholdHigh, data.reverse
                ) as any;
            } else if (effect.type === 'halftone') {
                const data = effect.data as HalftoneData;
                workingBuffer = applyHalftone(
                    workingBuffer, currentWidth, currentHeight,
                    data.shape, data.size, data.angle, data.contrast, data.colorMode, data.invert, data.intensity
                ) as any;
            } else if (effect.type === 'glow') {
                const data = effect.data as GlowData;
                workingBuffer = applyGlow(
                    workingBuffer, currentWidth, currentHeight,
                    data.radius, data.strength, data.threshold, data.feather
                ) as any;
            } else if (effect.type === 'datamosh') {
                const data = effect.data as DatamoshData;
                workingBuffer = applyDatamosh(
                    workingBuffer, currentWidth, currentHeight,
                    data.mode, data.threshold, data.strength, data.blockSize, data.angle
                ) as any;
            } else if (effect.type === 'glitch') {
                const data = effect.data as GlitchData;
                workingBuffer = applyGlitch(
                    workingBuffer, currentWidth, currentHeight,
                    data.mode, data.amount, data.seed, data.iterations, data.quality,
                    data.distortionX, data.distortionY, data.colCrunch,
                    data.scanlineIntensity, data.vignetteStrength, data.aberrationStrength, data.noiseStrength
                ) as any;
            }
        }

        // Apply Global Intensity (Blend Final with Original)
        const globalAlpha = globalIntensity / 100;
        const finalData = new Uint8ClampedArray(currentWidth * currentHeight * 4);

        for (let i = 0; i < finalData.length; i += 4) {
            finalData[i] = resizedOriginalBuffer[i] + (workingBuffer[i] - resizedOriginalBuffer[i]) * globalAlpha;
            finalData[i + 1] = resizedOriginalBuffer[i + 1] + (workingBuffer[i + 1] - resizedOriginalBuffer[i + 1]) * globalAlpha;
            finalData[i + 2] = resizedOriginalBuffer[i + 2] + (workingBuffer[i + 2] - resizedOriginalBuffer[i + 2]) * globalAlpha;
            finalData[i + 3] = 255;
        }

        const resultImageData = new ImageData(finalData, currentWidth, currentHeight);
        self.postMessage({ id, imageData: resultImageData }, [finalData.buffer] as any);

    } catch (error) {
        self.postMessage({ id, error: (error as Error).message });
    }
};
