import React from 'react';
import type { ResizeData } from '../../../../types';

interface ResizeControlProps {
    data: ResizeData;
    onChange: (data: ResizeData) => void;
}

import styles from './Controls.module.css';

export const ResizeControl: React.FC<ResizeControlProps> = ({ data, onChange }) => {
    const handleChange = (key: keyof ResizeData, value: number) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <div className={styles.controlContainer}>
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Scale</label>
                    <span className={styles.value}>{data.scale.toFixed(2)}x</span>
                </div>
                <div className={styles.rowGroup}>
                    <input
                        type="range"
                        min="0.1"
                        max="5"
                        step="0.025"
                        value={data.scale}
                        onChange={(e) => handleChange('scale', Number(e.target.value))}
                        className={`${styles.slider} ${styles.flex1}`}
                    />
                    <input
                        type="number"
                        min="0.01"
                        max="10"
                        step="0.01"
                        value={data.scale}
                        onChange={(e) => handleChange('scale', Number(e.target.value))}
                        className={styles.textInput}
                        style={{
                            width: '60px',
                            padding: '0.25rem',
                            fontSize: '0.75rem'
                        }}
                    />
                </div>
                <div className={styles.buttonGroup} style={{ marginTop: '0.5rem' }}>
                    {[0.125, 0.25, 0.5, 1, 2].map(scale => (
                        <button
                            key={scale}
                            className={`${styles.groupButton} ${data.scale === scale ? styles.active : ''}`}
                            onClick={() => handleChange('scale', scale)}
                        >
                            {scale * 100}%
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
