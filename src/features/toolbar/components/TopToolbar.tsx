import styles from './Toolbar.module.css';

export const TopToolbar: React.FC = () => {
    return (
        <header className={styles.topToolbar}>
            <div className={styles.logo}>
                PALETTE MASTER
            </div>
            <div style={{ flex: 1, textAlign: 'center', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                PALETTE MASTER
            </div>
            <div style={{ width: '100px' }}></div> {/* Spacer for centering */}
        </header>
    );
};
