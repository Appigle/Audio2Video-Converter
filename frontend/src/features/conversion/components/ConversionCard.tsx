import { UploadForm } from './UploadForm';
import type { BatchConvertResponse, ConvertResponse } from '../../../entities/api';

interface ConversionCardProps {
  onSuccess: (response: ConvertResponse) => void;
  onBatchSuccess: (response: BatchConvertResponse) => void;
  onError: (error: string) => void;
}

export function ConversionCard({ onSuccess, onBatchSuccess, onError }: ConversionCardProps) {
  return (
    <div className="hero-card" id="upload">
      <div className="hero-card-header">
        <h2>Upload your audio</h2>
        <p>Ready when you are. We will handle the rest.</p>
      </div>
      <UploadForm onSuccess={onSuccess} onBatchSuccess={onBatchSuccess} onError={onError} />
      <div className="hero-card-note">Supports .m4a files up to 100MB each.</div>
    </div>
  );
}
