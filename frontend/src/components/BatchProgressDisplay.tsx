import { useEffect, useState } from 'react';
import { getBatchStatus } from '../services/api';
import type { BatchStatusResponse } from '../types/api';
import { ProgressDisplay } from './ProgressDisplay';
import './BatchProgressDisplay.css';

interface BatchProgressDisplayProps {
  batchId: string;
  pollInterval?: number;
}

export function BatchProgressDisplay({ batchId, pollInterval = 750 }: BatchProgressDisplayProps) {
  const [batchStatus, setBatchStatus] = useState<BatchStatusResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    if (!batchId) return;

    const fetchStatus = async () => {
      try {
        const data = await getBatchStatus(batchId);
        setBatchStatus(data);
        setError(null);

        // Stop polling if all jobs are complete or failed
        const allComplete = data.jobs.every(
          job => job.status.state === 'succeeded' || job.status.state === 'failed'
        );
        if (allComplete) {
          setIsPolling(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch batch status'));
        setIsPolling(false);
      }
    };

    fetchStatus();

    if (isPolling) {
      const interval = setInterval(fetchStatus, pollInterval);
      return () => clearInterval(interval);
    }
  }, [batchId, pollInterval, isPolling]);

  if (error) {
    return (
      <div className="batch-progress error">
        <div className="progress-error">
          <strong>Error:</strong> {error.message}
        </div>
      </div>
    );
  }

  if (!batchStatus) {
    return <div className="batch-progress">Loading batch status...</div>;
  }

  const completedCount = batchStatus.jobs.filter(
    job => job.status.state === 'succeeded'
  ).length;
  const failedCount = batchStatus.jobs.filter(
    job => job.status.state === 'failed'
  ).length;
  const totalCount = batchStatus.jobs.length;

  return (
    <div className="batch-progress">
      <div className="batch-header">
        <h3>Batch Processing</h3>
        <div className="batch-summary">
          {completedCount}/{totalCount} completed
          {failedCount > 0 && `, ${failedCount} failed`}
        </div>
      </div>
      <div className="batch-jobs">
        {batchStatus.jobs.map((job) => (
          <div key={job.job_id} className="batch-job-item">
            <div className="batch-job-header">
              <span className="batch-job-filename">{job.resource_base_name || job.filename}</span>
              <span className={`batch-job-status ${job.status.state}`}>
                {job.status.state}
              </span>
            </div>
            <ProgressDisplay progress={job.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
