import React from 'react';
import type { Preset } from '../../../types';

interface PresetsToolbarProps {
    presets: Preset[];
    activePresetId: string;
    onLoad: (id: string) => void;
    onSave: () => void;
    onDelete: () => void;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: () => void;
    onReset: () => void;
}

import styles from './Effects.module.css';

export const PresetsToolbar: React.FC<PresetsToolbarProps> = ({
    presets,
    activePresetId,
    onLoad,
    onSave,
    onDelete,
    onImport,
    onExport,
    onReset
}) => {
    return (
        <div className={styles.presetsToolbar}>
            <div className={styles.presetsHeader}>
                <button
                    onClick={onReset}
                    title="Reset Chain"
                    className={`btn-secondary ${styles.iconButton}`}
                >
                    R
                </button>
                <select
                    value={activePresetId}
                    onChange={(e) => onLoad(e.target.value)}
                    className={styles.presetSelect}
                    style={{ backgroundColor: '#000', color: '#fff', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                >
                    <option value="">Select Preset...</option>
                    {presets.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                <button
                    onClick={onSave}
                    title="Save Preset"
                    className={styles.iconButton}
                    style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none' }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                        <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                </button>
                {activePresetId && (
                    <button
                        onClick={onDelete}
                        title="Delete Preset"
                        className={styles.iconButton}
                        style={{ background: '#ff4444', color: '#fff', border: 'none' }}
                    >
                        ×
                    </button>
                )}
            </div>

            <div className={styles.importExportContainer}>
                <label
                    title="Import Presets"
                    className={`btn-secondary ${styles.secondaryButton}`}
                    style={{ cursor: 'pointer' }}
                >
                    Import
                    <input
                        type="file"
                        accept=".json"
                        onChange={onImport}
                        className={styles.fileInput}
                    />
                </label>
                <button
                    onClick={onExport}
                    title="Export Presets"
                    className={`btn-secondary ${styles.secondaryButton}`}
                >
                    Export
                </button>
            </div>
        </div>
    );
};
