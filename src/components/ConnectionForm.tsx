import { motion } from 'framer-motion';
import { useState, FormEvent, ChangeEvent } from 'react';

import styles from './ConnectionForm.module.css';

interface ConnectionFormProps {
  onConnect: (file: File) => void;
  loading?: boolean;
  error?: string | null;
  progress?: number;
  onRetry?: () => void;
}

export function ConnectionForm({
  onConnect,
  loading = false,
  error = null,
  progress = 0,
  onRetry,
}: ConnectionFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith('.zip')) {
        setSelectedFile(file);
        setFileName(file.name);
      } else {
        setSelectedFile(null);
        setFileName('');
        alert('Please select a .zip file');
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      onConnect(selectedFile);
    }
  };

  return (
    <motion.div
      className={styles.container}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className={styles.backgroundOrbs}>
        <div className={`${styles.orb} ${styles.orb1}`} />
        <div className={`${styles.orb} ${styles.orb2}`} />
        <div className={`${styles.orb} ${styles.orb3}`} />
        <div className={`${styles.orb} ${styles.orb4}`} />
      </div>
      <div className={styles.card}>
        <h1 className={styles.title}>
          <span className={styles.titleMain}>Actual Wrapped</span>
          <span className={styles.titleYear}>2025</span>
        </h1>
        <p className={styles.subtitle}>See your year in review</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="file">Budget Export File</label>
            <div className={styles.fileInputWrapper}>
              <input
                id="file"
                type="file"
                accept=".zip"
                onChange={handleFileChange}
                required
                disabled={loading}
                className={styles.fileInput}
                aria-describedby="file-help"
                aria-invalid={error ? 'true' : 'false'}
              />
              <div className={styles.fileInputDisplay}>
                {fileName ? (
                  <span className={styles.fileNameDisplay}>
                    <strong>{fileName}</strong>
                  </span>
                ) : (
                  <span className={styles.filePlaceholder}>Choose file</span>
                )}
              </div>
            </div>
            <small id="file-help" className={styles.helpText}>
              Export your budget from Actual Budget (Settings → Advanced → Export budget) and upload
              the .zip file here
            </small>
          </div>

          {error && (
            <motion.div
              className={styles.error}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              role="alert"
              aria-live="polite"
            >
              {error}
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className={styles.retryButton}
                  aria-label="Retry loading budget file"
                >
                  Retry
                </button>
              )}
            </motion.div>
          )}

          {loading && progress > 0 && (
            <div
              className={styles.progressContainer}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progress}%` }} />
              </div>
              <span className={styles.progressText}>{progress}%</span>
            </div>
          )}

          <motion.button
            type="submit"
            className={styles.button}
            disabled={loading || !selectedFile}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-busy={loading}
            aria-label={loading ? 'Loading budget data' : 'Load budget file'}
          >
            {loading ? 'Loading...' : 'Load Budget'}
          </motion.button>
        </form>

        <div className={styles.privacyNote}>
          <strong>Privacy First</strong>
          <p>
            All data is stored locally in your browser. Your budget file is never sent to any
            server, and we do not track your usage. This product is fully privacy-oriented.
          </p>
          <motion.a
            href="https://github.com/actualbudget/wrapped"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.85rem',
              color: '#667eea',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.75rem',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ color: '#764ba2', textDecoration: 'underline' }}
            whileTap={{ scale: 0.95 }}
          >
            View source code on GitHub →
          </motion.a>
        </div>
      </div>
    </motion.div>
  );
}
