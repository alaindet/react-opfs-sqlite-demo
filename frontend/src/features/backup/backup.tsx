import { useCallback, useRef, useState } from 'react';

import { backend } from '../../backend/backend';
import style from './backup.module.css';

export function BackupPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleDownloadBackupData = useCallback(async () => {
    setIsDownloading(true);
    await backend.backup.download();
    setIsDownloading(false);
  }, []);

  const handleUploadBackupData = useCallback(async () => {
    const restoreFile = fileRef.current?.files?.[0];
    if (!restoreFile) {
      alert('No file selected');
      return;
    }

    setIsUploading(true);
    await backend.backup.restore(restoreFile);
    setIsUploading(false);
  }, []);

  return (
    <>
      <h1>Backup</h1>

      <button
        type="button"
        disabled={isDownloading}
        onClick={handleDownloadBackupData}
      >
        Download backup data
      </button>

      <div className={style.upload}>
        <label htmlFor="field-upload">
          Upload backup data
        </label>
        
        <input
          type="file"
          id="field-image"
          ref={fileRef}
          disabled={isUploading}
        />

        <button
          type="button"
          disabled={isUploading}
          onClick={handleUploadBackupData}
        >
          Upload backup data
        </button>
      </div>
    </>
  );
}