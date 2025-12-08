import React, { useRef, useEffect } from 'react';
import type { EffectType } from '../../../types';

interface EffectMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: EffectType) => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
}

import styles from './Effects.module.css';

export const EffectMenu: React.FC<EffectMenuProps> = ({ isOpen, onClose, onSelect, triggerRef }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
                triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, triggerRef]);

    if (!isOpen) return null;

    const categories = [
        { name: 'Adjust', items: ['fine-tune', 'contrast-brightness', 'hsl', 'curves'] },
        { name: 'Transform', items: ['resize', 'pixel-sort', 'datamosh', 'glitch'] },
        { name: 'Filter', items: ['dither', 'ascii', 'halftone', 'blur', 'sharpen', 'antialias', 'glow'] },
    ];

    return (
        <div
            ref={menuRef}
            className={`card ${styles.menuCard}`}
        >
            {categories.map(cat => (
                <div key={cat.name} className={styles.category}>
                    <div className={styles.categoryTitle}>
                        {cat.name}
                    </div>
                    {cat.items.map(type => (
                        <button
                            key={type}
                            className={`btn-secondary ${styles.menuItem}`}
                            onClick={() => onSelect(type as EffectType)}
                        >
                            {type.replace(/-/g, ' ')}
                        </button>
                    ))}
                </div>
            ))}
        </div>
    );
};
