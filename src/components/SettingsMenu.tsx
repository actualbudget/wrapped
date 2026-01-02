import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

import styles from './SettingsMenu.module.css';

interface SettingsMenuProps {
  children: React.ReactNode;
}

export function SettingsMenu({ children }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={styles.menuContainer} ref={menuRef}>
      <motion.button
        className={styles.burgerButton}
        onClick={toggleMenu}
        aria-label="Toggle settings menu"
        aria-expanded={isOpen}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className={styles.burgerIcon}>
          <span className={`${styles.burgerLine} ${isOpen ? styles.open : ''}`} />
          <span className={`${styles.burgerLine} ${isOpen ? styles.open : ''}`} />
          <span className={`${styles.burgerLine} ${isOpen ? styles.open : ''}`} />
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.menu}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.menuContent}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
