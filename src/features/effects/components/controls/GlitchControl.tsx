import React from 'react';
import type { GlitchData } from '../../../../types';

interface GlitchControlProps {
    data: GlitchData;
    onChange: (data: GlitchData) => void;
}

import styles from './Controls.module.css';

export const GlitchControl: React.FC<GlitchControlProps> = ({ data, onChange }) => {
    const handleChange = (key: keyof GlitchData, value: any) => {
        onChange({ ...data, [key]: value });
    };

    return (
        <div className={styles.controlContainer}>
            {/* Mode selection */}
            <div className={styles.controlGroup}>
                <label className={styles.blockLabel}>Mode</label>
                <select
                    value={data.mode}
                    onChange={(e) => handleChange('mode', e.target.value)}
                    className={styles.select}
                >
                    <option value="rgb-split">RGB Split</option>
                    <option value="scanlines">Scanlines</option>
                    <option value="noise">Noise</option>
                    <option value="digital-distortion">Digital Distortion</option>
                    <option value="crt">CRT</option>
                </select>
            </div>

            {/* Amount Slider */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Amount</label>
                    <span className={styles.value}>{data.amount}</span>
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

            {/* Seed Slider */}
            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Seed</label>
                    <span className={styles.value}>{data.seed}</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={data.seed}
                    onChange={(e) => handleChange('seed', Number(e.target.value))}
                    className={styles.slider}
                />
            </div>

            {/* Iterations Slider (Conditional) */}
            {(data.mode === 'digital-distortion' || data.mode === 'noise') && (
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Iters</label>
                        <span className={styles.value}>{data.iterations}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={data.iterations}
                        onChange={(e) => handleChange('iterations', Number(e.target.value))}
                        className={styles.slider}
                    />
                </div>
            )}

            {/* Quality Slider (Conditional) */}
            {(data.mode === 'crt' || data.mode === 'digital-distortion') && (
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Quality</label>
                        <span className={styles.value}>{data.quality}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={data.quality}
                        onChange={(e) => handleChange('quality', Number(e.target.value))}
                        className={styles.slider}
                    />
                </div>
            )}

            {/* Digital Distortion Specifics */}
            {data.mode === 'digital-distortion' && (
                <>
                    <div className={styles.controlGroup}>
                        <div className={styles.controlHeader}>
                            <label className={styles.label}>Distort X</label>
                            <span className={styles.value}>{data.distortionX ?? 50}</span>
                        </div>
                        <input
                            type="range" min="0" max="100"
                            value={data.distortionX ?? 50}
                            onChange={(e) => handleChange('distortionX', Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>
                    <div className={styles.controlGroup}>
                        <div className={styles.controlHeader}>
                            <label className={styles.label}>Distort Y</label>
                            <span className={styles.value}>{data.distortionY ?? 50}</span>
                        </div>
                        <input
                            type="range" min="0" max="100"
                            value={data.distortionY ?? 50}
                            onChange={(e) => handleChange('distortionY', Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>
                    <div className={styles.controlGroup}>
                        <div className={styles.controlHeader}>
                            <label className={styles.label}>Col Crunch</label>
                            <span className={styles.value}>{data.colCrunch ?? 50}</span>
                        </div>
                        <input
                            type="range" min="0" max="100"
                            value={data.colCrunch ?? 50}
                            onChange={(e) => handleChange('colCrunch', Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>
                </>
            )}

            {/* CRT Specifics */}
            {data.mode === 'crt' && (
                <>
                    <div className={styles.controlGroup}>
                        <div className={styles.controlHeader}>
                            <label className={styles.label}>Scanlines</label>
                            <span className={styles.value}>{data.scanlineIntensity ?? 50}</span>
                        </div>
                        <input
                            type="range" min="0" max="100"
                            value={data.scanlineIntensity ?? 50}
                            onChange={(e) => handleChange('scanlineIntensity', Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>
                    <div className={styles.controlGroup}>
                        <div className={styles.controlHeader}>
                            <label className={styles.label}>Vignette</label>
                            <span className={styles.value}>{data.vignetteStrength ?? 50}</span>
                        </div>
                        <input
                            type="range" min="0" max="100"
                            value={data.vignetteStrength ?? 50}
                            onChange={(e) => handleChange('vignetteStrength', Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>
                    <div className={styles.controlGroup}>
                        <div className={styles.controlHeader}>
                            <label className={styles.label}>Aberration</label>
                            <span className={styles.value}>{data.aberrationStrength ?? 50}</span>
                        </div>
                        <input
                            type="range" min="0" max="100"
                            value={data.aberrationStrength ?? 50}
                            onChange={(e) => handleChange('aberrationStrength', Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>
                    <div className={styles.controlGroup}>
                        <div className={styles.controlHeader}>
                            <label className={styles.label}>Noise</label>
                            <span className={styles.value}>{data.noiseStrength ?? 30}</span>
                        </div>
                        <input
                            type="range" min="0" max="100"
                            value={data.noiseStrength ?? 30}
                            onChange={(e) => handleChange('noiseStrength', Number(e.target.value))}
                            className={styles.slider}
                        />
                    </div>
                </>
            )}
        </div>
    );
};
