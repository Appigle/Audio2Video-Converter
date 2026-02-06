import { useCallback, useEffect, useState } from 'react';
import type { HistoryEntry } from '../../../entities/api';
import { addHistoryEntry, getHistoryEntries } from '../services/historyDb';

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [selection, setSelection] = useState<HistoryEntry | null>(null);

  const refresh = useCallback(async () => {
    try {
      const items = await getHistoryEntries();
      setEntries(items);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addEntry = useCallback(async (entry: HistoryEntry) => {
    try {
      await addHistoryEntry(entry);
      await refresh();
    } catch (err) {
      console.error('Failed to save history:', err);
    }
  }, [refresh]);

  const select = useCallback((entry: HistoryEntry | null) => {
    setSelection(entry);
  }, []);

  return {
    entries,
    selection,
    select,
    refresh,
    addEntry,
  };
}
