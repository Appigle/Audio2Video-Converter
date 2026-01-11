import { useState, useEffect, useRef } from 'react';
import { getJobStatus } from '../services/api';
import type { ProgressResponse } from '../types/api';

interface UseProgressOptions {
  jobId: string | null;
  pollInterval?: number; // milliseconds
  enabled?: boolean;
}

export function useProgress({ jobId, pollInterval = 750, enabled = true }: UseProgressOptions) {
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!jobId || !enabled) {
      setIsPolling(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    const fetchProgress = async () => {
      try {
        const data = await getJobStatus(jobId);
        setProgress(data);
        setError(null);

        // Stop polling if job is complete or failed
        if (data.state === 'succeeded' || data.state === 'failed') {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        } else {
          setIsPolling(true);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch progress'));
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    fetchProgress();

    // Set up polling
    if (enabled) {
      intervalRef.current = setInterval(fetchProgress, pollInterval);
      setIsPolling(true);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
    };
  }, [jobId, pollInterval, enabled]);

  return { progress, error, isPolling };
}

