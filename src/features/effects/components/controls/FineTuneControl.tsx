import React, { useState } from 'react';
import type { FineTuneEffectData, ActiveColor } from '../../../../types';

interface FineTuneControlProps {
    data: FineTuneEffectData;
    onChange: (data: FineTuneEffectData) => void;
}

import styles from './FineTune.module.css';
import effectStyles from '../Effects.module.css'; // Re-use drag handle styles

export const FineTuneControl: React.FC<FineTuneControlProps> = ({
    data,
    onChange
}) => {
    const { colors, mode } = data;
    const [draggedId, setDraggedId] = useState<string | null>(null);

    const updateColors = (newColors: ActiveColor[]) => {
        onChange({ ...data, colors: newColors });
    };

    const setFineTuneMode = (newMode: 'blend' | 'redistribute') => {
        onChange({ ...data, mode: newMode });
    };

    const handleColorChange = (id: string, newHex: string) => {
        updateColors(colors.map(c => c.id === id ? { ...c, hex: newHex } : c));
    };

    const handleWeightChange = (id: string, newWeight: number) => {
        updateColors(colors.map(c => c.id === id ? { ...c, weight: newWeight } : c));
    };

    const handleDelete = (id: string) => {
        if (colors.length <= 2) return;
        const newColors = colors.filter(c => c.id !== id);
        const redistributed = newColors.map((c, i) => ({
            ...c,
            stop: (i / (newColors.length - 1)) * 100
        }));
        updateColors(redistributed);
    };

    const handleAddColor = () => {
        if (colors.length >= 10) return;
        const newId = crypto.randomUUID();
        const newColors = [
            ...colors,
            { id: newId, hex: '#808080', weight: 100, stop: 100 }
        ];
        const redistributed = newColors.map((c, i) => ({
            ...c,
            stop: (i / (newColors.length - 1)) * 100
        }));
        updateColors(redistributed);
    };

    // Drag and Drop
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        if (!draggedId || draggedId === targetId) return;

        const fromIndex = colors.findIndex(c => c.id === draggedId);
        const toIndex = colors.findIndex(c => c.id === targetId);

        if (fromIndex === -1 || toIndex === -1) return;

        const newColors = [...colors];
        const [moved] = newColors.splice(fromIndex, 1);
        newColors.splice(toIndex, 0, moved);

        const remapped = newColors.map((c, i) => ({
            ...c,
            stop: (i / (newColors.length - 1)) * 100
        }));

        updateColors(remapped);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
    };

    const handleStopChange = (index: number, newStop: number) => {
        const prevStop = index > 0 ? colors[index - 1].stop : 0;
        const nextStop = index < colors.length - 1 ? colors[index + 1].stop : 100;
        const clamped = Math.max(prevStop + 1, Math.min(nextStop - 1, newStop));

        const newColors = [...colors];
        newColors[index] = { ...newColors[index], stop: clamped };
        updateColors(newColors);
    };

    return (
        <div className={styles.fineTuneContainer}>
            <div className={styles.fineTuneHeader}>
                {/* Mode Toggle */}
                <div className={styles.modeToggle}>
                    <button
                        className={`${styles.modeButton} ${mode === 'blend' ? styles.active : ''}`}
                        onClick={() => setFineTuneMode('blend')}
                    >
                        Blend
                    </button>
                    <button
                        className={`${styles.modeButton} ${mode === 'redistribute' ? styles.active : ''}`}
                        onClick={() => setFineTuneMode('redistribute')}
                    >
                        Redistribute
                    </button>
                </div>

                {/* Intensity */}
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.controlLabel}>Intensity</label>
                        <span className={styles.controlValue}>{data.intensity ?? 100}%</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={data.intensity ?? 100}
                        onChange={(e) => onChange({ ...data, intensity: Number(e.target.value) })}
                        className={styles.rangeInput}
                    />
                </div>

                {/* Gradient Bar */}
                <div className={styles.controlGroup}>
                    <div className={styles.controlLabel} style={{ marginBottom: '0.5rem' }}>Gradient Distribution</div>
                    <div
                        className={styles.gradientBarContainer}
                        style={{ background: `linear-gradient(to right, ${colors.map(c => `${c.hex} ${c.stop}%`).join(', ')})` }}
                    >
                        {colors.map((c, i) => {
                            if (i === 0 || i === colors.length - 1) return null; // Skip first and last handles
                            return (
                                <div
                                    key={c.id}
                                    className={styles.gradientHandle}
                                    style={{ left: `${c.stop}%` }}
                                    onMouseDown={(e) => {
                                        const startX = e.clientX;
                                        const startStop = c.stop;
                                        const containerWidth = e.currentTarget.parentElement?.offsetWidth || 1;

                                        const handleMouseMove = (moveEvent: MouseEvent) => {
                                            const deltaX = moveEvent.clientX - startX;
                                            const deltaPercent = (deltaX / containerWidth) * 100;
                                            handleStopChange(i, startStop + deltaPercent);
                                        };

                                        const handleMouseUp = () => {
                                            window.removeEventListener('mousemove', handleMouseMove);
                                            window.removeEventListener('mouseup', handleMouseUp);
                                        };

                                        window.addEventListener('mousemove', handleMouseMove);
                                        window.addEventListener('mouseup', handleMouseUp);
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Color List */}
            <div className={styles.colorList}>
                <div className={styles.colorListContent}>
                    {colors.map((color) => (
                        <div
                            key={color.id}
                            className={`${styles.colorItem} ${draggedId === color.id ? styles.dragging : ''}`}
                            onDragOver={(e) => handleDragOver(e, color.id)}
                            onDragEnd={handleDragEnd}
                        >
                            {/* Drag Handle */}
                            <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, color.id)}
                                className={effectStyles.dragHandle}
                            >
                                <div className={effectStyles.dragDots}>
                                    <div className={effectStyles.dot} />
                                    <div className={effectStyles.dot} />
                                </div>
                                <div className={effectStyles.dragDots}>
                                    <div className={effectStyles.dot} />
                                    <div className={effectStyles.dot} />
                                </div>
                                <div className={effectStyles.dragDots}>
                                    <div className={effectStyles.dot} />
                                    <div className={effectStyles.dot} />
                                </div>
                            </div>

                            {/* Color Picker */}
                            <div className={styles.colorPickerContainer}>
                                <input
                                    type="color"
                                    value={color.hex}
                                    onChange={(e) => handleColorChange(color.id, e.target.value)}
                                    className={styles.colorInput}
                                />
                                <div
                                    className={styles.colorPreview}
                                    style={{ backgroundColor: color.hex }}
                                />
                            </div>

                            {/* Slider & Hex */}
                            <div className={styles.colorControls}>
                                <div className={styles.weightSliderContainer}>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={color.weight}
                                        onChange={(e) => handleWeightChange(color.id, Number(e.target.value))}
                                        className={styles.weightSlider}
                                    />
                                </div>
                                <div className={styles.colorInfo}>
                                    <span className={styles.hexCode}>
                                        {color.hex.toUpperCase()}
                                    </span>
                                    <span className={styles.weightValue}>
                                        {color.weight}%
                                    </span>
                                </div>
                            </div>

                            {/* Delete */}
                            <button
                                onClick={() => handleDelete(color.id)}
                                className={styles.deleteColorButton}
                                title="Remove color"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleAddColor}
                    className={`btn btn-secondary ${styles.addColorButton}`}
                >
                    <span className={styles.plusIcon}>+</span> Add Color
                </button>
            </div>
        </div>
    );
};
