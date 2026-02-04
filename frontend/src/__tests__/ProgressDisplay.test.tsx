import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressDisplay } from '../components/ProgressDisplay';
import type { ProgressResponse } from '../types/api';

const progress: ProgressResponse = {
  state: 'running',
  stage: 'transcribing',
  percent: 42,
  message: 'Transcribing audio...',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('ProgressDisplay', () => {
  it('renders progress with aria attributes', () => {
    render(<ProgressDisplay progress={progress} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '42');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  it('renders error state', () => {
    render(<ProgressDisplay progress={progress} error={new Error('Oops')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Oops');
  });
});
