import { useEffect, useRef, useState } from 'react';
import { AppShell } from '../app/AppShell';
import { Hero } from '../features/marketing/components/Hero';
import { ServicesSection } from '../features/marketing/components/ServicesSection';
import { TestimonialsSection } from '../features/marketing/components/TestimonialsSection';
import { BookingSection } from '../features/marketing/components/BookingSection';
import { ContactSection } from '../features/marketing/components/ContactSection';
import { ConversionCard } from '../features/conversion/components/ConversionCard';
import { BatchProgressDisplay } from '../features/conversion/components/BatchProgressDisplay';
import { ProgressDisplay } from '../features/conversion/components/ProgressDisplay';
import { DownloadButtons } from '../features/conversion/components/DownloadButtons';
import { HistorySection } from '../features/history/components/HistorySection';
import { TranscriptPanel } from '../features/transcript/components/TranscriptPanel';
import { VideoPlayer, type VideoPlayerRef } from '../shared/components/VideoPlayer';
import { useProgress } from '../features/conversion/hooks/useProgress';
import { useHistory } from '../features/history/hooks/useHistory';
import { useConversionState } from '../features/conversion/hooks/useConversionState';
import { useTranscript } from '../features/transcript/hooks/useTranscript';
import { getResourceUrl } from '../shared/lib/api';
import type { BatchConvertResponse, ConvertResponse, HistoryEntry } from '../entities/api';

export function HomePage() {
  const [currentTime, setCurrentTime] = useState(0);
  const [historyTranscriptUrl, setHistoryTranscriptUrl] = useState<string | null>(null);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);

  const {
    result,
    batchResult,
    error,
    setError,
    setUploadSuccess,
    setBatchSuccess,
    setUploadError,
    reset,
  } = useConversionState();

  const { entries, selection, select, addEntry } = useHistory();

  const { progress, error: progressError } = useProgress({
    jobId: result?.job_id || null,
    enabled: !!result,
  });

  const { transcript, error: transcriptError } = useTranscript({
    transcriptUrl: result?.transcript_json_url ?? null,
    enabled: !!result && progress?.state === 'succeeded',
  });

  const { transcript: historyTranscript, error: historyTranscriptError } = useTranscript({
    transcriptUrl: historyTranscriptUrl,
    enabled: !!historyTranscriptUrl,
  });

  useEffect(() => {
    if (transcriptError) {
      setError(transcriptError);
    }
  }, [transcriptError, setError]);

  useEffect(() => {
    if (historyTranscriptError) {
      setError(historyTranscriptError);
    }
  }, [historyTranscriptError, setError]);

  const handleUploadSuccess = async (response: ConvertResponse) => {
    setUploadSuccess(response);
    select(null);
    setHistoryTranscriptUrl(null);

    const createdAt = Date.now();
    await addEntry({
      id: response.job_id,
      jobId: response.job_id,
      resourceBaseName: response.resource_base_name,
      videoUrl: response.video_url,
      transcriptJsonUrl: response.transcript_json_url,
      transcriptVttUrl: response.transcript_vtt_url,
      createdAt,
      source: 'single',
    });
  };

  const handleBatchSuccess = async (response: BatchConvertResponse) => {
    setBatchSuccess(response);
    select(null);
    setHistoryTranscriptUrl(null);

    const createdAt = Date.now();
    await Promise.all(
      response.jobs.map((job) =>
        addEntry({
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
  };

  const handleUploadError = (errorMessage: string) => {
    setUploadError(errorMessage);
    select(null);
    setHistoryTranscriptUrl(null);
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleSeek = (time: number) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(time, true);
    }
  };

  const handleHistorySelect = async (entry: HistoryEntry) => {
    select(entry);
    reset();
    setCurrentTime(0);
    setHistoryTranscriptUrl(entry.transcriptJsonUrl);
  };

  return (
    <AppShell>
      <Hero
        rightSlot={
          <ConversionCard
            onSuccess={handleUploadSuccess}
            onBatchSuccess={handleBatchSuccess}
            onError={handleUploadError}
          />
        }
      />

      <main className="app-main" id="main-content">
        {error && (
          <div className="error-message" role="alert" aria-live="assertive">
            <strong>Error:</strong> {error}
          </div>
        )}

        {batchResult && (
          <div className="results-section">
            <BatchProgressDisplay batchId={batchResult.batch_id} />
            <div className="actions">
              <button
                onClick={() => {
                  reset();
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
                  reset();
                  setCurrentTime(0);
                }}
                className="new-upload-button"
              >
                New Upload
              </button>
            </div>
          </div>
        )}

        {!result && !batchResult && selection && (
          <div className="results-section">
            <div className="job-info">
              <strong>History Job:</strong> {selection.jobId}
              <span className="job-info-name">Output name: {selection.resourceBaseName}</span>
            </div>

            <div className="video-section sticky-player">
              <VideoPlayer
                ref={videoPlayerRef}
                videoUrl={getResourceUrl(selection.videoUrl)}
                vttUrl={getResourceUrl(selection.transcriptVttUrl)}
                onTimeUpdate={handleTimeUpdate}
              />
            </div>

            <div className="results-content">
              <div className="download-section">
                <DownloadButtons
                  jobId={selection.jobId}
                  resourceBaseName={selection.resourceBaseName}
                  videoUrl={selection.videoUrl}
                  transcriptJsonUrl={selection.transcriptJsonUrl}
                  transcriptVttUrl={selection.transcriptVttUrl}
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

        <HistorySection
          entries={entries}
          selectedId={selection?.id ?? null}
          onSelect={handleHistorySelect}
        />

        <ServicesSection />
        <TestimonialsSection />
        <BookingSection />
        <ContactSection />
      </main>
    </AppShell>
  );
}
