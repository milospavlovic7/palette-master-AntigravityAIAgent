import { useState, useEffect, useCallback } from 'react';
import type { Preset, Effect } from '../../../types';

export const usePresets = (
    effects: Effect[],
    setEffects: React.Dispatch<React.SetStateAction<Effect[]>>
) => {
    const [presets, setPresets] = useState<Preset[]>(() => {
        const saved = localStorage.getItem('palette-presets');
        return saved ? JSON.parse(saved) : [];
    });
    const [activePresetId, setActivePresetId] = useState<string>('');

    useEffect(() => {
        localStorage.setItem('palette-presets', JSON.stringify(presets));
    }, [presets]);

    const savePreset = useCallback(() => {
        const name = prompt('Enter preset name:');
        if (!name) return;

        const newPreset: Preset = {
            id: Date.now().toString(),
            name,
            effects: JSON.parse(JSON.stringify(effects)) // Deep copy
        };

        setPresets(prev => [...prev, newPreset]);
        setActivePresetId(newPreset.id);
    }, [effects]);

    const loadPreset = useCallback((presetId: string) => {
        if (!presetId) {
            // If clearing preset, just reset but KEEP locked effects? 
            // Or usually clearing preset means 'no preset active', but effects remain?
            // Existing logic was setActivePresetId('') only.
            // If user explicitly clicks "Reset", we handle that elsewhere.
            // Here, we just toggle active ID.
            setActivePresetId('');
            return;
        }
        const preset = presets.find(p => p.id === presetId);
        if (preset) {
            setEffects(prevEffects => {
                const lockedEffects = prevEffects.filter(e => e.isLocked);

                // New effects from preset (regenerate IDs)
                const presetEffects = preset.effects.map(e => ({
                    ...e,
                    id: crypto.randomUUID()
                }));

                // Combine: Locked at TOP, then Preset
                // Note: If a locked effect is ALSO in the preset, do we duplicate?
                // Standard behavior: separate concepts. Locked effects are persistent overrides. 
                // Preset replaces everything else.

                return [...lockedEffects, ...presetEffects];
            });
            setActivePresetId(presetId);
        }
    }, [presets, setEffects]);

    const deletePreset = useCallback(() => {
        if (!activePresetId) return;
        if (confirm('Are you sure you want to delete this preset?')) {
            setPresets(prev => prev.filter(p => p.id !== activePresetId));
            setActivePresetId('');
        }
    }, [activePresetId]);

    const importPresets = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedPresets = JSON.parse(event.target?.result as string) as Preset[];
                if (Array.isArray(importedPresets)) {
                    setPresets(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        const newPresets = importedPresets.filter(p => !existingIds.has(p.id));
                        return [...prev, ...newPresets];
                    });
                    alert(`Successfully imported ${importedPresets.length} presets.`);
                } else {
                    alert('Invalid preset file format.');
                }
            } catch (err) {
                console.error('Failed to import presets:', err);
                alert('Failed to parse preset file.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }, []);

    const exportPresets = useCallback(() => {
        const dataStr = JSON.stringify(presets, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `palette-master-presets-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }, [presets]);

    return {
        presets,
        activePresetId,
        setActivePresetId,
        savePreset,
        loadPreset,
        deletePreset,
        importPresets,
        exportPresets
    };
};
