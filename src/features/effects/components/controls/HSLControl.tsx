import React from 'react';
import type { HSLData } from '../../../../types';

interface HSLControlProps {
    data: HSLData;
    onChange: (data: HSLData) => void;
}

import styles from './Controls.module.css';

export const HSLControl: React.FC<HSLControlProps> = ({
    data,
    onChange
}) => {
    const handleChange = (key: keyof HSLData, value: number) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <div className={styles.controlContainer}>
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Hue Shift</label>
                    <span className={styles.value}>{data.hue}°</span>
                </div>
                <input
                    type="range"
                    min="-180"
                    max="180"
                    value={data.hue}
                    onChange={(e) => handleChange('hue', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Saturation</label>
                    <span className={styles.value}>{data.saturation}%</span>
                </div>
                <input
                    type="range"
                    min="-100"
                    max="100"
                    value={data.saturation}
                    onChange={(e) => handleChange('saturation', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Lightness</label>
                    <span className={styles.value}>{data.lightness}%</span>
                </div>
                <input
                    type="range"
                    min="-100"
                    max="100"
                    value={data.lightness}
                    onChange={(e) => handleChange('lightness', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>
        </div>
    );
};
