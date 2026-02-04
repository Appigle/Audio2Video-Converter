import type { ProgressResponse } from '../types/api';
import './ProgressDisplay.css';

interface ProgressDisplayProps {
  progress: ProgressResponse | null;
  error?: Error | null;
}

export function ProgressDisplay({ progress, error }: ProgressDisplayProps) {
  if (error) {
    return (
      <div className="progress-display error" role="alert" aria-live="assertive">
        <div className="progress-error">
          <strong>Error:</strong> {error.message}
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="progress-display" role="status" aria-live="polite">
        <div className="progress-message">Loading progress...</div>
      </div>
    );
  }

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      saving: 'Saving files',
      transcribing: 'Transcribing audio',
      rendering: 'Rendering video',
      packaging: 'Generating files',
      done: 'Complete',
      error: 'Error',
    };
    return labels[stage] || stage;
  };

  const getStateClass = (state: string) => {
    return `progress-state ${state}`;
  };

  return (
    <div className="progress-display" role="status" aria-live="polite">
      <div className="progress-header">
        <span className={getStateClass(progress.state)}>
          {progress.state.toUpperCase()}
        </span>
        <span className="progress-stage">{getStageLabel(progress.stage)}</span>
      </div>
      <div
        className="progress-bar-container"
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress ${progress.percent}%`}
      >
        <div
          className="progress-bar"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <div className="progress-info">
        <span className="progress-percent">{progress.percent}%</span>
        <span className="progress-message">{progress.message}</span>
      </div>
      {progress.error && (
        <div className="progress-error">
          <strong>Error:</strong> {progress.error}
        </div>
      )}
    </div>
  );
}
