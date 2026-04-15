import { useCallback, useState } from 'react';

import { backend } from '../../../backend/backend';
import { toFilenameDatetime } from '../../../backend/utils';
import { DataTransferProgress } from '../../../backend/backup/types';

export function ExportDataSection() {

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<DataTransferProgress | null>(null);

  const handleDownload = useCallback(async () => {
    setIsLoading(true);

    const res = await backend.backup.export(res => {
      // TODO
      console.log('progress', res);
    });

    if (res.error) {
      alert(res.message);
      setIsLoading(false);
      return;
    }

    const handle = await window.showSaveFilePicker({
      suggestedName: `backup.${toFilenameDatetime()}.zip`,
      types: [
        {
          description: 'Exported recipes database',
          accept: { 'application/zip': ['.zip'] },
        },
      ],
    });

    const writable = await handle.createWritable();

    if (res.data) {
      await res.data.pipeTo(writable);
    } else {
      const message = 'Response body is empty';
      console.error(message);
      alert(message);
      await writable.close(); 
    }

    setIsLoading(false);
  }, []);

  return (
    <section>
      <h3>Export data (fflate stream)</h3>

      <button type="button" disabled={isLoading} onClick={handleDownload}>
        Download data
      </button>

      {isLoading && (
        <progress id="export-progress" max="100" value={progress?.percent}>
          {progress?.percent}%
        </progress>
      )}
    </section>
  );
}