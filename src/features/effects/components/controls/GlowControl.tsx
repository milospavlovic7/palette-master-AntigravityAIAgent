import React from 'react';
import type { GlowData } from '../../../../types';

interface GlowControlProps {
    data: GlowData;
    onChange: (data: GlowData) => void;
}

import styles from './Controls.module.css';

export const GlowControl: React.FC<GlowControlProps> = ({
    data,
    onChange
}) => {
    const handleChange = (key: keyof GlowData, value: any) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <div className={styles.controlContainer}>
            {/* Radius */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Radius (Blur)</label>
                    <span className={styles.value}>{data.radius}px</span>
                </div>
                <input
                    type="range"
                    min="1"
                    max="100"
                    value={data.radius}
                    onChange={(e) => handleChange('radius', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>

            {/* Strength */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Strength</label>
                    <span className={styles.value}>{data.strength}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="200"
                    value={data.strength}
                    onChange={(e) => handleChange('strength', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>

            {/* Threshold */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Threshold</label>
                    <span className={styles.value}>{data.threshold}%</span>
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
                    Only pixels brighter than this will glow.
                </p>
            </div>

            {/* Feather */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Feather (Edge Softness)</label>
                    <span className={styles.value}>{data.feather ?? 0}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={data.feather ?? 0}
                    onChange={(e) => handleChange('feather', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>
        </div>
    );
};
