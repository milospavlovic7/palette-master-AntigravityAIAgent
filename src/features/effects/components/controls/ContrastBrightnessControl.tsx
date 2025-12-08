import React from 'react';
import type { ContrastBrightnessData } from '../../../../types';

interface ContrastBrightnessControlProps {
    data: ContrastBrightnessData;
    onChange: (data: ContrastBrightnessData) => void;
}

import styles from './Controls.module.css';

export const ContrastBrightnessControl: React.FC<ContrastBrightnessControlProps> = ({
    data,
    onChange
}) => {
    const handleChange = (key: keyof ContrastBrightnessData, value: number) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <div className={styles.controlContainer}>
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Brightness</label>
                    <span className={styles.value}>{data.brightness}</span>
                </div>
                <input
                    type="range"
                    min="-100"
                    max="100"
                    value={data.brightness}
                    onChange={(e) => handleChange('brightness', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Contrast</label>
                    <span className={styles.value}>{data.contrast}</span>
                </div>
                <input
                    type="range"
                    min="-100"
                    max="100"
                    value={data.contrast}
                    onChange={(e) => handleChange('contrast', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>
        </div>
    );
};
