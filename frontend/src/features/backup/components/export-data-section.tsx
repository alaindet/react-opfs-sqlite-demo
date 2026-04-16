import { useCallback, useState } from 'react';

import { backend } from '../../../backend/backend';
import { toFilenameDatetime } from '../../../backend/core/utils';
import { DataTransferProgress } from '../../../backend/features/backup';

export function ExportDataSection() {

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<DataTransferProgress | null>(null);

  const handleDownload = useCallback(async () => {

    const exportedFileHandle = await getFilePicker({
      suggestedName: `backup.${toFilenameDatetime()}.zip`,
      types: [
        {
          description: 'Exported recipes database',
          accept: { 'application/zip': ['.zip'] },
        },
      ],
    });

    if (!exportedFileHandle) {
      console.log('Canceled export');
      return;
    }

    setIsLoading(true);

    const res = await backend.backup.export(res => setProgress(res.data));

    if (res.error) {
      alert(res.message);
      setIsLoading(false);
      return;
    }

    const writable = await exportedFileHandle.createWritable();

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
      <h3>Export data</h3>

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

// TODO: Move
async function getFilePicker(
  options: SaveFilePickerOptions,
): Promise<FileSystemFileHandle | null> {
  try {
    return window.showSaveFilePicker(options);
  } catch (err: any) {
    return null;
  }
}
