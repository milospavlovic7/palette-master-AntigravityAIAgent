import React from 'react';
import type { SharpenData } from '../../../../types';

interface SharpenControlProps {
    data: SharpenData;
    onChange: (data: SharpenData) => void;
}

import styles from './Controls.module.css';

export const SharpenControl: React.FC<SharpenControlProps> = ({
    data,
    onChange
}) => {
    const handleChange = (key: keyof SharpenData, value: any) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <div className={styles.controlContainer}>
            {/* Method Selector */}
            <div className={styles.controlGroup}>
                <label className={styles.blockLabel}>Method</label>
                <select
                    value={data.method || 'standard'}
                    onChange={(e) => handleChange('method', e.target.value)}
                    className={styles.select}
                >
                    <option value="standard">Standard (Convolution)</option>
                    <option value="unsharp-mask">Unsharp Mask</option>
                    <option value="laplacian">Laplacian Edge</option>
                </select>
            </div>

            {/* Amount */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Amount</label>
                    <span className={styles.value}>{data.amount}%</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={data.amount}
                    onChange={(e) => handleChange('amount', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>

            {/* Unsharp Mask Specific Controls */}
            {data.method === 'unsharp-mask' && (
                <>
                    <div className={styles.controlGroup}>
                        <div className={styles.controlHeader}>
                            <label className={styles.label}>Radius</label>
                            <span className={styles.value}>{data.radius || 2}px</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={data.radius || 2}
                            onChange={(e) => handleChange('radius', Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>
                    <div className={styles.controlGroup}>
                        <div className={styles.controlHeader}>
                            <label className={styles.label}>Threshold</label>
                            <span className={styles.value}>{data.threshold || 0}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="255"
                            value={data.threshold || 0}
                            onChange={(e) => handleChange('threshold', Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>
                </>
            )}
        </div>
    );
};
