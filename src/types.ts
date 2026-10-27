export interface ActiveColor {
    id: string;
    hex: string;
    weight: number;
    stop: number; // 0-100
}



export interface FineTuneEffectData {
    colors: ActiveColor[];
    mode: 'blend' | 'redistribute';
    intensity: number; // 0-100
}

export interface ContrastBrightnessData {
    brightness: number; // -100 to 100
    contrast: number;   // -100 to 100
}

export interface HSLData {
    hue: number;        // -180 to 180 (degrees)
    saturation: number; // -100 to 100 (percentage)
    lightness: number;  // -100 to 100 (percentage)
}

export interface DitherData {
    method: 'floyd-steinberg' | 'atkinson' | 'sierra' | 'sierra-lite' | 'stucki' | 'error-diffusion-1d' | 'bayer-4x4' | 'bayer-8x8' | 'blue-noise' | 'void-cluster' | 'noise' | 'adaptive-fs-3x3' | 'jarvis-judice-ninke' | 'stevenson-arce' | 'blue-noise-64' | 'binary-threshold' | 'woodcut';
    strength: number;   // 0 to 100
    threshold: number;  // 0 to 255
    grayscale: boolean;
    levels: number;     // 2 to 256
    scale: number;      // 1 to 16
    // Advanced Controls
    errorStrength?: number; // 0 to 150 (percentage)
    scanPattern?: 'standard' | 'serpentine' | 'spiral' | 'zig-zag' | 'vertical' | 'hilbert';
    // Pre-processing
    contrast?: number; // 0 to 100
    gamma?: number; // 0.1 to 3.0 (Midtones)
    highlightsCompression?: number; // 0 to 100
    blurRadius?: number; // 0 to 20
    invert?: boolean;
    luminanceThreshold?: number; // 0 to 255
}

export interface Point {
    x: number;
    y: number;
}

export interface CurvesData {
    points: Point[];
    channel: 'rgb' | 'red' | 'green' | 'blue';
    // Levels
    inputMin?: number; // 0-255
    inputMax?: number; // 0-255
    outputMin?: number; // 0-255
    outputMax?: number; // 0-255
    gamma?: number; // 0.1-5.0
}

export interface ResizeData {
    scale: number; // 0.1 to 5.0
}

export interface AsciiData {
    algorithm: 'standard' | 'blocks' | 'binary' | 'matrix' | 'custom';
    scale: number;      // 4 to 64 (font size / grid size)
    contrast: number;   // 0.5 to 2.0 (gamma correction)
    inverted: boolean;
    colorMode: 'mono' | 'original' | 'green' | 'custom';
    customColor: string;
    customChars: string;
    overlay: boolean;
    opacity?: number; // 0-100
    intensity?: number; // 0 to 100
}

export interface AntialiasData {
    strength: number;   // 0 to 100 (blend amount)
    threshold: number;  // 0 to 100 (edge detection sensitivity)
    iterations: number; // 1 to 32
}

export interface BlurData {
    type: 'gaussian' | 'box' | 'motion';
    radius: number;     // 1 to 50
    angle: number;      // 0 to 180 (for motion)
    intensity?: number; // 0 to 100
}

export interface SharpenData {
    method: 'standard' | 'unsharp-mask' | 'laplacian';
    amount: number;     // 0 to 100
    radius: number;     // 1 to 50 (for unsharp mask)
    threshold: number;  // 0 to 255 (for unsharp mask)
}

export interface PixelSortData {
    mode: 'brightness' | 'hue' | 'saturation' | 'intensity' | 'red' | 'green' | 'blue';
    direction: 'horizontal' | 'vertical';
    thresholdLow: number;  // 0 to 100
    thresholdHigh: number; // 0 to 100
    reverse: boolean;
}

export interface HalftoneData {
    shape: 'circle' | 'square' | 'line';
    size: number;       // 2 to 50
    angle: number;      // 0 to 360
    contrast: number;   // 1 to 5
    colorMode: 'mono' | 'cmyk' | 'rgb';
    invert?: boolean;
    intensity?: number; // 0 to 100
}

export interface GlowData {
    radius: number;     // 1 to 100
    strength: number;   // 0 to 200 (percentage)
    threshold: number;  // 0 to 100 (percentage)
    feather?: number;   // 0 to 100
}

export interface DatamoshData {
    mode: 'smear' | 'block-shift' | 'interlace' | 'jitter' | 'slice' | 'compression' | 'echo' | 'vector-warp';
    threshold: number; // 0 to 100
    strength: number;  // 0 to 100
    blockSize: number; // 4 to 64
    angle: number;     // 0 to 360
}

export interface GlitchData {
    mode: 'rgb-split' | 'scanlines' | 'noise' | 'digital-distortion' | 'crt';
    amount: number;     // 0 to 100
    seed: number;       // 0 to 100
    iterations: number; // 1 to 20
    quality: number;    // 1 to 100
    // Digital Distortion Specific
    distortionX?: number; // 0 to 100
    distortionY?: number; // 0 to 100
    colCrunch?: number;   // 0 to 100
    // CRT Specific
    scanlineIntensity?: number; // 0 to 100
    vignetteStrength?: number; // 0 to 100
    aberrationStrength?: number; // 0 to 100
    noiseStrength?: number; // 0 to 100
}

export interface TextData {
    text: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    fontFamily: string;
    fontSize: number;
    fontWeight: string; // 'normal', 'bold', '100'-'900'
    fontStyle: string; // 'normal', 'italic'
    color: string;
    rotation: number; // degrees
    textAlign: 'left' | 'center' | 'right';
    textBaseline: 'top' | 'middle' | 'bottom';
    opacity: number; // 0-100
    blur?: number; // 0-20
    borderColor?: string;
    borderWidth?: number; // 0-20
    isSystemFont?: boolean;
}

export type EffectType = 'fine-tune' | 'contrast-brightness' | 'hsl' | 'dither' | 'curves' | 'resize' | 'ascii' | 'antialias' | 'blur' | 'sharpen' | 'pixel-sort' | 'halftone' | 'glow' | 'datamosh' | 'glitch' | 'text';

export type EffectData = FineTuneEffectData | ContrastBrightnessData | HSLData | DitherData | CurvesData | ResizeData | AsciiData | AntialiasData | BlurData | SharpenData | PixelSortData | HalftoneData | GlowData | DatamoshData | GlitchData | TextData;

export interface Effect {
    id: string;
    type: EffectType;
    name: string;
    isCollapsed: boolean;
    isEnabled: boolean;
    isLocked?: boolean;
    data: EffectData;
}

export interface Preset {
    id: string;
    name: string;
    effects: Effect[];
}

export interface Palette {
    id: string;
    colors: string[];
    timestamp: number;
}

