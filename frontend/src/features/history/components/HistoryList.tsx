import { getResourceUrl } from '../../../shared/lib/api';
import type { HistoryEntry } from '../../../entities/api';
import './HistoryList.css';

interface HistoryListProps {
  entries: HistoryEntry[];
  selectedId?: string | null;
  onSelect: (entry: HistoryEntry) => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

async function downloadFile(url: string, filename: string) {
  const fullUrl = getResourceUrl(url);
  const response = await fetch(fullUrl);

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;

  const contentDisposition = response.headers.get('Content-Disposition');
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
    if (filenameMatch) {
      link.download = filenameMatch[1];
    } else {
      link.download = filename;
    }
  } else {
    link.download = filename;
  }

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

export function HistoryList({ entries, selectedId, onSelect }: HistoryListProps) {
  const handleDownloadSingle = async (url: string, filename: string) => {
    try {
      await downloadFile(url, filename);
    } catch (error) {
      console.error('History download error:', error);
      alert(
        `Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleDownloadAll = async (entry: HistoryEntry) => {
    const baseName = entry.resourceBaseName || entry.jobId;
    try {
      await downloadFile(entry.videoUrl, `${baseName}.mp4`);
      await downloadFile(entry.transcriptVttUrl, `${baseName}.vtt`);
      await downloadFile(entry.transcriptJsonUrl, `${baseName}.json`);
    } catch (error) {
      console.error('History download error:', error);
      alert(
        `Failed to download files: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return entries.length === 0 ? (
    <div className="history-empty">No conversions saved yet.</div>
  ) : (
    <div className="history-list">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`history-card ${selectedId === entry.id ? 'selected' : ''}`}
          onClick={() => onSelect(entry)}
          role="button"
          tabIndex={0}
          aria-pressed={selectedId === entry.id}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              onSelect(entry);
            }
          }}
        >
          <div className="history-card-main">
            <div className="history-title">{entry.resourceBaseName || entry.jobId}</div>
            <div className="history-meta">
              <span>Job: {entry.jobId}</span>
              <span>Saved: {formatDate(entry.createdAt)}</span>
              <span>Source: {entry.source}</span>
            </div>
          </div>
          <div className="history-actions">
            <button
              className="history-download"
              onClick={(event) => {
                event.stopPropagation();
                handleDownloadAll(entry);
              }}
            >
              Download all files
            </button>
            <div className="history-download-group">
              <button
                className="history-download secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDownloadSingle(
                    entry.videoUrl,
                    `${entry.resourceBaseName || entry.jobId}.mp4`
                  );
                }}
              >
                Video
              </button>
              <button
                className="history-download secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDownloadSingle(
                    entry.transcriptVttUrl,
                    `${entry.resourceBaseName || entry.jobId}.vtt`
                  );
                }}
              >
                Subtitles
              </button>
              <button
                className="history-download secondary"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDownloadSingle(
                    entry.transcriptJsonUrl,
                    `${entry.resourceBaseName || entry.jobId}.json`
                  );
                }}
              >
                Transcript
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
