import { useCallback, useEffect, useState } from 'react';
import { listRequests, type ListFilters } from './backupService';
import type { BackupRequest, UserProfile } from './types';

export function useRequests(profile: UserProfile, filters: ListFilters) {
  const [rows, setRows] = useState<BackupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const key = JSON.stringify(filters);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listRequests(profile, filters));
    } catch (e) {
      setError((e as Error).message || 'Não foi possível carregar as solicitações.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, key]);

  useEffect(() => { reload(); }, [reload]);
  return { rows, loading, error, reload };
}
