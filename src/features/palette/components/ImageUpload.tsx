import React, { useRef, useState } from 'react';

interface ImageUploadProps {
    onImageLoad: (imageData: ImageData, imageUrl: string) => void;
    label?: string;
}

import styles from './Palette.module.css';

export const ImageUpload: React.FC<ImageUploadProps & { previewUrl?: string | null }> = ({ onImageLoad, label = "Upload Image", previewUrl }) => {
    const [internalPreview, setInternalPreview] = useState<string | null>(null);
    const preview = previewUrl !== undefined ? previewUrl : internalPreview;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setInternalPreview(url);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Resize for performance if needed, but keep reasonable quality
            const maxWidth = 800;
            const scale = Math.min(1, maxWidth / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            onImageLoad(imageData, url);
        };
        img.src = url;
    };

    return (
        <div
            className={styles.uploadContainer}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className={styles.hiddenInput}
            />

            {preview ? (
                <div className={styles.previewWrapper}>
                    <img
                        src={preview}
                        alt="Preview"
                        className={styles.previewImg}
                    />
                    <div className={styles.changeOverlay}>
                        <span>Change Image</span>
                    </div>
                </div>
            ) : (
                <div className={styles.uploadContent}>
                    <p className={styles.uploadIcon}>📁</p>
                    <p className={styles.uploadLabel}>{label}</p>
                </div>
            )}
        </div>
    );
};
