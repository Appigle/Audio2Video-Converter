import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ConvertResponse, BatchConvertResponse } from '../types/api';

const apiMocks = vi.hoisted(() => ({
  uploadAudio: vi.fn(),
  batchConvert: vi.fn(),
}));

vi.mock('../services/api', async () => {
  const actual = await vi.importActual<typeof import('../services/api')>('../services/api');
  return {
    ...actual,
    uploadAudio: apiMocks.uploadAudio,
    batchConvert: apiMocks.batchConvert,
  };
});

import { uploadAudio, batchConvert } from '../services/api';
import { UploadForm } from '../components/UploadForm';

const convertResponse: ConvertResponse = {
  job_id: 'job_test',
  resource_base_name: 'test_123',
  video_url: '/api/jobs/job_test/video',
  transcript_json_url: '/api/jobs/job_test/transcript/json',
  transcript_vtt_url: '/api/jobs/job_test/transcript/vtt',
  processing: 'local-only',
};

const batchResponse: BatchConvertResponse = {
  batch_id: 'batch_test',
  jobs: [
    {
      job_id: 'job_test_1',
      filename: 'one',
      resource_base_name: 'one_123',
      status: 'queued',
      rendered_video_url: '/api/jobs/job_test_1/video',
      subtitles_url: '/api/jobs/job_test_1/transcript/vtt',
      transcript_segments_url: '/api/jobs/job_test_1/transcript/json',
    },
  ],
};

describe('UploadForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(uploadAudio).mockResolvedValue(convertResponse);
    vi.mocked(batchConvert).mockResolvedValue(batchResponse);
  });

  it('uploads a single file and calls onSuccess', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    render(<UploadForm onSuccess={onSuccess} onError={onError} />);

    const user = userEvent.setup();
    const fileInput = screen.getByLabelText(/Audio File/i) as HTMLInputElement;
    const file = new File(['audio'], 'sample.m4a', { type: 'audio/mp4' });

    await user.upload(fileInput, file);
    await screen.findByText(/sample.m4a/i);
    await user.click(screen.getByRole('button', { name: /convert to video/i }));

    await waitFor(() => expect(uploadAudio).toHaveBeenCalled());
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(convertResponse));
  });

  it('uploads multiple files in batch mode', async () => {
    const onSuccess = vi.fn();
    const onBatchSuccess = vi.fn();
    const onError = vi.fn();

    render(
      <UploadForm onSuccess={onSuccess} onBatchSuccess={onBatchSuccess} onError={onError} />
    );

    const user = userEvent.setup();
    const fileInput = screen.getByLabelText(/Audio File/i) as HTMLInputElement;
    const files = [
      new File(['one'], 'one.m4a', { type: 'audio/mp4' }),
      new File(['two'], 'two.m4a', { type: 'audio/mp4' }),
    ];

    await user.upload(fileInput, files);
    await screen.findByText(/one.m4a/i);
    await user.click(screen.getByRole('button', { name: /convert 2 files/i }));

    await waitFor(() => expect(batchConvert).toHaveBeenCalled());
    await waitFor(() => expect(onBatchSuccess).toHaveBeenCalledWith(batchResponse));
  });

  it('shows error on invalid file type', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    render(<UploadForm onSuccess={onSuccess} onError={onError} />);

    const user = userEvent.setup();
    const fileInput = screen.getByLabelText(/Audio File/i) as HTMLInputElement;
    const file = new File(['audio'], 'sample.mp3', { type: 'audio/mpeg' });

    await user.upload(fileInput, file);
    await waitFor(() => expect(onError).toHaveBeenCalled());
  });
});
