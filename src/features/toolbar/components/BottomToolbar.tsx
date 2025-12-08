import React from 'react';
import { ImageUpload } from '../../palette/components/ImageUpload';

interface BottomToolbarProps {
    onTargetImageLoad: (data: ImageData, url: string) => void;
    globalIntensity: number;
    setGlobalIntensity: (value: number) => void;
    processedImageUrl: string | null;
}

import styles from './Toolbar.module.css';

export const BottomToolbar: React.FC<BottomToolbarProps> = ({
    onTargetImageLoad,
    globalIntensity,
    setGlobalIntensity,
    processedImageUrl
}) => {
    const handleDownload = () => {
        if (!processedImageUrl) return;
        const link = document.createElement('a');
        const randomNum = Math.floor(Math.random() * 10000000000);
        link.download = `PaletteMaster_${randomNum}.png`;
        link.href = processedImageUrl;
        link.click();
    };

    return (
        <div className={styles.bottomToolbar}>
            <div className={styles.section} style={{ flex: 1 }}>
                <span className={styles.sectionLabel}>TARGET:</span>
                <div className={styles.fileInputContainer}>
                    <ImageUpload
                        onImageLoad={onTargetImageLoad}
                        label="Change Image"
                    />
                </div>
            </div>

            <div className={styles.section} style={{ flex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem' }}>
                    <button
                        className="btn"
                        style={{
                            padding: '0.25rem 0.6rem',
                            fontSize: '0.8rem',
                            minWidth: 'auto',
                            backgroundColor: globalIntensity === 0 ? 'var(--accent-color, #4a9eff)' : undefined,
                            color: globalIntensity === 0 ? 'white' : undefined,
                            borderColor: globalIntensity === 0 ? 'transparent' : undefined,
                            opacity: globalIntensity === 0 ? 1 : 0.7
                        }}
                        onClick={() => setGlobalIntensity(0)}
                        title="Show Original (0%)"
                    >
                        Before
                    </button>
                    <button
                        className="btn"
                        style={{
                            padding: '0.25rem 0.6rem',
                            fontSize: '0.8rem',
                            minWidth: 'auto',
                            backgroundColor: globalIntensity === 100 ? 'var(--accent-color, #4a9eff)' : undefined,
                            color: globalIntensity === 100 ? 'white' : undefined,
                            borderColor: globalIntensity === 100 ? 'transparent' : undefined,
                            opacity: globalIntensity === 100 ? 1 : 0.7
                        }}
                        onClick={() => setGlobalIntensity(100)}
                        title="Show Processed (100%)"
                    >
                        After
                    </button>
                </div>
                <span className={styles.sectionLabel}>INTENSITY:</span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={globalIntensity}
                    onChange={(e) => setGlobalIntensity(Number(e.target.value))}
                    className={styles.intensityContainer}
                />
                <span className={styles.intensityValue}>{globalIntensity}%</span>
            </div>

            {processedImageUrl && (
                <button
                    className={`btn ${styles.downloadButton}`}
                    onClick={handleDownload}
                >
                    Download
                </button>
            )}
        </div>
    );
};
