import React from 'react';
import type { BlurData } from '../../../../types';

interface BlurControlProps {
    data: BlurData;
    onChange: (data: BlurData) => void;
}

import styles from './Controls.module.css';

export const BlurControl: React.FC<BlurControlProps> = ({
    data,
    onChange
}) => {
    const handleChange = (key: keyof BlurData, value: any) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <div className={styles.controlContainer}>
            {/* Type Selector */}
            <div className={styles.controlGroup}>
                <label className={styles.blockLabel}>
                    Blur Type
                </label>
                <select
                    value={data.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className={styles.select}
                >
                    <option value="gaussian">Gaussian (Smooth)</option>
                    <option value="box">Box (Fast/Blocky)</option>
                    <option value="motion">Motion (Directional)</option>
                </select>
            </div>

            {/* Radius */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Radius (Strength)</label>
                    <span className={styles.value}>{data.radius}px</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="50"
                    value={data.radius}
                    onChange={(e) => handleChange('radius', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>

            {/* Angle (Motion only) */}
            {data.type === 'motion' && (
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Angle</label>
                        <span className={styles.value}>{data.angle}°</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="180"
                        value={data.angle}
                        onChange={(e) => handleChange('angle', Number(e.target.value))}
                        className={styles.slider}
                    />
                </div>
            )}

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
        </div>
    );
};
