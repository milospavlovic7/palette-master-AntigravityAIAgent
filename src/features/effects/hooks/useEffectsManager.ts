import { useState, useCallback } from 'react';
import type { Effect, EffectType, ActiveColor } from '../../../types';

export const useEffectsManager = () => {
    const [effects, setEffects] = useState<Effect[]>([]);
    const [globalIntensity, setGlobalIntensity] = useState(100);

    const mapToActiveColors = (hexColors: string[]): ActiveColor[] => {
        if (hexColors.length === 0) return [];
        return hexColors.map((hex, i) => ({
            id: crypto.randomUUID(),
            hex,
            weight: 100,
            stop: hexColors.length === 1 ? 50 : (i / (hexColors.length - 1)) * 100
        }));
    };

    const createFineTuneEffect = useCallback((hexColors: string[]): Effect => {
        return {
            id: crypto.randomUUID(),
            type: 'fine-tune',
            name: 'Fine Tune Colors',
            isCollapsed: false,
            isEnabled: true,
            data: {
                colors: mapToActiveColors(hexColors),
                mode: 'blend',
                intensity: 100
            }
        };
    }, []);

    const addEffect = useCallback((type: EffectType, colors: string[] = []) => {
        const id = crypto.randomUUID();
        let newEffect: Effect;

        switch (type) {
            case 'fine-tune':
                const defaultColors = colors.length > 0 ? colors : ['#000000', '#ffffff'];
                newEffect = createFineTuneEffect(defaultColors);
                break;
            case 'contrast-brightness':
                newEffect = {
                    id, type, name: 'Contrast / Brightness', isCollapsed: false, isEnabled: true,
                    data: { brightness: 0, contrast: 0 }
                };
                break;
            case 'hsl':
                newEffect = {
                    id, type, name: 'HSL Adjustment', isCollapsed: false, isEnabled: true,
                    data: { hue: 0, saturation: 0, lightness: 0 }
                };
                break;
            case 'dither':
                newEffect = {
                    id, type, name: 'Dithering', isCollapsed: false, isEnabled: true,
                    data: { method: 'floyd-steinberg', strength: 100, threshold: 128, grayscale: true, levels: 2, scale: 1 }
                };
                break;
            case 'curves':
                newEffect = {
                    id, type, name: 'Curves & Levels', isCollapsed: false, isEnabled: true,
                    data: {
                        points: [{ x: 0, y: 0 }, { x: 255, y: 255 }],
                        channel: 'rgb',
                        inputMin: 0, inputMax: 255, outputMin: 0, outputMax: 255, gamma: 1
                    }
                };
                break;
            case 'resize':
                newEffect = {
                    id, type, name: 'Resize', isCollapsed: false, isEnabled: true,
                    data: { scale: 1.0 }
                };
                break;
            case 'ascii':
                newEffect = {
                    id, type, name: 'ASCII Art', isCollapsed: false, isEnabled: true,
                    data: {
                        algorithm: 'standard',
                        scale: 12,
                        contrast: 1.0,
                        inverted: false,
                        colorMode: 'mono',
                        customColor: '#00ff00',
                        customChars: '',
                        overlay: false
                    }
                };
                break;
            case 'antialias':
                newEffect = {
                    id, type, name: 'Antialias', isCollapsed: false, isEnabled: true,
                    data: { strength: 50, threshold: 10, iterations: 1 }
                };
                break;
            case 'blur':
                newEffect = {
                    id, type, name: 'Blur', isCollapsed: false, isEnabled: true,
                    data: { type: 'gaussian', radius: 5, angle: 0 }
                };
                break;
            case 'sharpen':
                newEffect = {
                    id, type, name: 'Sharpen', isCollapsed: false, isEnabled: true,
                    data: { method: 'standard', amount: 50, radius: 2, threshold: 0 }
                };
                break;
            case 'pixel-sort':
                newEffect = {
                    id, type, name: 'Pixel Sort', isCollapsed: false, isEnabled: true,
                    data: { mode: 'brightness', direction: 'horizontal', thresholdLow: 25, thresholdHigh: 75, reverse: false }
                };
                break;
            case 'halftone':
                newEffect = {
                    id, type, name: 'Halftone', isCollapsed: false, isEnabled: true,
                    data: { shape: 'circle', size: 8, angle: 45, contrast: 1.5, colorMode: 'cmyk' }
                };
                break;
            case 'glow':
                newEffect = {
                    id, type, name: 'Glow', isCollapsed: false, isEnabled: true,
                    data: { radius: 10, strength: 50, threshold: 50 }
                };
                break;
            case 'datamosh':
                newEffect = {
                    id, type, name: 'Datamosh', isCollapsed: false, isEnabled: true,
                    data: { mode: 'smear', threshold: 10, strength: 50, blockSize: 16, angle: 45 }
                };
                break;
            case 'glitch':
                newEffect = {
                    id, type, name: 'Glitch', isCollapsed: false, isEnabled: true,
                    data: { mode: 'rgb-split', amount: 20, seed: 50, iterations: 5, quality: 80 }
                };
                break;
            case 'text':
                newEffect = {
                    id, type, name: 'Text', isCollapsed: false, isEnabled: true,
                    data: {
                        text: 'Hello World',
                        x: 50,
                        y: 50,
                        fontFamily: 'Arial',
                        fontSize: 48,
                        fontWeight: 'bold',
                        fontStyle: 'normal',
                        color: '#ffffff',
                        rotation: 0,
                        textAlign: 'center',
                        textBaseline: 'middle',
                        opacity: 100,
                        blur: 0,
                        borderColor: '#000000',
                        borderWidth: 0
                    }
                };
                break;
            default:
                return;
        }

        setEffects(prev => [...prev, newEffect]);
    }, [createFineTuneEffect]);

    const updateEffect = useCallback((updatedEffect: Effect) => {
        setEffects(prev => prev.map(e => e.id === updatedEffect.id ? updatedEffect : e));
    }, []);

    const removeEffect = useCallback((id: string) => {
        setEffects(prev => prev.filter(e => e.id !== id));
    }, []);

    const reorderEffects = useCallback((fromIndex: number, toIndex: number) => {
        setEffects(prev => {
            const newEffects = [...prev];
            const [moved] = newEffects.splice(fromIndex, 1);
            newEffects.splice(toIndex, 0, moved);
            return newEffects;
        });
    }, []);

    return {
        effects,
        setEffects,
        globalIntensity,
        setGlobalIntensity,
        addEffect,
        updateEffect,
        removeEffect,
        reorderEffects,
        createFineTuneEffect
    };
};
