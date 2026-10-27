import React from 'react';

interface CanvasAreaProps {
    processedImageUrl: string | null;
    targetImage: { data: ImageData, url: string } | null;
    onTargetImageChange: (data: ImageData, url: string) => void;
    zoom: number;
    pan: { x: number, y: number };
    isPanning: boolean;
    onWheel: (e: React.WheelEvent) => void;
    onPanStart: (e: React.PointerEvent) => void;
    onPanMove: (e: React.PointerEvent) => void;
    onPanEnd: (e: React.PointerEvent) => void;
    onFitToScreen: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
    isFitToScreen?: boolean;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
    processedImageUrl,
    targetImage,
    onTargetImageChange,
    zoom,
    pan,
    isPanning,
    onWheel,
    onPanStart,
    onPanMove,
    onPanEnd,
    onFitToScreen,
    onZoomIn,
    onZoomOut,
    onResetView,
    isFitToScreen
}) => {
    const handlePaste = async () => {
        try {
            const items = await navigator.clipboard.read();
            for (const item of items) {
                const type = item.types.find(t => t.startsWith('image/'));
                if (type) {
                    const blob = await item.getType(type);
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                                ctx.drawImage(img, 0, 0);
                                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                                onTargetImageChange(imageData, canvas.toDataURL());
                            }
                        };
                        img.src = event.target?.result as string;
                    };
                    reader.readAsDataURL(blob);
                    break;
                }
            }
        } catch (err) {
            console.error("Paste failed", err);
            alert("Could not paste image from clipboard.");
        }
    };

    return (
        <div
            style={{
                flex: 1,
                backgroundColor: '#050505',
                backgroundImage: 'radial-gradient(#1a1a1a 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                position: 'relative',
                overflow: 'hidden',
                cursor: isPanning ? 'grabbing' : 'grab',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'none' // Important for pointer events
            }}
            onWheel={onWheel}
            onPointerDown={onPanStart}
            onPointerMove={onPanMove}
            onPointerUp={onPanEnd}
        // onPointerLeave is NOT needed because of setPointerCapture
        >
            {processedImageUrl ? (
                <img
                    src={processedImageUrl}
                    alt="Processed"
                    draggable={false}
                    style={{
                        maxWidth: 'none',
                        maxHeight: 'none',
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        imageRendering: 'pixelated',
                        pointerEvents: 'none'
                    }}
                />
            ) : targetImage ? (
                <img
                    src={targetImage.url}
                    alt="Original"
                    draggable={false}
                    style={{
                        maxWidth: 'none',
                        maxHeight: 'none',
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                        opacity: 1,
                        pointerEvents: 'none'
                    }}
                />
            ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>No Target Image</h3>
                    <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>Upload an image in the top bar to start remixing</p>
                    <button
                        onClick={handlePaste}
                        className="btn"
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    >
                        Paste from Clipboard
                    </button>
                </div>
            )}

            {/* Paste Overlay Button (Visible when image exists) */}
            {targetImage && (
                <button
                    onClick={handlePaste}
                    className="btn"
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem',
                        zIndex: 20,
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)'
                    }}
                    title="Replace with Clipboard Image"
                >
                    Paste / Replace
                </button>
            )}

            {/* Zoom Controls */}
            <div style={{
                position: 'absolute',
                bottom: '1rem',
                right: '1rem',
                display: 'flex',
                gap: '0.5rem',
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: '0.5rem',
                borderRadius: 'var(--radius-md)',
                backdropFilter: 'blur(4px)'
            }}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onZoomOut}
                    className="btn"
                    style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    title="Zoom Out"
                >
                    -
                </button>
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '40px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    {Math.round(zoom * 100)}%
                </span>
                <button
                    onClick={onZoomIn}
                    className="btn"
                    style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    title="Zoom In"
                >
                    +
                </button>
                <button
                    onClick={onResetView}
                    className="btn"
                    style={{ fontSize: '0.7rem', padding: '0 8px' }}
                    title="Reset View"
                >
                    Reset
                </button>
                <button
                    onClick={onFitToScreen}
                    className="btn"
                    style={{
                        fontSize: '0.7rem',
                        padding: '0 8px',
                        backgroundColor: isFitToScreen ? '#22c55e' : 'var(--bg-tertiary)',
                        color: '#fff'
                    }}
                    title="Fit to Screen"
                >
                    Fit
                </button>
            </div>
        </div>
    );
};
