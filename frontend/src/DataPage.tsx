import { useState, useRef } from 'react';

import { useBackend } from './backend-context';

export function DataPage() {
  const backend = useBackend();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const busy = exporting || importing || cleaning;

  // ---- Export ----

  const handleExport = async () => {
    setExporting(true);
    setStatus(null);
    try {
      const zipBuffer = await backend.exportBackup();

      const blob = new Blob([zipBuffer], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `recipes-backup-${date}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const sizeMB = (zipBuffer.byteLength / (1024 * 1024)).toFixed(2);
      setStatus({
        type: "success",
        message: `Backup exported (${sizeMB} MB)`,
      });
    } catch (err: any) {
      setStatus({ type: "error", message: `Export failed: ${err.message}` });
    } finally {
      setExporting(false);
    }
  };

  // ---- Import ----

  const handleImportClick = () => {
    fileRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".zip")) {
      setStatus({ type: "error", message: "Please select a .zip file" });
      return;
    }

    const confirmed = window.confirm(
      "This will REPLACE all current recipes and images with the backup data. Are you sure?"
    );
    if (!confirmed) {
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setImporting(true);
    setStatus(null);

    try {
      const buffer = await file.arrayBuffer();
      const shouldReload = await backend.importBackup(buffer);

      if (shouldReload) {
        setStatus({
          type: "success",
          message: "Import successful! Reloading…",
        });
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setStatus({ type: "success", message: "Import successful!" });
      }
    } catch (err: any) {
      setStatus({ type: "error", message: `Import failed: ${err.message}` });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ---- Cleanup ----

  const handleCleanup = async () => {
    const confirmed = window.confirm(
      "This will permanently DELETE all recipes and images. This cannot be undone.\n\nAre you sure?"
    );
    if (!confirmed) return;

    // Double confirmation for destructive action
    const doubleConfirm = window.confirm(
      "Really delete everything? Consider exporting a backup first."
    );
    if (!doubleConfirm) return;

    setCleaning(true);
    setStatus(null);

    try {
      await backend.cleanupAll();
      setStatus({
        type: "success",
        message: "All data has been deleted. Reloading…",
      });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setStatus({ type: "error", message: `Cleanup failed: ${err.message}` });
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={{ margin: "0 0 8px" }}>Data Management</h2>
      <p style={{ color: "#666", margin: "0 0 20px" }}>
        Export your recipes and images as a .zip file, restore from a previous
        backup, or wipe everything clean.
      </p>

      {/* Export section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Export</h3>
        <p style={styles.sectionDesc}>
          Download a complete backup of your database and all images.
        </p>
        <button
          onClick={handleExport}
          disabled={busy}
          style={{ ...styles.btnPrimary, opacity: busy ? 0.5 : 1 }}
        >
          {exporting ? "Exporting…" : "⬇ Download backup"}
        </button>
      </div>

      {/* Import section */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Import</h3>
        <p style={styles.sectionDesc}>
          Restore from a previously exported .zip file. This will replace all
          current data.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".zip"
          onChange={handleFileSelected}
          style={{ display: "none" }}
        />
        <button
          onClick={handleImportClick}
          disabled={busy}
          style={{ ...styles.btnWarning, opacity: busy ? 0.5 : 1 }}
        >
          {importing ? "Importing…" : "⬆ Restore from backup"}
        </button>
      </div>

      {/* Cleanup section */}
      <div style={{ ...styles.section, borderColor: "#f5c6c6" }}>
        <h3 style={{ ...styles.sectionTitle, color: "#c0392b" }}>
          Danger Zone
        </h3>
        <p style={styles.sectionDesc}>
          Permanently delete all recipes and images. This cannot be undone — make
          sure to export a backup first if you want to keep your data.
        </p>
        <button
          onClick={handleCleanup}
          disabled={busy}
          style={{ ...styles.btnDanger, opacity: busy ? 0.5 : 1 }}
        >
          {cleaning ? "Deleting…" : "🗑 Delete all data"}
        </button>
      </div>

      {/* Status message */}
      {status && (
        <div
          style={{
            ...styles.status,
            background: status.type === "success" ? "#e6f9e6" : "#fde8e8",
            color: status.type === "success" ? "#1a7a1a" : "#c0392b",
          }}
        >
          {status.message}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "#f8f8f8",
    borderRadius: 8,
    padding: 20,
  },
  section: {
    marginBottom: 20,
    padding: 16,
    background: "#fff",
    borderRadius: 6,
    border: "1px solid #e8e8e8",
  },
  sectionTitle: {
    margin: "0 0 4px",
    fontSize: 16,
  },
  sectionDesc: {
    margin: "0 0 12px",
    fontSize: 13,
    color: "#888",
  },
  btnPrimary: {
    padding: "10px 20px",
    background: "#2a7",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: 14,
    cursor: "pointer",
  },
  btnWarning: {
    padding: "10px 20px",
    background: "#e67e22",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: 14,
    cursor: "pointer",
  },
  btnDanger: {
    padding: "10px 20px",
    background: "#c0392b",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    fontSize: 14,
    cursor: "pointer",
  },
  status: {
    padding: "10px 14px",
    borderRadius: 4,
    fontSize: 13,
    fontWeight: 500,
  },
};