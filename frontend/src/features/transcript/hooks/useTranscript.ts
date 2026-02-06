import { useEffect, useState } from 'react';
import { fetchTranscript, getResourceUrl } from '../../../shared/lib/api';
import type { TranscriptData } from '../../../entities/api';

interface UseTranscriptOptions {
  transcriptUrl?: string | null;
  enabled?: boolean;
}

export function useTranscript({ transcriptUrl, enabled = true }: UseTranscriptOptions) {
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!enabled || !transcriptUrl) {
      setTranscript(null);
      setError(null);
      return;
    }

    const load = async () => {
      setIsLoading(true);
      try {
        const url = getResourceUrl(transcriptUrl);
        const data = await fetchTranscript(url);
        if (!isMounted) return;
        setTranscript(data);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load transcript:', err);
        setError('Failed to load transcript data');
        setTranscript(null);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [transcriptUrl, enabled]);

  return { transcript, error, isLoading };
}
