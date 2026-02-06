import { useCallback, useState } from 'react';
import type { BatchConvertResponse, ConvertResponse } from '../../../entities/api';

export function useConversionState() {
  const [result, setResult] = useState<ConvertResponse | null>(null);
  const [batchResult, setBatchResult] = useState<BatchConvertResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setUploadSuccess = useCallback((response: ConvertResponse) => {
    setResult(response);
    setBatchResult(null);
    setError(null);
  }, []);

  const setBatchSuccess = useCallback((response: BatchConvertResponse) => {
    setBatchResult(response);
    setResult(null);
    setError(null);
  }, []);

  const setUploadError = useCallback((message: string) => {
    setError(message);
    setResult(null);
    setBatchResult(null);
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setBatchResult(null);
    setError(null);
  }, []);

  return {
    result,
    batchResult,
    error,
    setUploadSuccess,
    setBatchSuccess,
    setUploadError,
    reset,
    setError,
  };
}
