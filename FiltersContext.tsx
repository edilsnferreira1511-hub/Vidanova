import React, { createContext, useContext, useMemo, useState } from 'react';
import type { ListFilters } from './backupService';

interface Ctx { filters: ListFilters; setFilters: (f: ListFilters) => void; clear: () => void }
const C = createContext<Ctx | null>(null);

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState<ListFilters>({});
  const v = useMemo(() => ({ filters, setFilters, clear: () => setFilters({}) }), [filters]);
  return <C.Provider value={v}>{children}</C.Provider>;
}
export const useFilters = () => {
  const c = useContext(C);
  if (!c) throw new Error('useFilters fora do FiltersProvider');
  return c;
};
