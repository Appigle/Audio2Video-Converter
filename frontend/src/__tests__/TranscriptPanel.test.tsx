import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TranscriptPanel } from '../components/TranscriptPanel';
import type { TranscriptSegment } from '../types/api';

const segments: TranscriptSegment[] = [
  { id: 1, start: 0, end: 1, text: 'Hello' },
  { id: 2, start: 1.1, end: 2, text: 'World' },
];

describe('TranscriptPanel', () => {
  it('calls onSeek when segment is clicked', async () => {
    const onSeek = vi.fn();
    render(<TranscriptPanel segments={segments} currentTime={0} onSeek={onSeek} />);

    const user = userEvent.setup();
    await user.click(screen.getByText('Hello'));

    expect(onSeek).toHaveBeenCalledWith(0);
  });
});
