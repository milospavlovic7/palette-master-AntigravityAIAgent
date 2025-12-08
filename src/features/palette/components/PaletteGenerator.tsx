import React from 'react';
import { ImageUpload } from './ImageUpload';
import { PaletteDisplay } from './PaletteDisplay';
import { extractColors, sortColorsByLuminance } from '../../../utils/colorUtils';

interface PaletteGeneratorProps {
    onColorsGenerated: (colors: string[]) => void;
    colors: string[];
    colorCount: number;
    setColorCount: (count: number) => void;
    onSavePalette: () => void;
    isSaved: boolean;
}

import styles from './Palette.module.css';

export const PaletteGenerator: React.FC<PaletteGeneratorProps> = ({
    onColorsGenerated,
    colors,
    colorCount,
    setColorCount,
    onSavePalette,
    isSaved
}) => {
    const [currentImageData, setCurrentImageData] = React.useState<ImageData | null>(null);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

    // Re-extract colors when color count changes
    React.useEffect(() => {
        if (currentImageData) {
            const newColors = extractColors(currentImageData, colorCount);
            const sortedColors = sortColorsByLuminance(newColors);
            onColorsGenerated(sortedColors);
        }
    }, [colorCount, currentImageData]);

    const handleImageLoad = (imageData: ImageData, imageUrl: string) => {
        setCurrentImageData(imageData);
        setPreviewUrl(imageUrl);
        // Initial extraction is handled by the effect or we can do it here to be immediate
        // Doing it here avoids a double-render if colorCount hasn't changed, but effect is safer for consistency
        const newColors = extractColors(imageData, colorCount);
        const sortedColors = sortColorsByLuminance(newColors);
        onColorsGenerated(sortedColors);
    };

    const handlePaste = async () => {
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                const type = item.types.find(t => t.startsWith('image/'));
                if (type) {
                    const blob = await item.getType(type);
                    const url = URL.createObjectURL(blob);

                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(img, 0, 0);
                            const imageData = ctx.getImageData(0, 0, img.width, img.height);

                            setCurrentImageData(imageData);
                            setPreviewUrl(url);

                            const newColors = extractColors(imageData, colorCount);
                            const sortedColors = sortColorsByLuminance(newColors);
                            onColorsGenerated(sortedColors);
                        }
                    };
                    img.src = url;
                    break;
                }
            }
        } catch (err) {
            console.error("Paste failed", err);
            alert("Could not paste image from clipboard. Make sure you have copied an image.");
        }
    };

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
                Generate Palette
            </h2>

            <ImageUpload onImageLoad={handleImageLoad} previewUrl={previewUrl} />
            <div className={styles.previewContainer}>
                <button
                    onClick={handlePaste}
                    className="btn"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                >
                    Paste to Palette
                </button>
            </div>

            {colors.length > 0 && (
                <div className={styles.controlsContainer}>
                    <div className={styles.controlRow}>
                        <label className={styles.label}>Colors:</label>
                        <input
                            type="number"
                            min="2"
                            max="10"
                            value={colorCount}
                            onChange={(e) => setColorCount(Math.max(2, Math.min(10, Number(e.target.value))))}
                            className={styles.numberInput}
                        />
                    </div>

                    <PaletteDisplay
                        colors={colors}
                        onSave={onSavePalette}
                        saved={isSaved}
                    />
                </div>
            )}
        </section>
    );
};
