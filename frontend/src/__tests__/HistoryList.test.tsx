import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { HistoryList } from '../components/HistoryList';
import type { HistoryEntry } from '../types/api';

const entries: HistoryEntry[] = [
  {
    id: 'job_1',
    jobId: 'job_1',
    resourceBaseName: 'sample_1',
    videoUrl: '/api/jobs/job_1/video',
    transcriptJsonUrl: '/api/jobs/job_1/transcript/json',
    transcriptVttUrl: '/api/jobs/job_1/transcript/vtt',
    createdAt: Date.now(),
    source: 'single',
  },
];

describe('HistoryList', () => {
  it('invokes onSelect when clicking a card', async () => {
    const onSelect = vi.fn();
    render(<HistoryList entries={entries} onSelect={onSelect} selectedId={null} />);

    const user = userEvent.setup();
    await user.click(screen.getByText('sample_1'));

    expect(onSelect).toHaveBeenCalledWith(entries[0]);
  });

  it('marks selected item as pressed', () => {
    const onSelect = vi.fn();
    render(<HistoryList entries={entries} onSelect={onSelect} selectedId="job_1" />);

    const card = screen.getByRole('button', { name: /sample_1/i });
    expect(card).toHaveAttribute('aria-pressed', 'true');
  });
});
