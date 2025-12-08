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
            // Let browser handle zoom if ctrl is pressed (optional, but good for accessibility)
            return;
        }

        // Prevent default behavior if we want to block page scrolling, 
        // but usually we can't preventDefault in passive listeners easily in React.
        // Ideally this is attached to a non-passive listener or we just accept it.

        if (e.deltaY < 0) {
            setZoom(prev => Math.min(prev * 1.1, 5));
        } else {
            setZoom(prev => Math.max(prev / 1.1, 0.1));
        }
    }, []);

    const handlePanStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsPanning(true);
    }, []);

    const handlePanMove = useCallback((e: React.MouseEvent) => {
        if (!isPanning) return;
        setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
    }, [isPanning]);

    const handlePanEnd = useCallback(() => {
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
