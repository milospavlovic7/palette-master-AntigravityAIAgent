import { useRef, useEffect, useState, useCallback } from 'react';
import type { Effect } from '../types';
// @ts-ignore
import ImageWorker from '../imageWorker.ts?worker&inline';

interface WorkerMessage {
    id: string;
    imageData?: ImageData;
    error?: string;
}

interface WorkerRequest {
    id: string;
    imageData: ImageData;
    effects: Effect[];
    globalIntensity: number;
}

export const useImageWorker = () => {
    const workerRef = useRef<Worker | null>(null);
    const isProcessingRef = useRef(false);
    const pendingRequestRef = useRef<WorkerRequest | null>(null);
    const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [processedDimensions, setProcessedDimensions] = useState<{ width: number, height: number } | null>(null);

    useEffect(() => {
        // Initialize worker
        // Initialize worker
        workerRef.current = new ImageWorker();

        workerRef.current.onmessage = (e: MessageEvent<WorkerMessage>) => {
            const { imageData, error } = e.data;
            isProcessingRef.current = false;
            setIsProcessing(false);

            if (error) {
                console.error("Worker error:", error);
                setError(error);
            } else if (imageData) {
                // Create a temporary canvas to convert ImageData to URL
                const canvas = document.createElement('canvas');
                canvas.width = imageData.width;
                canvas.height = imageData.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.putImageData(imageData, 0, 0);
                    setProcessedImageUrl(canvas.toDataURL());
                    setProcessedDimensions({ width: imageData.width, height: imageData.height });
                }
            }

            // Check for pending request
            if (pendingRequestRef.current) {
                const req = pendingRequestRef.current;
                pendingRequestRef.current = null;
                sendToWorker(req.imageData, req.effects, req.globalIntensity);
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const sendToWorker = useCallback((imageData: ImageData, effects: Effect[], globalIntensity: number) => {
        if (!workerRef.current) return;

        if (isProcessingRef.current) {
            pendingRequestRef.current = {
                id: crypto.randomUUID(),
                imageData,
                effects: JSON.parse(JSON.stringify(effects)), // Deep copy to avoid mutation issues
                globalIntensity
            };
            return;
        }

        isProcessingRef.current = true;
        setIsProcessing(true);
        setError(null);

        // We'll send a copy of the buffer because we need to keep the original in the main thread 
        // for the next update (original is immutable source of truth here).
        // BUT, wait. If we structure clone a 32MB buffer 60fps it kills the browser.
        // We can't transfer the buffer if `imageData` is the ONLY copy of the original (e.g. from `targetImage`).
        // If we transfer it, `targetImage` becomes detached.
        // So we MUST copy it. But we can do it smarter or just throttle?

        // The issue is likely the sheer frequency. 
        // However, standard `postMessage` with a huge buffer is slow.
        // Let's at least try to transfer if we can, or just optimize.

        // BETTER FIX: Debounce the processing in hooks/useEffects. 
        // But for now, let's just make the worker efficient.

        // To properly support "transfer", we'd need to convert ImageData to ArrayBuffer, 
        // send it, and have the worker send it BACK.

        // For now, let's just ensure we aren't doing unnecessary JSON.parse/stringify if not needed?
        // Actually, JSON.stringify(effects) is also happening on every frame.

        workerRef.current.postMessage({
            id: crypto.randomUUID(),
            imageData: imageData, // Browsers optimize structure clone of ImageData usually
            effects: JSON.parse(JSON.stringify(effects)),
            globalIntensity
        });
    }, []);

    return {
        processedImageUrl,
        processedDimensions,
        isProcessing,
        error,
        processImage: sendToWorker
    };
};
