import React from 'react';
import type { HalftoneData } from '../../../../types';

interface HalftoneControlProps {
    data: HalftoneData;
    onChange: (data: HalftoneData) => void;
}

import styles from './Controls.module.css';

export const HalftoneControl: React.FC<HalftoneControlProps> = ({
    data,
    onChange
}) => {
    const handleChange = (key: keyof HalftoneData, value: any) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <div className={styles.controlContainer}>
            {/* Shape & Color Mode */}
            <div className={styles.controlGroup} style={{ flexDirection: 'row', gap: '1rem' }}>
                <div className={styles.flex1}>
                    <label className={styles.blockLabel}>Shape</label>
                    <select
                        value={data.shape}
                        onChange={(e) => handleChange('shape', e.target.value)}
                        className={styles.select}
                    >
                        <option value="circle">Circle</option>
                        <option value="square">Square</option>
                        <option value="line">Line</option>
                    </select>
                </div>
                <div className={styles.flex1}>
                    <label className={styles.blockLabel}>Color Mode</label>
                    <select
                        value={data.colorMode}
                        onChange={(e) => handleChange('colorMode', e.target.value)}
                        className={styles.select}
                    >
                        <option value="mono">Monochrome</option>
                        <option value="cmyk">CMYK</option>
                        <option value="rgb">RGB</option>
                    </select>
                </div>
            </div>

            {/* Size */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Size (Grid)</label>
                    <span className={styles.value}>{data.size}px</span>
                </div>
                <input
                    type="range"
                    min="2"
                    max="50"
                    value={data.size}
                    onChange={(e) => handleChange('size', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>

            {/* Angle */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Angle</label>
                    <span className={styles.value}>{data.angle}°</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="360"
                    value={data.angle}
                    onChange={(e) => handleChange('angle', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>

            {/* Contrast */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Contrast (Hardness)</label>
                    <span className={styles.value}>{data.contrast}</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="5"
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

            {/* Invert */}
            <div className={styles.controlGroup}>
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={data.invert ?? false}
                        onChange={(e) => handleChange('invert', e.target.checked)}
                        className={styles.checkbox}
                    />
                    Invert
                </label>
            </div>
        </div>
    );
};
