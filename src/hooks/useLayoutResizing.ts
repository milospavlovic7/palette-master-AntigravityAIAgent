import { useState, useCallback, useEffect } from 'react';

type ResizeType = 'sidebar' | 'finetune' | 'preview' | 'toolbar' | null;

interface ResizingState {
    active: boolean;
    type: ResizeType;
}

export const useLayoutResizing = () => {
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const [fineTuneWidth, setFineTuneWidth] = useState(400);
    const [previewHeight, setPreviewHeight] = useState(600);
    const [toolbarHeight, setToolbarHeight] = useState(80);

    const [resizingState, setResizingState] = useState<ResizingState>({ active: false, type: null });

    const startResizing = useCallback((type: ResizeType) => {
        setResizingState({ active: true, type });
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!resizingState.active) return;

        if (resizingState.type === 'sidebar') {
            setSidebarWidth(Math.max(200, Math.min(500, e.clientX)));
        } else if (resizingState.type === 'finetune') {
            setFineTuneWidth(Math.max(200, Math.min(500, window.innerWidth - e.clientX)));
        } else if (resizingState.type === 'preview') {
            setPreviewHeight(Math.max(200, e.clientY - 100)); // Approximate offset
        } else if (resizingState.type === 'toolbar') {
            setToolbarHeight(Math.max(60, Math.min(300, e.clientY)));
        }
    }, [resizingState]);

    const handleMouseUp = useCallback(() => {
        setResizingState({ active: false, type: null });
    }, []);

    useEffect(() => {
        if (resizingState.active) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = resizingState.type === 'preview' || resizingState.type === 'toolbar' ? 'row-resize' : 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingState, handleMouseMove, handleMouseUp]);

    return {
        sidebarWidth,
        fineTuneWidth,
        previewHeight,
        toolbarHeight,
        resizingState,
        startResizing
    };
};
