import React, { useRef, useEffect, useState } from 'react';
import type { CurvesData } from '../../../../types';
import styles from './Controls.module.css';

interface CurvesControlProps {
    data: CurvesData;
    onChange: (data: CurvesData) => void;
}

export const CurvesControl: React.FC<CurvesControlProps> = ({
    data,
    onChange
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activePointIndex, setActivePointIndex] = useState<number | null>(null);
    const [hoverPointIndex, setHoverPointIndex] = useState<number | null>(null);

    // Ensure raw points are what we work with. 
    // They should be sorted by X for the interpolation to work, 
    // but the UI interaction relies on indices.
    // We will enforce sorting whenever an ADD or DELETE happens.
    // During MOVE, we constrain X to avoid crossing.
    const points = data.points;

    // Helper to draw
    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const padding = 25;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        ctx.clearRect(0, 0, width, height);

        // Grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 4; i++) {
            const pos = padding + (i / 4) * graphWidth;
            ctx.moveTo(pos, padding);
            ctx.lineTo(pos, height - padding);

            const vPos = padding + (i / 4) * graphHeight;
            ctx.moveTo(padding, vPos);
            ctx.lineTo(width - padding, vPos);
        }
        ctx.stroke();

        // Diagonal reference
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(padding, height - padding); // 0,0
        ctx.lineTo(width - padding, padding); // 255,255
        ctx.stroke();

        // Curve
        // For drawing, we interpret points as 0-255.
        // We need a sorted copy to draw the line correctly if they are somehow unsorted,
        // but our logic enforces order.
        const sortedPoints = [...points].sort((a, b) => a.x - b.x);

        ctx.strokeStyle = data.channel === 'rgb' ? '#ffffff' :
            data.channel === 'red' ? '#ff5555' :
                data.channel === 'green' ? '#55ff55' : '#5555ff';
        ctx.lineWidth = 2;
        ctx.beginPath();

        if (sortedPoints.length > 0) {
            // Draw line segments between points
            // (Ideally spline, but linear for UI feedback is often enough or standard)
            // The backend uses Monotone Cubic. We should try to match? 
            // For now, straight lines to visualize the control points.
            // If user wants standard curves, they usually expect spline visual.
            // But let's stick to simple lines connecting dots for robustness first.

            const firstP = sortedPoints[0];
            ctx.moveTo(
                padding + (firstP.x / 255) * graphWidth,
                height - padding - (firstP.y / 255) * graphHeight
            );

            for (let i = 1; i < sortedPoints.length; i++) {
                const p = sortedPoints[i];
                ctx.lineTo(
                    padding + (p.x / 255) * graphWidth,
                    height - padding - (p.y / 255) * graphHeight
                );
            }
        }
        ctx.stroke();

        // Points
        points.forEach((p, i) => {
            const x = padding + (p.x / 255) * graphWidth;
            const y = height - padding - (p.y / 255) * graphHeight;

            ctx.fillStyle = i === activePointIndex ? '#ffffff' : 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(x, y, i === activePointIndex || i === hoverPointIndex ? 6 : 4, 0, Math.PI * 2);
            ctx.fill();

            if (i === activePointIndex) {
                ctx.strokeStyle = 'rgba(0,0,0,0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
    };

    useEffect(() => {
        draw();
    }, [data, activePointIndex, hoverPointIndex]);

    const getMousePos = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const padding = 25;
        const graphWidth = canvas.width - padding * 2;
        const graphHeight = canvas.height - padding * 2;

        // Normalized 0-1
        let nx = (e.clientX - rect.left - padding) / graphWidth;
        let ny = (canvas.height - padding - (e.clientY - rect.top)) / graphHeight;

        nx = Math.max(0, Math.min(1, nx));
        ny = Math.max(0, Math.min(1, ny));

        return { x: nx * 255, y: ny * 255 };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const { x, y } = getMousePos(e); // 0-255

        // Find clicked point (threshold ~10px equivalent in value)
        // 255 units = graphWidth px. 10px approx 10/graphWidth * 255.
        // graphWidth approx 200. so 5% approx 12 units?
        const threshold = 15;

        // Important: check in reverse order to prefer top points if overlap?
        const clickedIndex = points.findIndex(p =>
            Math.abs(p.x - x) < threshold && Math.abs(p.y - y) < threshold
        );

        if (clickedIndex !== -1) {
            setActivePointIndex(clickedIndex);
        } else {
            // Add new point
            const newPoint = { x, y };
            // We must insert it in sorted order to keep array sorted
            const newPoints = [...points, newPoint].sort((a, b) => a.x - b.x);

            // Find where it went
            // const newIndex = newPoints.indexOf(newPoint);
            // Better: find index by value equality (roughly) or just trust sort
            // But we created the object reference 'newPoint', so indexOf works if we preserve reference before deep cloning/serialising? 
            // onChange serialises.
            // So we need to find index based on x/y
            const realIndex = newPoints.findIndex(p => p.x === x && p.y === y);

            onChange({ ...data, points: newPoints });
            setActivePointIndex(realIndex);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const { x, y } = getMousePos(e);

        // Hover
        const threshold = 15;
        const hovered = points.findIndex(p =>
            Math.abs(p.x - x) < threshold && Math.abs(p.y - y) < threshold
        );
        setHoverPointIndex(hovered);

        if (activePointIndex !== null) {
            const newPoints = [...points];
            const p = { ...newPoints[activePointIndex] }; // copy

            // Constraint Y (always free)
            p.y = y;

            // Constraint X
            if (activePointIndex === 0) {
                p.x = 0; // First point locked to left wall
            } else if (activePointIndex === points.length - 1) {
                p.x = 255; // Last point locked to right wall
            } else {
                // Middle points: Constrained by neighbors
                const prevX = points[activePointIndex - 1].x;
                const nextX = points[activePointIndex + 1].x;
                const minSeparation = 2; // maintain small gap

                p.x = Math.max(prevX + minSeparation, Math.min(nextX - minSeparation, x));
            }

            newPoints[activePointIndex] = p;
            onChange({ ...data, points: newPoints });
        }
    };

    const handleMouseUp = () => {
        setActivePointIndex(null);
    };

    const handleDoubleClick = (e: React.MouseEvent) => {
        const { x, y } = getMousePos(e);
        const threshold = 15;
        const clickedIndex = points.findIndex(p =>
            Math.abs(p.x - x) < threshold && Math.abs(p.y - y) < threshold
        );

        if (clickedIndex !== -1) {
            // Don't remove endpoints
            if (clickedIndex === 0 || clickedIndex === points.length - 1) return;

            const newPoints = points.filter((_, i) => i !== clickedIndex);
            onChange({ ...data, points: newPoints });
            setActivePointIndex(null);
        }
    };

    return (
        <div className={styles.controlContainer}>
            <div className={styles.controlGroup}>
                <select
                    value={data.channel}
                    onChange={(e) => onChange({ ...data, channel: e.target.value as any })}
                    className={`${styles.select} ${styles.wAuto}`}
                >
                    <option value="rgb">RGB (Master)</option>
                    <option value="red">Red</option>
                    <option value="green">Green</option>
                    <option value="blue">Blue</option>
                </select>
            </div>

            <div className={styles.canvasContainer}>
                <canvas
                    ref={canvasRef}
                    width={250}
                    height={250}
                    className={styles.canvas}
                    style={{
                        cursor: activePointIndex !== null ? 'grabbing' : hoverPointIndex !== null ? 'grab' : 'crosshair',
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onDoubleClick={handleDoubleClick}
                />
            </div>
            <div className={`${styles.helpText} ${styles.textCenter}`}>
                Double-click to remove point. Endpoints fixed.
            </div>

            {/* Levels Controls - Keeping existing UI */}
            <div className={styles.sectionHeader}>
                <h4 className={styles.sectionTitle}>Levels</h4>

                {/* Input Levels */}
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Input Black / White</label>
                        <span className={styles.value}>{data.inputMin ?? 0} - {data.inputMax ?? 255}</span>
                    </div>
                    <div className={styles.dualSliderContainer}>
                        <input
                            type="range"
                            min="0"
                            max="255"
                            value={data.inputMin ?? 0}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                onChange({ ...data, inputMin: Math.min(val, (data.inputMax ?? 255) - 1) });
                            }}
                            className={styles.slider}
                        />
                        <input
                            type="range"
                            min="0"
                            max="255"
                            value={data.inputMax ?? 255}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                onChange({ ...data, inputMax: Math.max(val, (data.inputMin ?? 0) + 1) });
                            }}
                            className={styles.slider}
                        />
                    </div>
                </div>

                {/* Gamma */}
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Gamma (Midtones)</label>
                        <span className={styles.value}>{data.gamma ?? 1.0}</span>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="5.0"
                        step="0.01"
                        value={data.gamma ?? 1.0}
                        onChange={(e) => onChange({ ...data, gamma: Number(e.target.value) })}
                        className={styles.slider}
                    />
                </div>

                {/* Output Levels */}
                <div className={styles.controlGroup}>
                    <div className={styles.controlHeader}>
                        <label className={styles.label}>Output Black / White</label>
                        <span className={styles.value}>{data.outputMin ?? 0} - {data.outputMax ?? 255}</span>
                    </div>
                    <div className={styles.dualSliderContainer}>
                        <input
                            type="range"
                            min="0"
                            max="255"
                            value={data.outputMin ?? 0}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                onChange({ ...data, outputMin: Math.min(val, (data.outputMax ?? 255) - 1) });
                            }}
                            className={styles.slider}
                        />
                        <input
                            type="range"
                            min="0"
                            max="255"
                            value={data.outputMax ?? 255}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                onChange({ ...data, outputMax: Math.max(val, (data.outputMin ?? 0) + 1) });
                            }}
                            className={styles.slider}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
