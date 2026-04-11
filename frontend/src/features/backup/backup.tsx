import { useCallback, useRef, useState } from 'react';

import { backend } from '../../backend/backend';
import style from './backup.module.css';
import { download, toFilenameDatetime } from '../../backend/utils';

export function BackupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleDownloadBackupData = useCallback(async () => {
    setIsLoading(true);
    const res = await backend.backup.export();
    if (res.error) {
      alert(res.message);
      setIsLoading(false);
      return;
    }

    const zipBlob = new Blob([res.data], { type: 'application/zip' });
    const datetime = toFilenameDatetime();
    const filename = `backup.${datetime}.zip`;
    download(zipBlob, filename);
    setIsLoading(false);
  }, []);

  const handleWipeAllData = useCallback(async () => {
    const confirmed = confirm('Wipe all data?');
    if (!confirmed) return;
    setIsLoading(true);
    const res = await backend.backup.wipe();
    alert(res.message);
    setIsLoading(false);
  }, [])

  const handleUploadBackupData = useCallback(async () => {
    const restoreFile = fileRef.current?.files?.[0];
    if (!restoreFile) {
      alert('No file selected');
      return;
    }

    setIsLoading(true);
    try {
      const res = await backend.backup.import(restoreFile);
      alert(res.message);
    } catch (err: any) {
      const errMessage = err?.message ?? 'Error importing data';
      alert(errMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <>
      <h1>Backup</h1>

      <div className={style.controls}>

        {/* Download backup data */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleDownloadBackupData}
        >
          Download backup data
        </button>

        {/* Wipe all data */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleWipeAllData}
        >
          Wipe all data
        </button>

        {/* Upload backup data */}
        <div className={style.upload}>
          <label htmlFor="field-upload">
            Upload backup data
          </label>
          
          <input
            type="file"
            id="field-image"
            ref={fileRef}
            disabled={isLoading}
          />

          <button
            type="button"
            disabled={isLoading}
            onClick={handleUploadBackupData}
          >
            Upload backup data
          </button>
        </div>
      </div>
    </>
  );
}