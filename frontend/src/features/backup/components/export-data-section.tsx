import { useCallback, useState } from 'react';

import { backend } from '../../../backend/backend';
import { download, toFilenameDatetime } from '../../../backend/utils';

export function ExportaDataSection() {
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <section>
      <h3>Export data (sync)</h3>

      <button
        type="button"
        disabled={isLoading}
        onClick={handleDownloadBackupData}
      >
        Download data
      </button>
    </section>
  );
}