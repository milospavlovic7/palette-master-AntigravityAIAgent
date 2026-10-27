import { useState, useCallback, useEffect } from 'react';
import type { TextData } from '../../../types';

export interface TextPreset {
    id: string;
    name: string;
    data: TextData;
}

export const useTextPresets = () => {
    const [presets, setPresets] = useState<TextPreset[]>(() => {
        try {
            const saved = localStorage.getItem('text-presets');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load text presets', e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('text-presets', JSON.stringify(presets));
    }, [presets]);

    const savePreset = useCallback((data: TextData) => {
        const name = prompt('Enter preset name:');
        if (!name) return;

        const newPreset: TextPreset = {
            id: crypto.randomUUID(),
            name,
            data: { ...data } // Deep copy
        };

        setPresets(prev => [...prev, newPreset]);
    }, []);

    const deletePreset = useCallback((id: string) => {
        if (confirm('Delete this preset?')) {
            setPresets(prev => prev.filter(p => p.id !== id));
        }
    }, []);

    return {
        presets,
        savePreset,
        deletePreset
    };
};
