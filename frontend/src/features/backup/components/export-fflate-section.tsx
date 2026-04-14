import { useCallback, useState } from 'react';

import { backend } from '../../../backend/backend';
import { ExportProgress } from '../../../backend/backup/types';

export function ExportFflateSection() {

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);

  const handleDownload = useCallback(async () => {
    setIsLoading(true);
    await backend.backup.exportFflate(res => console.log('progress', res));
    setIsLoading(false);
  }, []);

  return (
    <section>
      <h3>Export data (stream)</h3>

      <button type="button" disabled={isLoading} onClick={handleDownload}>
        Download backup data (stream)
      </button>

      {isLoading && (
        <progress id="export-progress" max="100" value={progress?.percent}>
          {progress?.percent}%
        </progress>
      )}
    </section>
  );
}