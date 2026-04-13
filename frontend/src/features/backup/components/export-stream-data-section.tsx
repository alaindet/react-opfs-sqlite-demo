import { useCallback, useState } from 'react';

import { ExportProgress } from '../../../backend/backup/types';
import { backend } from '../../../backend/backend';
import { toFilenameDatetime } from '../../../backend/utils';
import { WORKER_PROGRESS_RESPONSE_STATE } from '../../../backend/worker-message-broker';

export function ExportStreamDataSection() {

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  const handleDownloadBackupDataStream = useCallback(async () => {
    setIsLoading(true);

    const res = await backend.backup.exportStream(res => {
      switch (res.progress) {
        case WORKER_PROGRESS_RESPONSE_STATE.NEXT:
          console.log('progress', res.data);
          setProgress(res.data);
          break;
        case WORKER_PROGRESS_RESPONSE_STATE.END:
          alert('Downloaded all data');
          setProgress(null);
      }
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
      <h3>Export data (stream)</h3>

      <button
        type="button"
        disabled={isLoading}
        onClick={handleDownloadBackupDataStream}
      >
        Download backup data (stream)
      </button>

      {isLoading && (
        <progress
          id="export-progress"
          max="100"
          value={progress?.percent}
        >
          {progress?.percent}%
        </progress>
      )}
    </section>
  );
}