import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import type { Effect, FineTuneEffectData } from '../types';
import { usePaletteManager } from '../features/palette/hooks/usePaletteManager';
import { useEffectsManager } from '../features/effects/hooks/useEffectsManager';
import { usePresets } from '../features/effects/hooks/usePresets';
import { useImageWorker } from '../hooks/useImageWorker';
import { useCanvasInteraction } from '../hooks/useCanvasInteraction';
import { useLayoutResizing } from '../hooks/useLayoutResizing';

import { TopToolbar } from '../features/toolbar/components/TopToolbar';
import { BottomToolbar } from '../features/toolbar/components/BottomToolbar';
import { CanvasArea } from '../features/canvas/components/CanvasArea';
import { PaletteGenerator } from '../features/palette/components/PaletteGenerator';
import { PaletteLibrary } from '../features/palette/components/PaletteLibrary';
import { EffectChain } from '../features/effects/components/EffectChain';
import { EffectMenu } from '../features/effects/components/EffectMenu';
import { PresetsToolbar } from '../features/effects/components/PresetsToolbar';

import styles from './MainPage.module.css';

export const MainPage: React.FC = () => {
    // Hooks
    const {
        colors, colorCount, setColorCount, savedPalettes,
        savePalette, deletePalette, updateColors
    } = usePaletteManager();

    const {
        effects, setEffects, globalIntensity, setGlobalIntensity,
        addEffect, updateEffect, removeEffect, reorderEffects, createFineTuneEffect
    } = useEffectsManager();

    const {
        presets, activePresetId, setActivePresetId, savePreset, loadPreset, deletePreset,
        importPresets, exportPresets
    } = usePresets(effects, setEffects);

    const { processedImageUrl, processedDimensions, processImage } = useImageWorker();

    const {
        zoom, pan, isPanning,
        handleZoomIn, handleZoomOut, handleWheel,
        handlePanStart, handlePanMove, handlePanEnd, resetView,
        setZoom, setPan
    } = useCanvasInteraction();

    const {
        sidebarWidth, fineTuneWidth, toolbarHeight, resizingState, startResizing
    } = useLayoutResizing();

    // Local State
    const [targetImage, setTargetImage] = useState<{ data: ImageData, url: string } | null>(null);
    const [showEffectMenu, setShowEffectMenu] = useState(false);
    const [isFitToScreen, setIsFitToScreen] = useState(false);
    const addEffectButtonRef = useRef<HTMLButtonElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);

    // Effects Processing
    useEffect(() => {
        if (targetImage) {
            processImage(targetImage.data, effects, globalIntensity);
        }
    }, [targetImage, effects, globalIntensity, processImage]);

    const handleColorsGenerated = (newColors: string[]) => {
        updateColors(newColors);
        if (effects.length === 0) {
            setEffects([createFineTuneEffect(newColors)]);
        }
    };

    const handleSelectPalette = (paletteColors: string[]) => {
        const idx = effects.findIndex(e => e.type === 'fine-tune');
        const newEffect = createFineTuneEffect(paletteColors);

        if (idx !== -1) {
            const newEffects = [...effects];
            newEffects[idx] = newEffect;
            setEffects(newEffects);
        } else {
            setEffects([newEffect, ...effects]);
        }
    };

    const handleResetChain = () => {
        if (confirm('Are you sure you want to reset the effect chain?')) {
            setEffects(prev => prev.filter(e => e.isLocked));
            setActivePresetId('');
        }
    };

    const calculateFitZoom = () => {
        if (!targetImage) return;

        const containerW = window.innerWidth - sidebarWidth - fineTuneWidth;
        const containerH = window.innerHeight - toolbarHeight - 40;

        // Use processed dimensions if available, otherwise original
        const imgW = processedDimensions?.width ?? targetImage.data.width;
        const imgH = processedDimensions?.height ?? targetImage.data.height;

        if (imgW > 0 && imgH > 0) {
            const scaleW = containerW / imgW;
            const scaleH = containerH / imgH;
            const newZoom = Math.min(scaleW, scaleH);
            setZoom(Math.max(0.1, newZoom));
            setPan({ x: 0, y: 0 });
        }
    };

    const handleFitToScreen = () => {
        setIsFitToScreen(true);
        calculateFitZoom();
    };

    // Re-apply fit when dimensions change if fit mode is active
    // Re-apply fit when dimensions change if fit mode is active
    // We use useLayoutEffect to update zoom BEFORE the browser paints the new image frame,
    // preventing the visual "blink" where the image momentarily appears at the wrong size.
    useLayoutEffect(() => {
        if (isFitToScreen) {
            calculateFitZoom();
        }
    }, [isFitToScreen, processedDimensions, sidebarWidth, fineTuneWidth, toolbarHeight]);

    // Add window resize listener
    useEffect(() => {
        const handleResize = () => {
            if (isFitToScreen) calculateFitZoom();
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isFitToScreen, processedDimensions, targetImage]); // Re-calc on resize needs latest data

    // Disable fit mode on manual zoom interaction
    const onManualZoom = () => {
        setIsFitToScreen(false);
    };

    const handleSaveEffectPalette = (effect: Effect) => {
        if (effect.type === 'fine-tune') {
            const data = effect.data as FineTuneEffectData;
            const paletteColors = data.colors.map(c => c.hex);
            savePalette(paletteColors);
        }
    };

    const handleSolo = (id: string) => {
        const isAlreadySoloed = effects.every(e =>
            e.id === id ? e.isEnabled : !e.isEnabled
        );

        if (isAlreadySoloed) {
            // Un-solo: Enable all
            const newEffects = effects.map(e => ({ ...e, isEnabled: true }));
            setEffects(newEffects);
        } else {
            // Solo target
            const newEffects = effects.map(e => ({
                ...e,
                isEnabled: e.id === id
            }));
            setEffects(newEffects);
        }
    };


    return (
        <div className={styles.container}>
            <TopToolbar />

            <div className={styles.workspace}>

                {/* LEFT SIDEBAR */}
                <div
                    className={styles.sidebar}
                    style={{ width: sidebarWidth }}
                >
                    <div className={styles.sidebarContent}>
                        <PaletteGenerator
                            onColorsGenerated={handleColorsGenerated}
                            colors={colors}
                            colorCount={colorCount}
                            setColorCount={setColorCount}
                            onSavePalette={savePalette}
                            isSaved={savedPalettes.some(p => JSON.stringify(p.colors) === JSON.stringify(colors))}
                        />

                        <hr className={styles.separator} />

                        <PaletteLibrary
                            savedPalettes={savedPalettes}
                            onSelect={handleSelectPalette}
                            onDelete={deletePalette}
                        />
                    </div>
                </div>

                {/* Sidebar Resizer */}
                <div
                    onMouseDown={() => startResizing('sidebar')}
                    className={styles.resizerVertical}
                    style={{
                        backgroundColor: resizingState.type === 'sidebar' ? 'var(--accent-primary)' : 'transparent',
                    }}
                />

                {/* MAIN CONTENT */}
                <div className={styles.mainContent}>

                    {/* Toolbar */}
                    <div
                        className={styles.toolbarContainer}
                        style={{ height: toolbarHeight }}
                    >
                        <BottomToolbar
                            onTargetImageLoad={(data, url) => setTargetImage({ data, url })}
                            globalIntensity={globalIntensity}
                            setGlobalIntensity={setGlobalIntensity}
                            processedImageUrl={processedImageUrl}
                        />
                    </div>

                    {/* Toolbar Resizer */}
                    <div
                        onMouseDown={() => startResizing('toolbar')}
                        className={styles.resizerHorizontal}
                        style={{
                            backgroundColor: resizingState.type === 'toolbar' ? 'var(--accent-primary)' : 'transparent',
                        }}
                    />

                    <div className={styles.canvasContainer} ref={canvasContainerRef}>
                        {/* Canvas Area */}
                        <CanvasArea
                            processedImageUrl={processedImageUrl}
                            targetImage={targetImage}
                            onTargetImageChange={(data, url) => setTargetImage({ data, url })}
                            zoom={zoom}
                            pan={pan}
                            isPanning={isPanning}
                            onWheel={(e) => { onManualZoom(); handleWheel(e); }}
                            onPanStart={handlePanStart}
                            onPanMove={handlePanMove}
                            onPanEnd={handlePanEnd} // Re-use handlePanEnd just to stop native drag, though meaningful logic is in Move
                            onFitToScreen={handleFitToScreen}
                            onZoomIn={() => { onManualZoom(); handleZoomIn(); }}
                            onZoomOut={() => { onManualZoom(); handleZoomOut(); }}
                            onResetView={() => { onManualZoom(); resetView(); }}
                            isFitToScreen={isFitToScreen}
                        />

                        {/* Fine Tune Drag Handle */}
                        <div
                            onMouseDown={() => startResizing('finetune')}
                            className={styles.resizerVertical}
                            style={{
                                backgroundColor: resizingState.type === 'finetune' ? 'var(--accent-primary)' : 'transparent',
                            }}
                        />

                        {/* RIGHT SIDEBAR (Effects) */}
                        <div
                            className={styles.rightPanel}
                            style={{ width: fineTuneWidth }}
                        >
                            <PresetsToolbar
                                presets={presets}
                                activePresetId={activePresetId}
                                onLoad={loadPreset}
                                onSave={savePreset}
                                onDelete={deletePreset}
                                onImport={importPresets}
                                onExport={exportPresets}
                                onReset={handleResetChain}
                            />

                            <div className={styles.effectsList}>
                                <EffectChain
                                    effects={effects}
                                    onUpdate={updateEffect}
                                    onRemove={removeEffect}
                                    onReorder={reorderEffects}
                                    onSavePalette={handleSaveEffectPalette}
                                    onSolo={handleSolo}
                                />

                                <div className={styles.addEffectContainer}>
                                    <button
                                        ref={addEffectButtonRef}
                                        onClick={() => setShowEffectMenu(!showEffectMenu)}
                                        className={`btn btn-secondary ${styles.addEffectButton}`}
                                    >
                                        <span className={styles.addEffectIcon}>+</span> Add Effect
                                    </button>

                                    <EffectMenu
                                        isOpen={showEffectMenu}
                                        onClose={() => setShowEffectMenu(false)}
                                        onSelect={(type) => {
                                            addEffect(type);
                                            setShowEffectMenu(false);
                                        }}
                                        triggerRef={addEffectButtonRef}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
