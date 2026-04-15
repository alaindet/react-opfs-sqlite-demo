import { useState, useRef, useCallback } from 'react';

import { backend } from '../../../backend/backend';

export function ImportFflateSection() {

  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleUploadBackupData = useCallback(async () => {
    const restoreFile = fileRef.current?.files?.[0];
    if (!restoreFile) {
      alert('No file selected');
      return;
    }

    setIsLoading(true);
    try {
      const res = await backend.backup.importFflate(restoreFile.stream(), res => {
        console.log('progress', res);
      });
      alert(res.message);
    } catch (err: any) {
      const errMessage = err?.message ?? 'Error importing data';
      alert(errMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <section>
      <h3>Upload backup data</h3>
      
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
    </section>
  );
}