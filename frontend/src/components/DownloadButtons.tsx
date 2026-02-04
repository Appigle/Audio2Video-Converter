import { getResourceUrl } from '../services/api';
import './DownloadButtons.css';

interface DownloadButtonsProps {
  jobId: string;
  resourceBaseName: string;
  videoUrl: string;
  transcriptJsonUrl: string;
  transcriptVttUrl: string;
}

export function DownloadButtons({
  jobId,
  resourceBaseName,
  videoUrl,
  transcriptJsonUrl,
  transcriptVttUrl,
}: DownloadButtonsProps) {
  const baseName = resourceBaseName || jobId;
  const handleDownload = async (url: string, filename: string) => {
    try {
      const fullUrl = getResourceUrl(url);
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Use filename from Content-Disposition header if available, otherwise use provided filename
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
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="download-buttons">
      <h4>Download</h4>
      <div className="download-buttons-group">
        <button
          className="download-btn"
          onClick={() => handleDownload(videoUrl, `${baseName}.mp4`)}
          title="Download rendered video"
          aria-label="Download video file"
        >
          <span className="download-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path
                d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v13a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-13Zm6 3.5v6l5-3-5-3Z"
                fill="currentColor"
              />
            </svg>
          </span>
          Video (.mp4)
        </button>
        <button
          className="download-btn"
          onClick={() => handleDownload(transcriptVttUrl, `${baseName}.vtt`)}
          title="Download subtitles"
          aria-label="Download subtitles file"
        >
          <span className="download-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path
                d="M6 4h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 3v-3H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 4h8v2H8V8Zm0 4h5v2H8v-2Z"
                fill="currentColor"
              />
            </svg>
          </span>
          Subtitles (.vtt)
        </button>
        <button
          className="download-btn"
          onClick={() => handleDownload(transcriptJsonUrl, `${baseName}.json`)}
          title="Download transcript segments"
          aria-label="Download transcript JSON file"
        >
          <span className="download-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="img">
              <path
                d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 1.5V9h4.5L14 4.5ZM8 12h8v2H8v-2Zm0 4h8v2H8v-2Z"
                fill="currentColor"
              />
            </svg>
          </span>
          Transcript (.json)
        </button>
      </div>
    </div>
  );
}
