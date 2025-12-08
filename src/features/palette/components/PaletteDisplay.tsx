import React from 'react';

interface PaletteDisplayProps {
    colors: string[];
    onSave?: () => void;
    saved?: boolean;
}

import styles from './Palette.module.css';

export const PaletteDisplay: React.FC<PaletteDisplayProps> = ({ colors, onSave, saved }) => {
    if (colors.length === 0) return null;

    const copyToClipboard = (color: string) => {
        navigator.clipboard.writeText(color);
        // Could add toast here
    };

    return (
        <div className={`card ${styles.displayCard}`}>
            <div className={styles.displayHeader}>
                <h3 className={styles.displayTitle}>Generated Palette</h3>
                <div className={styles.actionButtons}>
                    {onSave && (
                        <button
                            className={`btn ${styles.saveButton}`}
                            onClick={() => onSave()}
                            disabled={saved}
                            style={{ opacity: saved ? 0.5 : 1 }}
                        >
                            {saved ? 'Saved ✓' : 'Save Palette'}
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.paletteGrid}>
                {colors.map((color, index) => (
                    <div
                        key={index}
                        className={styles.paletteColor}
                        style={{ backgroundColor: color }}
                        title={color}
                        onClick={() => copyToClipboard(color)}
                    >
                        <span className={styles.colorHex}>
                            {color}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
