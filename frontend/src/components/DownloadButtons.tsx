import { getResourceUrl } from '../services/api';
import './DownloadButtons.css';

interface DownloadButtonsProps {
  jobId: string;
  videoUrl: string;
  transcriptJsonUrl: string;
  transcriptVttUrl: string;
}

export function DownloadButtons({
  jobId,
  videoUrl,
  transcriptJsonUrl,
  transcriptVttUrl,
}: DownloadButtonsProps) {
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
          onClick={() => handleDownload(videoUrl, `${jobId}_rendered_video.mp4`)}
          title="Download rendered video"
        >
          📹 Video (.mp4)
        </button>
        <button
          className="download-btn"
          onClick={() => handleDownload(transcriptVttUrl, `${jobId}_subtitles.vtt`)}
          title="Download subtitles"
        >
          📝 Subtitles (.vtt)
        </button>
        <button
          className="download-btn"
          onClick={() => handleDownload(transcriptJsonUrl, `${jobId}_transcript_segments.json`)}
          title="Download transcript segments"
        >
          📄 Transcript (.json)
        </button>
      </div>
    </div>
  );
}

