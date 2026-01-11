import { useState, useRef, useEffect } from 'react';
import { UploadForm } from './components/UploadForm';
import { VideoPlayer, type VideoPlayerRef } from './components/VideoPlayer';
import { TranscriptPanel } from './components/TranscriptPanel';
import { ProgressDisplay } from './components/ProgressDisplay';
import { BatchProgressDisplay } from './components/BatchProgressDisplay';
import { DownloadButtons } from './components/DownloadButtons';
import { getResourceUrl, fetchTranscript } from './services/api';
import { useProgress } from './hooks/useProgress';
import type { ConvertResponse, TranscriptData, BatchConvertResponse } from './types/api';
import './App.css';

function App() {
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [batchResult, setBatchResult] = useState<BatchConvertResponse | null>(null);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);

  // Progress tracking for single job
  const { progress, error: progressError } = useProgress({
    jobId: result?.job_id || null,
    enabled: !!result,
  });

  // Fetch transcript when job completes
  useEffect(() => {
    if (result && progress?.state === 'succeeded' && !transcript) {
      const fetchTranscriptData = async () => {
        try {
          const transcriptUrl = getResourceUrl(result.transcript_json_url);
          const transcriptData = await fetchTranscript(transcriptUrl);
          setTranscript(transcriptData);
        } catch (err) {
          console.error('Failed to load transcript:', err);
          setError('Failed to load transcript data');
        }
      };
      fetchTranscriptData();
    }
  }, [result, progress, transcript]);

  const handleUploadSuccess = async (response: ConvertResponse) => {
    setResult(response);
    setBatchResult(null);
    setError(null);
    setTranscript(null);
  };

  const handleBatchSuccess = (response: BatchConvertResponse) => {
    setBatchResult(response);
    setResult(null);
    setError(null);
    setTranscript(null);
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setResult(null);
    setBatchResult(null);
    setTranscript(null);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleSeek = (time: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(time);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Audio2Video Converter</h1>
        <p>Convert audio to video with automatic transcription</p>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!result && !batchResult && (
          <div className="upload-section">
            <UploadForm
              onSuccess={handleUploadSuccess}
              onBatchSuccess={handleBatchSuccess}
              onError={handleUploadError}
            />
          </div>
        )}

        {batchResult && (
          <div className="results-section">
            <BatchProgressDisplay batchId={batchResult.batch_id} />
            <div className="actions">
              <button
                onClick={() => {
                  setBatchResult(null);
                  setError(null);
                }}
                className="new-upload-button"
              >
                New Upload
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="results-section">
            <div className="job-info">
              <strong>Job ID:</strong> {result.job_id}
            </div>

            {progress && progress.state !== 'succeeded' && (
              <div className="progress-section">
                <ProgressDisplay progress={progress} error={progressError} />
              </div>
            )}

            {progress?.state === 'succeeded' && (
              <>
                <div className="video-section sticky-player">
                  <VideoPlayer
                    ref={videoPlayerRef}
                    videoUrl={getResourceUrl(result.video_url)}
                    vttUrl={getResourceUrl(result.transcript_vtt_url)}
                    onTimeUpdate={handleTimeUpdate}
                  />
                </div>

                <div className="results-content">
                  <div className="download-section">
                    <DownloadButtons
                      jobId={result.job_id}
                      videoUrl={result.video_url}
                      transcriptJsonUrl={result.transcript_json_url}
                      transcriptVttUrl={result.transcript_vtt_url}
                    />
                  </div>

                  {transcript && (
                    <div className="transcript-section">
                      <TranscriptPanel
                        segments={transcript.segments}
                        currentTime={currentTime}
                        onSeek={handleSeek}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="actions">
              <button
                onClick={() => {
                  setResult(null);
                  setTranscript(null);
                  setError(null);
                  setCurrentTime(0);
                }}
                className="new-upload-button"
              >
                New Upload
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

