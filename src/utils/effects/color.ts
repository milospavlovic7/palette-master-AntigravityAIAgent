import { clamp, rgbToHsl, hslToRgb } from './common';

export const applyContrastBrightness = (
    r: number, g: number, b: number,
    brightness: number, contrast: number
): { r: number, g: number, b: number } => {
    let nr = r;
    let ng = g;
    let nb = b;

    const bShift = (brightness / 100) * 255;
    nr += bShift;
    ng += bShift;
    nb += bShift;

    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    nr = factor * (nr - 128) + 128;
    ng = factor * (ng - 128) + 128;
    nb = factor * (nb - 128) + 128;

    return {
        r: clamp(nr, 0, 255),
        g: clamp(ng, 0, 255),
        b: clamp(nb, 0, 255)
    };
};

export const applyHSL = (
    r: number, g: number, b: number,
    hue: number, saturation: number, lightness: number
): { r: number, g: number, b: number } => {
    const hsl = rgbToHsl(r, g, b);

    hsl.h = (hsl.h + hue) % 360;
    if (hsl.h < 0) hsl.h += 360;

    hsl.s = clamp(hsl.s + saturation, 0, 100);
    hsl.l = clamp(hsl.l + lightness, 0, 100);

    const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return {
        r: clamp(rgb.r, 0, 255),
        g: clamp(rgb.g, 0, 255),
        b: clamp(rgb.b, 0, 255)
    };
};

// Spline Interpolation (Monotone Cubic)
const monotoneCubicInterpolate = (xs: number[], ys: number[]) => {
    const n = xs.length;
    if (n === 1) return (_: number) => ys[0];

    const m = new Float32Array(n);
    const dx = new Float32Array(n - 1);
    const dy = new Float32Array(n - 1);

    for (let i = 0; i < n - 1; i++) {
        dx[i] = xs[i + 1] - xs[i];
        dy[i] = ys[i + 1] - ys[i];
    }

    const secants = new Float32Array(n - 1);
    for (let i = 0; i < n - 1; i++) {
        if (dx[i] === 0) secants[i] = 0;
        else secants[i] = dy[i] / dx[i];
    }

    m[0] = secants[0];
    m[n - 1] = secants[n - 2];
    for (let i = 1; i < n - 1; i++) {
        if (secants[i - 1] * secants[i] <= 0) m[i] = 0;
        else m[i] = (secants[i - 1] + secants[i]) / 2;
    }

    return (x: number) => {
        if (x <= xs[0]) return ys[0];
        if (x >= xs[n - 1]) return ys[n - 1];

        let i = 0;
        while (x > xs[i + 1]) i++;

        const h = dx[i];
        const t = (x - xs[i]) / h;
        const t2 = t * t;
        const t3 = t2 * t;

        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;

        return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1];
    };
};

export const applyCurves = (
    buffer: Float32Array,
    points: { x: number, y: number }[],
    channel: 'rgb' | 'red' | 'green' | 'blue',
    inputMin: number = 0, inputMax: number = 255, outputMin: number = 0, outputMax: number = 255, gamma: number = 1
) => {
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const xs = sorted.map(p => p.x / 255);
    const ys = sorted.map(p => p.y / 255);

    const interpolate = monotoneCubicInterpolate(xs, ys);

    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
        let val = i;
        val = Math.max(inputMin, Math.min(inputMax, val));
        val = (val - inputMin) / (inputMax - inputMin);

        if (gamma !== 1) {
            val = Math.pow(val, 1 / gamma);
        }

        val = interpolate(val);

        val = val * (outputMax - outputMin) + outputMin;
        lut[i] = clamp(Math.round(val), 0, 255);
    }

    for (let i = 0; i < buffer.length; i += 4) {
        if (channel === 'rgb' || channel === 'red') buffer[i] = lut[Math.round(buffer[i])];
        if (channel === 'rgb' || channel === 'green') buffer[i + 1] = lut[Math.round(buffer[i + 1])];
        if (channel === 'rgb' || channel === 'blue') buffer[i + 2] = lut[Math.round(buffer[i + 2])];
    }
};
