import { motion } from "framer-motion";
import { useState, FormEvent, ChangeEvent } from "react";

import styles from "./ConnectionForm.module.css";

interface ConnectionFormProps {
  onConnect: (file: File) => void;
  loading?: boolean;
  error?: string | null;
}

export function ConnectionForm({ onConnect, loading = false, error = null }: ConnectionFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith(".zip")) {
        setSelectedFile(file);
        setFileName(file.name);
      } else {
        setSelectedFile(null);
        setFileName("");
        alert("Please select a .zip file");
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
      <div className={styles.card}>
        <h1 className={styles.title}>Actual Budget 2025 Wrapped</h1>
        <p className={styles.subtitle}>
          Upload your Actual Budget export to see your year in review
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="file">Budget Export File</label>
            <input
              id="file"
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              required
              disabled={loading}
              className={styles.fileInput}
            />
            {fileName && (
              <div className={styles.fileName}>
                Selected: <strong>{fileName}</strong>
              </div>
            )}
            <small className={styles.helpText}>
              Export your budget from Actual Budget (Settings → Advanced → Export budget) and upload
              the .zip file here
            </small>
          </div>

          {error && (
            <motion.div className={styles.error} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            className={styles.button}
            disabled={loading || !selectedFile}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? "Loading..." : "Load Budget"}
          </motion.button>
        </form>

        <div className={styles.privacyNote}>
          <strong>Privacy First</strong>
          <p>
            All data is stored locally in your browser. Your budget file is never sent to any
            server, and we do not track your usage. This product is fully privacy-oriented.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
