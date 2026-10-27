import { useState, useCallback } from 'react';

interface PanState {
    x: number;
    y: number;
}

export const useCanvasInteraction = () => {
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState<PanState>({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);

    const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev * 1.2, 5)), []);
    const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev / 1.2, 0.1)), []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            return;
        }

        if (e.deltaY < 0) {
            setZoom(prev => Math.min(prev * 1.1, 5));
        } else {
            setZoom(prev => Math.max(prev / 1.1, 0.1));
        }
    }, []);

    const handlePanStart = useCallback((e: React.PointerEvent) => {
        e.preventDefault();
        // Capture pointer to ensure we get drag events even if cursor leaves the element
        (e.target as Element).setPointerCapture(e.pointerId);
        setIsPanning(true);
    }, []);

    const handlePanMove = useCallback((e: React.PointerEvent) => {
        if (!isPanning) return;
        setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }, [isPanning]);

    const handlePanEnd = useCallback((e: React.PointerEvent) => {
        (e.target as Element).releasePointerCapture(e.pointerId);
        setIsPanning(false);
    }, []);

    const resetView = useCallback(() => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    }, []);

    return {
        zoom,
        pan,
        isPanning,
        handleZoomIn,
        handleZoomOut,
        handleWheel,
        handlePanStart,
        handlePanMove,
        handlePanEnd,
        resetView,
        setZoom,
        setPan
    };
};
