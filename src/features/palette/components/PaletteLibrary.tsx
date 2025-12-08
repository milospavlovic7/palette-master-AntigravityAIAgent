import React from 'react';
import type { Palette } from '../../../types';

interface PaletteLibraryProps {
    savedPalettes: Palette[];
    onSelect: (colors: string[]) => void;
    onDelete: (id: string) => void;
}

import styles from './Palette.module.css';

export const PaletteLibrary: React.FC<PaletteLibraryProps> = ({ savedPalettes, onSelect, onDelete }) => {
    return (
        <section>
            <h2 className={styles.sectionTitle}>
                Library ({savedPalettes.length})
            </h2>
            <div className={styles.paletteList}>
                {savedPalettes.length === 0 && <p className={styles.emptyState}>Empty</p>}
                {savedPalettes.filter(p => Array.isArray(p.colors)).map(palette => (
                    <div
                        key={palette.id}
                        className={styles.paletteItem}
                        onClick={() => onSelect(palette.colors)}
                    >
                        <div className={styles.colorStrip}>
                            {Array.isArray(palette.colors) && palette.colors.map((c, i) => (
                                <div key={i} className={styles.colorBlock} style={{ backgroundColor: c }} />
                            ))}
                        </div>
                        <button
                            className={styles.deleteButton}
                            onClick={(e) => { e.stopPropagation(); onDelete(palette.id); }}
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </section>
    );
};
