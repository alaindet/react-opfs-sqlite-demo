import { useCallback, useState } from 'react';

import { backend } from '../../../backend/backend';

export function WipeDataSection() {
  const [isLoading, setIsLoading] = useState(false);

  const handleWipeAllData = useCallback(async () => {
    const confirmed = confirm('Wipe all data?');
    if (!confirmed) return;
    setIsLoading(true);
    const res = await backend.backup.wipe();
    alert(res.message);
    setIsLoading(false);
  }, []);

  return (
    <section>
      <h3>Wipe all data</h3>
      <button
        type="button"
        disabled={isLoading}
        onClick={handleWipeAllData}
      >
        Wipe all data
      </button>
    </section>
  );
}