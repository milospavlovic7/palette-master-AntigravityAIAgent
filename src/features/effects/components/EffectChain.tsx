import React, { useState } from 'react';
import { EffectCard } from './EffectCard';
import * as Controls from './controls';
import type { Effect } from '../../../types';

import styles from './Effects.module.css';

interface EffectChainProps {
    effects: Effect[];
    onUpdate: (effect: Effect) => void;
    onRemove: (id: string) => void;
    onReorder: (fromIndex: number, toIndex: number) => void;
    onSavePalette?: (effect: Effect) => void;
    onSolo?: (id: string) => void;
}

export const EffectChain: React.FC<EffectChainProps> = ({
    effects,
    onUpdate,
    onRemove,
    onReorder,
    onSavePalette,
    onSolo
}) => {
    const [draggedEffectId, setDraggedEffectId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedEffectId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedEffectId || draggedEffectId === targetId) return;

        const fromIndex = effects.findIndex(e => e.id === draggedEffectId);
        const toIndex = effects.findIndex(e => e.id === targetId);

        if (fromIndex === -1 || toIndex === -1) return;

        onReorder(fromIndex, toIndex);
    };

    const handleDragEnd = () => {
        setDraggedEffectId(null);
    };

    const renderControl = (effect: Effect) => {
        const commonProps = {
            data: effect.data as any,
            onChange: (newData: any) => onUpdate({ ...effect, data: newData })
        };

        switch (effect.type) {
            case 'fine-tune': return <Controls.FineTuneControl {...commonProps} />;
            case 'contrast-brightness': return <Controls.ContrastBrightnessControl {...commonProps} />;
            case 'hsl': return <Controls.HSLControl {...commonProps} />;
            case 'dither': return <Controls.DitherControl {...commonProps} />;
            case 'curves': return <Controls.CurvesControl {...commonProps} />;
            case 'resize': return <Controls.ResizeControl {...commonProps} />;
            case 'ascii': return <Controls.AsciiControl {...commonProps} />;
            case 'antialias': return <Controls.AntialiasControl {...commonProps} />;
            case 'blur': return <Controls.BlurControl {...commonProps} />;
            case 'sharpen': return <Controls.SharpenControl {...commonProps} />;
            case 'pixel-sort': return <Controls.PixelSortControl {...commonProps} />;
            case 'halftone': return <Controls.HalftoneControl {...commonProps} />;
            case 'glow': return <Controls.GlowControl {...commonProps} />;
            case 'datamosh': return <Controls.DatamoshControl {...commonProps} />;
            case 'glitch': return <Controls.GlitchControl {...commonProps} />;
            default: return null;
        }
    };

    return (
        <div className={styles.effectChain}>
            {effects.map(effect => (
                <EffectCard
                    key={effect.id}
                    effect={effect}
                    onUpdate={onUpdate}
                    onRemove={() => onRemove(effect.id)}
                    onDragStart={(e: React.DragEvent) => handleDragStart(e, effect.id)}
                    onDragOver={(e: React.DragEvent) => handleDragOver(e, effect.id)}
                    onDragEnd={handleDragEnd}
                    onSavePalette={effect.type === 'fine-tune' && onSavePalette ? () => onSavePalette(effect) : undefined}
                    onSolo={onSolo ? () => onSolo(effect.id) : undefined}
                >
                    {renderControl(effect)}
                </EffectCard>
            ))}
        </div>
    );
};
