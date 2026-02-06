import type { HealthResponse } from '../../../entities/api';

interface HealthBadgeProps {
  healthStatus: HealthResponse | null;
  healthError: string | null;
}

export function HealthBadge({ healthStatus, healthError }: HealthBadgeProps) {
  return (
    <div className="health-badge" role="status" aria-live="polite">
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
  );
}
