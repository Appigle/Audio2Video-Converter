import { useState, useRef, useEffect } from 'react';
import { UploadForm } from './components/UploadForm';
import { VideoPlayer, type VideoPlayerRef } from './components/VideoPlayer';
import { TranscriptPanel } from './components/TranscriptPanel';
import { ProgressDisplay } from './components/ProgressDisplay';
import { BatchProgressDisplay } from './components/BatchProgressDisplay';
import { DownloadButtons } from './components/DownloadButtons';
import { HistoryList } from './components/HistoryList';
import { getResourceUrl, fetchTranscript, getHealthStatus } from './services/api';
import { addHistoryEntry, getHistoryEntries } from './services/historyDb';
import { useProgress } from './hooks/useProgress';
import type {
  ConvertResponse,
  TranscriptData,
  BatchConvertResponse,
  HistoryEntry,
  HealthResponse,
} from './types/api';
import './App.css';

function App() {
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [batchResult, setBatchResult] = useState<BatchConvertResponse | null>(null);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [historySelection, setHistorySelection] = useState<HistoryEntry | null>(null);
  const [historyTranscript, setHistoryTranscript] = useState<TranscriptData | null>(null);
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

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const entries = await getHistoryEntries();
        setHistoryEntries(entries);
      } catch (err) {
        console.error('Failed to load history:', err);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | undefined;

    const fetchHealth = async () => {
      try {
        const status = await getHealthStatus();
        if (!isMounted) return;
        setHealthStatus(status);
        setHealthError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error('Health check failed:', err);
        setHealthError('Service unreachable');
        setHealthStatus(null);
      }
    };

    fetchHealth();
    intervalId = window.setInterval(fetchHealth, 30000);

    return () => {
      isMounted = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  const refreshHistory = async () => {
    try {
      const entries = await getHistoryEntries();
      setHistoryEntries(entries);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleUploadSuccess = async (response: ConvertResponse) => {
    setResult(response);
    setBatchResult(null);
    setError(null);
    setTranscript(null);
    setHistorySelection(null);
    setHistoryTranscript(null);

    const createdAt = Date.now();
    await addHistoryEntry({
      id: response.job_id,
      jobId: response.job_id,
      resourceBaseName: response.resource_base_name,
      videoUrl: response.video_url,
      transcriptJsonUrl: response.transcript_json_url,
      transcriptVttUrl: response.transcript_vtt_url,
      createdAt,
      source: 'single',
    });
    await refreshHistory();
  };

  const handleBatchSuccess = async (response: BatchConvertResponse) => {
    setBatchResult(response);
    setResult(null);
    setError(null);
    setTranscript(null);
    setHistorySelection(null);
    setHistoryTranscript(null);

    const createdAt = Date.now();
    await Promise.all(
      response.jobs.map((job) =>
        addHistoryEntry({
          id: job.job_id,
          jobId: job.job_id,
          resourceBaseName: job.resource_base_name || job.filename || job.job_id,
          videoUrl: job.rendered_video_url || `/api/jobs/${job.job_id}/video`,
          transcriptJsonUrl:
            job.transcript_segments_url || `/api/jobs/${job.job_id}/transcript/json`,
          transcriptVttUrl: job.subtitles_url || `/api/jobs/${job.job_id}/transcript/vtt`,
          createdAt,
          source: 'batch',
        })
      )
    );
    await refreshHistory();
  };

  const handleUploadError = (errorMessage: string) => {
    setError(errorMessage);
    setResult(null);
    setBatchResult(null);
    setTranscript(null);
    setHistorySelection(null);
    setHistoryTranscript(null);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleSeek = (time: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(time, true);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="top-nav">
          <div className="brand">
            <span className="brand-mark" />
            <span>Audio2Video Studio</span>
          </div>
          <nav className="nav-links">
            <a href="#services">Services</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#booking">Booking</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="health-badge">
            <span
              className={`health-indicator ${
                healthStatus ? 'healthy' : healthError ? 'unhealthy' : 'unknown'
              }`}
            />
            <div className="health-text">
              {healthStatus ? 'Service online' : healthError ? 'Service offline' : 'Checking...'}
              {healthStatus?.ffmpeg_available === false && (
                <span className="health-subtext">FFmpeg not available</span>
              )}
            </div>
          </div>
        </div>

        <div className="hero">
          <div className="hero-copy">
            <span className="hero-eyebrow">Calm, polished conversions</span>
            <h1>Turn audio into a refined video experience.</h1>
            <p>
              Upload your audio once and receive a beautifully packaged video with subtitles and
              a readable transcript. Local processing keeps everything private.
            </p>
            <div className="hero-actions">
              <a href="#upload" className="cta-button">
                Start conversion
              </a>
              <a href="#history" className="ghost-button">
                View history
              </a>
            </div>
            <div className="hero-trust">
              <div className="trust-card">
                <h3>Local-first</h3>
                <p>No external APIs required.</p>
              </div>
              <div className="trust-card">
                <h3>Multi-file ready</h3>
                <p>Batch conversions with progress tracking.</p>
              </div>
              <div className="trust-card">
                <h3>Playback synced</h3>
                <p>Click transcripts to jump in time.</p>
              </div>
            </div>
          </div>

          <div className="hero-card" id="upload">
            <div className="hero-card-header">
              <h2>Upload your audio</h2>
              <p>Ready when you are. We will handle the rest.</p>
            </div>
            <UploadForm
              onSuccess={handleUploadSuccess}
              onBatchSuccess={handleBatchSuccess}
              onError={handleUploadError}
            />
            <div className="hero-card-note">Supports .m4a files up to 100MB each.</div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
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
              <span className="job-info-name">Output name: {result.resource_base_name}</span>
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
                      resourceBaseName={result.resource_base_name}
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
        {!result && !batchResult && historySelection && (
          <div className="results-section">
            <div className="job-info">
              <strong>History Job:</strong> {historySelection.jobId}
              <span className="job-info-name">
                Output name: {historySelection.resourceBaseName}
              </span>
            </div>

            <div className="video-section sticky-player">
              <VideoPlayer
                ref={videoPlayerRef}
                videoUrl={getResourceUrl(historySelection.videoUrl)}
                vttUrl={getResourceUrl(historySelection.transcriptVttUrl)}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>

            <div className="results-content">
              <div className="download-section">
                <DownloadButtons
                  jobId={historySelection.jobId}
                  resourceBaseName={historySelection.resourceBaseName}
                  videoUrl={historySelection.videoUrl}
                  transcriptJsonUrl={historySelection.transcriptJsonUrl}
                  transcriptVttUrl={historySelection.transcriptVttUrl}
                />
              </div>

              {historyTranscript && (
                <div className="transcript-section">
                  <TranscriptPanel
                    segments={historyTranscript.segments}
                    currentTime={currentTime}
                    onSeek={handleSeek}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        <section className="section history" id="history">
          <div className="section-header">
            <h2>Your conversion history</h2>
            <p>Select a past conversion to preview and download.</p>
          </div>
          <HistoryList
            entries={historyEntries}
            selectedId={historySelection?.id ?? null}
            onSelect={async (entry) => {
              setHistorySelection(entry);
              setResult(null);
              setBatchResult(null);
              setError(null);
              setTranscript(null);
              setHistoryTranscript(null);
              setCurrentTime(0);
              try {
                const transcriptUrl = getResourceUrl(entry.transcriptJsonUrl);
                const transcriptData = await fetchTranscript(transcriptUrl);
                setHistoryTranscript(transcriptData);
              } catch (err) {
                console.error('Failed to load history transcript:', err);
                setError('Failed to load history transcript');
              }
            }}
          />
        </section>

        <section className="section services" id="services">
          <div className="section-header">
            <h2>Services</h2>
            <p>Everything you need to move from audio to video without friction.</p>
          </div>
          <div className="card-grid">
            <div className="info-card">
              <h3>Curated video output</h3>
              <p>Static background video rendered in 720p with balanced audio levels.</p>
            </div>
            <div className="info-card">
              <h3>Accurate transcripts</h3>
              <p>Timestamped JSON and VTT files ready for captions or archives.</p>
            </div>
            <div className="info-card">
              <h3>Progress-aware</h3>
              <p>Track each stage of transcription and rendering in real time.</p>
            </div>
          </div>
        </section>

        <section className="section testimonials" id="testimonials">
          <div className="section-header">
            <h2>Testimonials</h2>
            <p>Trusted by teams who value calm, polished delivery.</p>
          </div>
          <div className="card-grid">
            <div className="quote-card">
              <p>
                “We ship client recaps in minutes. The transcript syncing is effortless for our
                editors.”
              </p>
              <span>Studio Lead, Riverside</span>
            </div>
            <div className="quote-card">
              <p>
                “Batch conversions keep our workflow smooth. The UI feels premium and
                predictable.”
              </p>
              <span>Producer, Northwind Media</span>
            </div>
            <div className="quote-card">
              <p>“Local-only processing gives our team the privacy we need.”</p>
              <span>Operations, Bloom Wellness</span>
            </div>
          </div>
        </section>

        <section className="section booking" id="booking">
          <div className="booking-panel">
            <div>
              <h2>Ready to publish?</h2>
              <p>Start a new conversion or review your latest exports.</p>
            </div>
            <div className="booking-actions">
              <a href="#upload" className="cta-button">
                Start conversion
              </a>
              <a href="#history" className="ghost-button">
                Browse history
              </a>
            </div>
          </div>
        </section>

        <section className="section contact" id="contact">
          <div className="section-header">
            <h2>Contact</h2>
            <p>
              Need help with setup? Check your local backend logs or reach your technical lead for
              support.
            </p>
          </div>
          <div className="contact-grid">
            <div className="info-card">
              <h3>Local health</h3>
              <p>Run the backend on port 8000 and ensure FFmpeg is installed.</p>
            </div>
            <div className="info-card">
              <h3>Frontend</h3>
              <p>Use port 5173 or 5174 and keep the API URL in sync.</p>
            </div>
            <div className="info-card">
              <h3>Privacy</h3>
              <p>Your files remain on your machine from upload to export.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
