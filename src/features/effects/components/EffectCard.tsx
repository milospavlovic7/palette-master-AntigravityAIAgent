import React from 'react';
import type { Effect } from '../../../types';

interface EffectCardProps {
    effect: Effect;
    onUpdate: (updatedEffect: Effect) => void;
    onRemove: (id: string) => void;
    onSavePalette?: () => void; // Optional action for fine-tune
    children: React.ReactNode;
    onDragStart?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    onSolo?: () => void;
}

import styles from './Effects.module.css';

export const EffectCard: React.FC<EffectCardProps> = ({
    effect,
    onUpdate,
    onRemove,
    onSavePalette,
    children,
    onDragStart,
    onDragOver,
    onDragEnd,
    onSolo
}) => {
    const [isDraggable, setIsDraggable] = React.useState(false);

    const toggleCollapse = () => {
        onUpdate({ ...effect, isCollapsed: !effect.isCollapsed });
    };

    return (
        <div
            draggable={!!onDragStart && isDraggable}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            className={styles.effectCard}
        >
            {/* Header */}
            <div
                className={`${styles.effectHeader} ${effect.isCollapsed ? styles.collapsed : ''}`}
                onClick={toggleCollapse}
            >
                <div className={styles.headerLeft}>
                    {/* Drag Handle */}
                    {onDragStart && (
                        <div
                            className={styles.dragHandle}
                            onMouseEnter={() => setIsDraggable(true)}
                            onMouseLeave={() => setIsDraggable(false)}
                        >
                            <div className={styles.dragDots}>
                                <div className={styles.dot} />
                                <div className={styles.dot} />
                            </div>
                            <div className={styles.dragDots}>
                                <div className={styles.dot} />
                                <div className={styles.dot} />
                            </div>
                            <div className={styles.dragDots}>
                                <div className={styles.dot} />
                                <div className={styles.dot} />
                            </div>
                        </div>
                    )}

                    <span
                        className={styles.collapseIcon}
                        style={{ transform: effect.isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                    >▼</span>
                    <span className={styles.effectName}>
                        {effect.name}
                    </span>
                </div>

                <div className={styles.headerRight}>
                    {onSolo && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSolo(); }}
                            title="Solo Effect"
                            className={styles.iconButton}
                            style={{
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                color: effect.isEnabled ? 'var(--text-secondary)' : 'var(--text-muted)'
                            }}
                        >
                            S
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onUpdate({ ...effect, isEnabled: !effect.isEnabled }); }}
                        title={effect.isEnabled ? "Disable Effect" : "Enable Effect"}
                        className={`${styles.iconButton} ${effect.isEnabled ? styles.active : ''}`}
                    >
                        {effect.isEnabled ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                            </svg>
                        )}
                    </button>
                    {onSavePalette && !effect.isCollapsed && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onSavePalette(); }}
                            className={`btn ${styles.saveButton}`}
                        >
                            Save New
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(effect.id); }}
                        className={`${styles.iconButton} ${styles.removeButton}`}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Content */}
            {!effect.isCollapsed && (
                <div className={styles.effectContent}>
                    {children}
                </div>
            )}
        </div>
    );
};
