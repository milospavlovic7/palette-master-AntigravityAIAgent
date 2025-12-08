import React from 'react';
import type { AsciiData } from '../../../../types';

interface AsciiControlProps {
    data: AsciiData;
    onChange: (data: AsciiData) => void;
}

import styles from './Controls.module.css';

export const AsciiControl: React.FC<AsciiControlProps> = ({ data, onChange }) => {
    const handleChange = (key: keyof AsciiData, value: any) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <div className={styles.controlContainer}>
            {/* Algorithm Selector */}
            <div className={styles.controlGroup}>
                <label className={styles.blockLabel}>
                    Character Set
                </label>
                <select
                    value={data.algorithm}
                    onChange={(e) => handleChange('algorithm', e.target.value)}
                    className={styles.select}
                >
                    <option value="standard">Standard (@%#*+=-:. )</option>
                    <option value="blocks">Blocks (█▓▒░ )</option>
                    <option value="binary">Binary (01)</option>
                    <option value="matrix">Matrix</option>
                    <option value="custom">Custom</option>
                </select>
            </div>

            {/* Custom Chars Input */}
            {data.algorithm === 'custom' && (
                <div className={styles.controlGroup}>
                    <label className={styles.blockLabel}>
                        Custom Characters (Dark to Light)
                    </label>
                    <input
                        type="text"
                        value={data.customChars}
                        onChange={(e) => handleChange('customChars', e.target.value)}
                        className={styles.textInput}
                    />
                </div>
            )}

            {/* Scale (Font Size) */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Resolution (Size)</label>
                    <span className={styles.value}>{data.scale}px</span>
                </div>
                <input
                    type="range"
                    min="4"
                    max="64"
                    step="1"
                    value={data.scale}
                    onChange={(e) => handleChange('scale', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>

            {/* Contrast */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Character Contrast</label>
                    <span className={styles.value}>{data.contrast.toFixed(2)}</span>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    value={data.contrast}
                    onChange={(e) => handleChange('contrast', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>

            {/* Intensity */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Effect Intensity</label>
                    <span className={styles.value}>{data.intensity ?? 100}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={data.intensity ?? 100}
                    onChange={(e) => handleChange('intensity', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>

            {/* Color Mode */}
            <div className={styles.controlGroup}>
                <label className={styles.blockLabel}>
                    Color Mode
                </label>
                <div className={styles.buttonGroup}>
                    {['mono', 'original', 'green', 'custom'].map(mode => (
                        <button
                            key={mode}
                            className={`${styles.groupButton} ${data.colorMode === mode ? styles.active : ''}`}
                            style={{ textTransform: 'capitalize' }}
                            onClick={() => handleChange('colorMode', mode)}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
                {data.colorMode === 'custom' && (
                    <div className={styles.colorInputContainer}>
                        <input
                            type="color"
                            value={data.customColor || '#ff0000'}
                            onChange={(e) => handleChange('customColor', e.target.value)}
                            className={styles.colorInput}
                        />
                    </div>
                )}
            </div>

            {/* Options */}
            <div className={styles.controlGroup}>
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={data.inverted}
                        onChange={(e) => handleChange('inverted', e.target.checked)}
                        className={styles.checkbox}
                    />
                    Invert Mapping
                </label>
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={data.overlay}
                        onChange={(e) => handleChange('overlay', e.target.checked)}
                        className={styles.checkbox}
                    />
                    Overlay on Image
                </label>
            </div>

        </div>
    );
};
