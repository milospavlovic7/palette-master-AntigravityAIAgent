import React, { useState, useEffect } from 'react';
import type { TextData } from '../../../../types';
import styles from './Controls.module.css';
import { useTextPresets } from '../../hooks/useTextPresets';

interface TextControlProps {
    data: TextData;
    onChange: (data: Partial<TextData>) => void;
}

export const TextControl: React.FC<TextControlProps> = ({ data, onChange }) => {
    // Local state for immediate feedback
    const [localData, setLocalData] = useState<TextData>(data);
    const { presets, savePreset, deletePreset } = useTextPresets();

    // Sync local state when external data changes (e.g. from Drag on Canvas or Undo)
    // We only sync if the external data is effectively different, to avoid loop-backs while editing.
    // However, if we simply trust 'data' as the source of truth, it's safer.
    // The previous issue was likely fighting between local state updates and async prop updates.

    useEffect(() => {
        setLocalData(data);
    }, [data]);

    // Update handler - Updates LOCAL state immediately, and triggers parent change
    const handleChange = (key: keyof TextData, value: any) => {
        const newData = { ...localData, [key]: value };
        setLocalData(newData);

        // Auto-apply for most things, but maybe throttle text?
        // Actually, let's try direct updates first similar to AsciiControl.
        onChange(newData);
    };

    // Manual Apply Handler
    const handleApply = () => {
        onChange(localData);
    };

    const applyPreset = (presetData: TextData) => {
        setLocalData(presetData);
        onChange(presetData);
    };

    const [fonts, setFonts] = useState<string[]>([
        'Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'
    ]);
    const [isLoadingFonts, setIsLoadingFonts] = useState(false);

    const loadFonts = async () => {
        if ('queryLocalFonts' in window) {
            setIsLoadingFonts(true);
            try {
                // @ts-ignore
                const localFonts = await window.queryLocalFonts();
                const fontNames = new Set<string>(localFonts.map((f: any) => f.family));
                setFonts(prev => Array.from(new Set([...prev, ...fontNames])).sort());
            } catch (e) {
                console.log('Could not load local fonts', e);
            } finally {
                setIsLoadingFonts(false);
            }
        } else {
            alert('Your browser does not support accessing local fonts.');
        }
    };

    const [isPresetListOpen, setIsPresetListOpen] = useState(false);

    return (
        <div className={styles.controlContainer}>
            {/* Presets Section */}
            <div className={styles.controlGroup} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <button
                            onClick={() => setIsPresetListOpen(!isPresetListOpen)}
                            className={styles.select}
                            style={{
                                width: '100%',
                                textAlign: 'left',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <span>Select Preset...</span>
                            <span style={{ fontSize: '10px' }}>▼</span>
                        </button>

                        {isPresetListOpen && presets.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px',
                                zIndex: 10,
                                maxHeight: '200px',
                                overflowY: 'auto',
                                marginTop: '4px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                            }}>
                                {presets.map(preset => (
                                    <div key={preset.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '8px 10px',
                                        borderBottom: '1px solid var(--bg-tertiary)',
                                        fontSize: '0.85rem'
                                    }}>
                                        <span
                                            onClick={() => { applyPreset(preset.data); setIsPresetListOpen(false); }}
                                            style={{ cursor: 'pointer', flex: 1, fontWeight: 500 }}
                                            className={styles.presetItem}
                                        >
                                            {preset.name}
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deletePreset(preset.id); }}
                                            style={{
                                                border: 'none',
                                                background: 'none',
                                                color: 'var(--text-muted)',
                                                cursor: 'pointer',
                                                padding: '4px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            title="Delete preset"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {isPresetListOpen && presets.length === 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                padding: '8px',
                                textAlign: 'center',
                                fontSize: '0.8rem',
                                color: 'var(--text-muted)',
                                zIndex: 10
                            }}>
                                No presets saved
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => savePreset(localData)}
                        className={styles.button}
                        style={{ padding: '0 12px' }}
                        title="Save current as preset"
                    >
                        Save
                    </button>
                </div>
            </div>

            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Text Content</label>
                    <button className={styles.helpText} onClick={handleApply} style={{ cursor: 'pointer', textDecoration: 'underline', border: 'none', background: 'none' }}>
                        Force Apply
                    </button>
                </div>
                <textarea
                    className={styles.textInput}
                    value={localData.text}
                    onChange={(e) => handleChange('text', e.target.value)}
                    rows={2}
                    style={{ resize: 'vertical' }}
                    placeholder="Enter text..."
                />
            </div>

            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Font Family</label>
                    <button
                        onClick={loadFonts}
                        className={styles.helpText}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                        disabled={isLoadingFonts}
                    >
                        {isLoadingFonts ? 'Loading...' : 'Reload System Fonts'}
                    </button>
                </div>
                <select
                    className={styles.select}
                    value={localData.fontFamily}
                    onChange={(e) => handleChange('fontFamily', e.target.value)}
                    style={{ fontFamily: localData.fontFamily }}
                >
                    {fonts.map(font => (
                        <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                    ))}
                </select>
            </div>

            <div className={styles.rowGroup}>
                <div className={`${styles.controlGroup} ${styles.flex1}`}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Size</label>
                        <span className={styles.value}>{localData.fontSize}px</span>
                    </div>
                    <input
                        type="range"
                        value={localData.fontSize}
                        onChange={(e) => handleChange('fontSize', Number(e.target.value))}
                        min={8} max={500}
                        className={styles.slider}
                    />
                </div>
                <div className={`${styles.controlGroup} ${styles.wAuto}`}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Color</label>
                    </div>
                    <input
                        type="color"
                        value={localData.color}
                        onChange={(e) => handleChange('color', e.target.value)}
                        className={styles.colorInput}
                        style={{ width: '40px', height: '40px' }}
                    />
                </div>
            </div>

            <div className={styles.rowGroup}>
                <div className={`${styles.controlGroup} ${styles.flex1}`}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Style</label>
                    </div>
                    <div className={styles.buttonGroup}>
                        <button
                            className={`${styles.groupButton} ${localData.fontWeight !== 'normal' ? styles.active : ''}`}
                            onClick={() => handleChange('fontWeight', localData.fontWeight === 'normal' ? 'bold' : 'normal')}
                            title="Bold"
                        >
                            <b>B</b>
                        </button>
                        <button
                            className={`${styles.groupButton} ${localData.fontStyle !== 'normal' ? styles.active : ''}`}
                            onClick={() => handleChange('fontStyle', localData.fontStyle === 'normal' ? 'italic' : 'normal')}
                            title="Italic"
                            style={{ fontStyle: 'italic' }}
                        >
                            I
                        </button>
                    </div>
                </div>
                <div className={`${styles.controlGroup} ${styles.flex1}`}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Align</label>
                    </div>
                    <div className={styles.buttonGroup}>
                        <button
                            className={`${styles.groupButton} ${localData.textAlign === 'left' ? styles.active : ''}`}
                            onClick={() => handleChange('textAlign', 'left')}
                            title="Left"
                        >
                            L
                        </button>
                        <button
                            className={`${styles.groupButton} ${localData.textAlign === 'center' ? styles.active : ''}`}
                            onClick={() => handleChange('textAlign', 'center')}
                            title="Center"
                        >
                            C
                        </button>
                        <button
                            className={`${styles.groupButton} ${localData.textAlign === 'right' ? styles.active : ''}`}
                            onClick={() => handleChange('textAlign', 'right')}
                            title="Right"
                        >
                            R
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>Position & Transform</div>
            </div>

            <div className={styles.rowGroup}>
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>X</label>
                        <span className={styles.value}>{Math.round(localData.x)}%</span>
                    </div>
                    <input
                        className={styles.slider}
                        type="range"
                        min="0" max="100"
                        value={localData.x}
                        onChange={(e) => handleChange('x', Number(e.target.value))}
                    />
                </div>
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Y</label>
                        <span className={styles.value}>{Math.round(localData.y)}%</span>
                    </div>
                    <input
                        className={styles.slider}
                        type="range"
                        min="0" max="100"
                        value={localData.y}
                        onChange={(e) => handleChange('y', Number(e.target.value))}
                    />
                </div>
            </div>

            <div className={styles.controlGroup}>
                <div className={styles.controlHeader}>
                    <label className={styles.label}>Rotation</label>
                    <span className={styles.value}>{localData.rotation}°</span>
                </div>
                <input
                    className={styles.slider}
                    type="range"
                    min="-180" max="180"
                    value={localData.rotation}
                    onChange={(e) => handleChange('rotation', Number(e.target.value))}
                />
            </div>

            <div className={styles.rowGroup}>
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Opacity</label>
                        <span className={styles.value}>{localData.opacity}%</span>
                    </div>
                    <input
                        className={styles.slider}
                        type="range"
                        min="0" max="100"
                        value={localData.opacity}
                        onChange={(e) => handleChange('opacity', Number(e.target.value))}
                    />
                </div>
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Blur</label>
                        <span className={styles.value}>{localData.blur ?? 0}px</span>
                    </div>
                    <input
                        className={styles.slider}
                        type="range"
                        min="0" max="20"
                        value={localData.blur ?? 0}
                        onChange={(e) => handleChange('blur', Number(e.target.value))}
                    />
                </div>
            </div>

            <div className={styles.sectionHeader}>
                <div className={styles.sectionTitle}>Border / Outline</div>
            </div>

            <div className={styles.rowGroup}>
                <div className={`${styles.controlGroup} ${styles.flex1}`}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Width</label>
                        <span className={styles.value}>{localData.borderWidth ?? 0}px</span>
                    </div>
                    <input
                        type="range"
                        value={localData.borderWidth ?? 0}
                        onChange={(e) => handleChange('borderWidth', Number(e.target.value))}
                        min={0} max={20}
                        className={styles.slider}
                    />
                </div>
                <div className={`${styles.controlGroup} ${styles.wAuto}`}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Color</label>
                    </div>
                    <input
                        type="color"
                        value={localData.borderColor ?? '#000000'}
                        onChange={(e) => handleChange('borderColor', e.target.value)}
                        className={styles.colorInput}
                        style={{ width: '40px', height: '40px' }}
                    />
                </div>
            </div>


        </div>
    );
};
