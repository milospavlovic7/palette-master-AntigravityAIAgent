import React from 'react';
import type { PixelSortData } from '../../../../types';

interface PixelSortControlProps {
    data: PixelSortData;
    onChange: (data: PixelSortData) => void;
}

import styles from './Controls.module.css';

export const PixelSortControl: React.FC<PixelSortControlProps> = ({
    data,
    onChange
}) => {
    const handleChange = (key: keyof PixelSortData, value: any) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <div className={styles.controlContainer}>
            {/* Mode */}
            <div className={styles.controlGroup}>
                <label className={styles.blockLabel}>Mode</label>
                <select
                    value={data.mode}
                    onChange={(e) => handleChange('mode', e.target.value)}
                    className={styles.select}
                >
                    <option value="brightness">Brightness</option>
                    <option value="hue">Hue</option>
                    <option value="saturation">Saturation</option>
                    <option value="intensity">Intensity</option>
                    <option value="red">Red</option>
                    <option value="green">Green</option>
                    <option value="blue">Blue</option>
                </select>
            </div>

            {/* Thresholds */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Threshold Range</label>
                    <span className={styles.value}>{data.thresholdLow}% - {data.thresholdHigh}%</span>
                </div>
                <div className={styles.controlGroup}>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={data.thresholdLow}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            handleChange('thresholdLow', Math.min(val, data.thresholdHigh));
                        }}
                        className={styles.slider}
                    />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={data.thresholdHigh}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            handleChange('thresholdHigh', Math.max(val, data.thresholdLow));
                        }}
                        className={styles.slider}
                    />
                </div>
            </div>

            {/* Direction */}
            <div className={styles.controlGroup}>
                <label className={styles.blockLabel}>Direction</label>
                <select
                    value={data.direction}
                    onChange={(e) => handleChange('direction', e.target.value)}
                    className={styles.select}
                >
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                </select>
            </div>

            {/* Reverse Toggle */}
            <div className={styles.controlGroup}>
                <label className={styles.checkboxLabel}>
                    <input
                        type="checkbox"
                        checked={data.reverse}
                        onChange={(e) => handleChange('reverse', e.target.checked)}
                        className={styles.checkbox}
                    />
                    Reverse Sort
                </label>
            </div>
        </div>
    );
};
