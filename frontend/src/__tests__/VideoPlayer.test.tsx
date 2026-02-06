import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VideoPlayer } from '../shared/components/VideoPlayer';


describe('VideoPlayer', () => {
  it('renders a video element with aria label', () => {
    render(
      <VideoPlayer
        videoUrl="/api/jobs/job_1/video"
        vttUrl="/api/jobs/job_1/transcript/vtt"
      />
    );

    expect(screen.getByLabelText(/converted video preview/i)).toBeInTheDocument();
  });
});
