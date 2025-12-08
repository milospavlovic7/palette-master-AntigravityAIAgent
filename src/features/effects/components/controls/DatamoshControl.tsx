import React from 'react';
import type { DatamoshData } from '../../../../types';

interface DatamoshControlProps {
    data: DatamoshData;
    onChange: (data: DatamoshData) => void;
}

import styles from './Controls.module.css';

export const DatamoshControl: React.FC<DatamoshControlProps> = ({
    data,
    onChange
}) => {
    const handleChange = (key: keyof DatamoshData, value: any) => {
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
                    <option value="smear">Smear (Pixel Drag)</option>
                    <option value="block-shift">Block Shift</option>
                    <option value="interlace">Interlace</option>
                    <option value="jitter">Jitter</option>
                    <option value="slice">Slice</option>
                    <option value="compression">Compression Artifacts</option>
                    <option value="echo">Echo / Ghosting</option>
                    <option value="vector-warp">Vector Warp</option>
                </select>
            </div>

            {/* Threshold (Smear & Compression only) */}
            {(data.mode === 'smear' || data.mode === 'compression') && (
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>
                            {data.mode === 'compression' ? 'Quantization' : 'Threshold (Sensitivity)'}
                        </label>
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
                </div>
            )}

            {/* Strength */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Strength</label>
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

            {/* Block Size (Block Shift, Slice, Compression, Vector Warp) */}
            {(data.mode === 'block-shift' || data.mode === 'slice' || data.mode === 'compression' || data.mode === 'vector-warp') && (
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>
                            {data.mode === 'slice' ? 'Slice Height' : (data.mode === 'vector-warp' ? 'Frequency' : 'Block Size')}
                        </label>
                        <span className={styles.value}>{data.blockSize}</span>
                    </div>
                    <input
                        type="range"
                        min="4"
                        max="100"
                        step="1"
                        value={data.blockSize}
                        onChange={(e) => handleChange('blockSize', Number(e.target.value))}
                        className={styles.slider}
                    />
                </div>
            )}

            {/* Angle (Smear & Echo) */}
            {(data.mode === 'smear' || data.mode === 'echo') && (
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
            )}
        </div>
    );
};
