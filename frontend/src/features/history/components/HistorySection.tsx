import type { HistoryEntry } from '../../../entities/api';
import { HistoryList } from './HistoryList';

interface HistorySectionProps {
  entries: HistoryEntry[];
  selectedId: string | null;
  onSelect: (entry: HistoryEntry) => void;
}

export function HistorySection({ entries, selectedId, onSelect }: HistorySectionProps) {
  return (
    <section className="section history" id="history">
      <div className="section-header">
        <h2>Your conversion history</h2>
        <p>Select a past conversion to preview and download.</p>
      </div>
      <HistoryList entries={entries} selectedId={selectedId} onSelect={onSelect} />
    </section>
  );
}
