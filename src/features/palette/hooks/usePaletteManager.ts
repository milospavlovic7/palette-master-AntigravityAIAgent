import { useState, useCallback } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { extractColors, sortColorsByLuminance } from '../../../utils/colorUtils';
import type { Palette } from '../../../types';

export const usePaletteManager = () => {
    const [colors, setColors] = useState<string[]>([]);
    const [colorCount, setColorCount] = useState(5);
    const [savedPalettes, setSavedPalettes] = useLocalStorage<Palette[]>('palettes', []);

    const extractColorsFromImage = useCallback((imageData: ImageData) => {
        const newColors = extractColors(imageData, colorCount);
        const sortedColors = sortColorsByLuminance(newColors);
        setColors(sortedColors);
        return sortedColors;
    }, [colorCount]);

    const savePalette = useCallback((colorsToSave?: string[]) => {
        const targetColors = Array.isArray(colorsToSave) ? colorsToSave : colors;
        if (targetColors.length === 0) return;

        const newPalette: Palette = {
            id: crypto.randomUUID(),
            colors: targetColors,
            timestamp: Date.now()
        };

        setSavedPalettes(prev => [newPalette, ...prev]);
    }, [colors, setSavedPalettes]);

    const deletePalette = useCallback((id: string) => {
        setSavedPalettes(prev => prev.filter(p => p.id !== id));
    }, [setSavedPalettes]);

    const updateColors = useCallback((newColors: string[]) => {
        setColors(newColors);
    }, []);

    return {
        colors,
        colorCount,
        setColorCount,
        savedPalettes,
        extractColorsFromImage,
        savePalette,
        deletePalette,
        updateColors
    };
};
