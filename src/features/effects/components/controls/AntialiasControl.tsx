import React from 'react';
import type { AntialiasData } from '../../../../types';

interface AntialiasControlProps {
    data: AntialiasData;
    onChange: (data: AntialiasData) => void;
}

import styles from './Controls.module.css';

export const AntialiasControl: React.FC<AntialiasControlProps> = ({
    data,
    onChange
}) => {
    const handleChange = (key: keyof AntialiasData, value: any) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <div className={styles.controlContainer}>
            {/* Strength */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Strength (Blend)</label>
                    <span className={styles.value}>{data.strength}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={data.strength}
                    onChange={(e) => handleChange('strength', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>

            {/* Threshold */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Edge Threshold</label>
                    <span className={styles.value}>{data.threshold}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={data.threshold}
                    onChange={(e) => handleChange('threshold', Number(e.target.value))}
                    className={styles.slider}
                />
                <p className={styles.helpText}>
                    Lower threshold = smooths more details. Higher = smooths only strong edges.
                </p>
            </div>

            {/* Iterations */}
            <div className={styles.controlGroup}>
                <label className={styles.blockLabel}>
                    Passes (Multiplier)
                </label>
                <div className={styles.buttonGroup}>
                    {[1, 2, 4, 8, 16, 32].map(val => (
                        <button
                            key={val}
                            className={`${styles.groupButton} ${data.iterations === val ? styles.active : ''}`}
                            onClick={() => handleChange('iterations', val)}
                        >
                            {val}x
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
