import React from 'react';
import type { DitherData } from '../../../../types';

interface DitherControlProps {
    data: DitherData;
    onChange: (data: DitherData) => void;
}

import styles from './Controls.module.css';

export const DitherControl: React.FC<DitherControlProps> = ({
    data,
    onChange
}) => {
    const handleChange = (key: keyof DitherData, value: any) => {
        onChange({ ...data, [key]: value });
    };

    const isErrorDiffusion = [
        'floyd-steinberg', 'atkinson', 'sierra', 'sierra-lite', 'stucki',
        'error-diffusion-1d', 'adaptive-fs-3x3', 'jarvis-judice-ninke', 'stevenson-arce'
    ].includes(data.method);

    const isOrdered = [
        'bayer-4x4', 'bayer-8x8', 'blue-noise', 'blue-noise-64', 'void-cluster', 'noise'
    ].includes(data.method);

    const isThreshold = ['binary-threshold', 'woodcut'].includes(data.method);

    return (
        <div className={styles.controlContainer}>
            <div className={styles.controlGroup}>
                <label className={styles.blockLabel}>Method</label>
                <select
                    value={data.method}
                    onChange={(e) => handleChange('method', e.target.value)}
                    className={styles.select}
                >
                    <optgroup label="Error Diffusion">
                        <option value="floyd-steinberg">Floyd-Steinberg</option>
                        <option value="adaptive-fs-3x3">Adaptive FS 3x3</option>
                        <option value="jarvis-judice-ninke">Jarvis-Judice-Ninke</option>
                        <option value="stevenson-arce">Stevenson-Arce</option>
                        <option value="atkinson">Atkinson</option>
                        <option value="sierra">Sierra (3-row)</option>
                        <option value="sierra-lite">Sierra Lite</option>
                        <option value="stucki">Stucki</option>
                        <option value="error-diffusion-1d">1D Error Diffusion</option>
                    </optgroup>
                    <optgroup label="Ordered / Pattern">
                        <option value="bayer-4x4">Bayer 4x4</option>
                        <option value="bayer-8x8">Bayer 8x8</option>
                        <option value="blue-noise">Blue Noise (32x32)</option>
                        <option value="blue-noise-64">Blue Noise (64x64)</option>
                        <option value="void-cluster">Void & Cluster</option>
                        <option value="noise">White Noise</option>
                        <option value="woodcut">Woodcut</option>
                    </optgroup>
                    <optgroup label="Threshold">
                        <option value="binary-threshold">Binary Threshold</option>
                    </optgroup>
                </select>
            </div>

            {/* Common Controls */}
            {!isThreshold && (
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
            )}

            <div className={styles.controlGroup}>
                <label className={`${styles.checkboxLabel} ${styles.rowGroup}`} style={{ justifyContent: 'space-between' }}>
                    Grayscale
                    <input
                        type="checkbox"
                        checked={data.grayscale ?? true}
                        onChange={(e) => handleChange('grayscale', e.target.checked)}
                        className={styles.checkbox}
                    />
                </label>
            </div>

            {!isThreshold && (
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Levels</label>
                        <span className={styles.value}>{data.levels ?? 2}</span>
                    </div>
                    <input
                        type="range"
                        min="2"
                        max="16"
                        step="1"
                        value={data.levels ?? 2}
                        onChange={(e) => handleChange('levels', Number(e.target.value))}
                        className={styles.slider}
                    />
                </div>
            )}

            {isOrdered && (
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Scale</label>
                        <span className={styles.value}>{data.scale ?? 1}x</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="16"
                        step="1"
                        value={data.scale ?? 1}
                        onChange={(e) => handleChange('scale', Number(e.target.value))}
                        className={styles.slider}
                    />
                </div>
            )}

            {/* Advanced Settings */}
            <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Pre-processing</h4>

                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Contrast</label>
                        <span className={styles.value}>{data.contrast ?? 0}</span>
                    </div>
                    <input type="range" min="-100" max="100" value={data.contrast ?? 0} onChange={(e) => handleChange('contrast', Number(e.target.value))} className={styles.slider} />
                </div>

                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Gamma</label>
                        <span className={styles.value}>{data.gamma ?? 1.0}</span>
                    </div>
                    <input type="range" min="0.1" max="3.0" step="0.1" value={data.gamma ?? 1.0} onChange={(e) => handleChange('gamma', Number(e.target.value))} className={styles.slider} />
                </div>

                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Blur Radius</label>
                        <span className={styles.value}>{data.blurRadius ?? 0}px</span>
                    </div>
                    <input type="range" min="0" max="20" value={data.blurRadius ?? 0} onChange={(e) => handleChange('blurRadius', Number(e.target.value))} className={styles.slider} />
                </div>

                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Highlights Comp.</label>
                        <span className={styles.value}>{data.highlightsCompression ?? 0}%</span>
                    </div>
                    <input type="range" min="0" max="100" value={data.highlightsCompression ?? 0} onChange={(e) => handleChange('highlightsCompression', Number(e.target.value))} className={styles.slider} />
                </div>

                <div className={styles.controlGroup}>
                    <label className={`${styles.checkboxLabel} ${styles.rowGroup}`} style={{ justifyContent: 'space-between' }}>
                        Invert
                        <input type="checkbox" checked={data.invert ?? false} onChange={(e) => handleChange('invert', e.target.checked)} className={styles.checkbox} />
                    </label>
                </div>
            </div>

            {(isErrorDiffusion || isThreshold) && (
                <div className={styles.sectionHeader}>
                    <h4 className={styles.sectionTitle}>Dither Settings</h4>

                    {isErrorDiffusion && (
                        <div className={styles.controlGroup}>
                            <div className={styles.controlHeader}>
                                <label className={styles.label}>Error Strength</label>
                                <span className={styles.value}>{data.errorStrength ?? 100}%</span>
                            </div>
                            <input type="range" min="0" max="150" value={data.errorStrength ?? 100} onChange={(e) => handleChange('errorStrength', Number(e.target.value))} className={styles.slider} />
                        </div>
                    )}

                    <div className={styles.controlGroup}>
                        <div className={styles.controlHeader}>
                            <label className={styles.label}>Lum Threshold</label>
                            <span className={styles.value}>{data.luminanceThreshold ?? 128}</span>
                        </div>
                        <input type="range" min="0" max="255" value={data.luminanceThreshold ?? 128} onChange={(e) => handleChange('luminanceThreshold', Number(e.target.value))} className={styles.slider} />
                    </div>

                    {isErrorDiffusion && (
                        <div className={styles.controlGroup}>
                            <label className={styles.blockLabel}>Scan Pattern</label>
                            <select
                                value={data.scanPattern ?? 'standard'}
                                onChange={(e) => handleChange('scanPattern', e.target.value)}
                                className={styles.select}
                            >
                                <option value="standard">Standard</option>
                                <option value="serpentine">Serpentine</option>
                                <option value="spiral">Spiral</option>
                                <option value="zig-zag">Zig-Zag</option>
                                <option value="vertical">Vertical</option>
                                <option value="hilbert">Hilbert Curve</option>
                            </select>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
