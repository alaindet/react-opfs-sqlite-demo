import { useState, useRef, useCallback } from 'react';

import { backend } from '../../../backend/backend';

export function ImportDataSection() {

  const [isLoading, setIsLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const handleUploadBackupData = useCallback(async () => {
    const restoreFile = fileRef.current?.files?.[0];
    if (!restoreFile) {
      alert('No file selected');
      return;
    }

    // TODO
    // // Quick example of reading the count from a Blob/File
    // async function getZipItemCount(file) {
    //   const footer = await file.slice(-128).arrayBuffer();
    //   const view = new DataView(footer);
      
    //   // Search backwards for the EOCD signature: 0x06054b50
    //   for (let i = footer.byteLength - 22; i >= 0; i--) {
    //     if (view.getUint32(i, true) === 0x06054b50) {
    //       return view.getUint16(i + 10, true); // Total entries
    //     }
    //   }
    //   return null;
    // }

    setIsLoading(true);
    try {
      const res = await backend.backup.import(restoreFile.stream(), res => {
        // TODO
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
      <h3>Import data (fflate stream)</h3>
      
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
        Import data 
      </button>
    </section>
  );
}