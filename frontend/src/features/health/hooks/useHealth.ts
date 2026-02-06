import { useEffect, useState } from 'react';
import { getHealthStatus } from '../../../shared/lib/api';
import type { HealthResponse } from '../../../entities/api';

interface UseHealthOptions {
  intervalMs?: number;
}

export function useHealth({ intervalMs = 30000 }: UseHealthOptions = {}) {
  const [healthStatus, setHealthStatus] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

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
    intervalId = window.setInterval(fetchHealth, intervalMs);

    return () => {
      isMounted = false;
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [intervalMs]);

  return { healthStatus, healthError };
}
