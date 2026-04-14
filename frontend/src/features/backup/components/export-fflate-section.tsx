import { useCallback, useState } from 'react';

import { backend } from '../../../backend/backend';
import { ExportProgress } from '../../../backend/backup/types';
import { toFilenameDatetime } from '../../../backend/utils';

export function ExportFflateSection() {

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  const handleDownload = useCallback(async () => {
    setIsLoading(true);

    const res = await backend.backup.exportFflate(res => {
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
        Download backup data (fflate stream)
      </button>

      {isLoading && (
        <progress id="export-progress" max="100" value={progress?.percent}>
          {progress?.percent}%
        </progress>
      )}
    </section>
  );
}