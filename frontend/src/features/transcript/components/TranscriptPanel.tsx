import { useEffect, useRef, useState } from 'react';
import type { TranscriptSegment } from '../../../entities/api';
import './TranscriptPanel.css';

interface TranscriptPanelProps {
  segments: TranscriptSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

export function TranscriptPanel({ segments, currentTime, onSeek }: TranscriptPanelProps) {
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const activeRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isAutoScrollingRef = useRef<boolean>(false);
  const userScrollIntentRef = useRef<boolean>(false);

  // Find active segment based on current time
  useEffect(() => {
    const active = segments.find(
      (seg) => currentTime >= seg.start && currentTime <= seg.end
    );
    setActiveSegmentId(active?.id || null);
  }, [currentTime, segments]);

  const scrollToActive = (behavior: ScrollBehavior) => {
    const activeElement = activeRef.current;
    const listElement = listRef.current;
    if (!activeElement || !listElement) return;
    const listRect = listElement.getBoundingClientRect();
    const activeRect = activeElement.getBoundingClientRect();
    const isInView = activeRect.top >= listRect.top && activeRect.bottom <= listRect.bottom;
    if (isInView) return;
    isAutoScrollingRef.current = true;
    activeElement.scrollIntoView({
      behavior,
      block: 'center',
    });
  };

  // Auto-scroll to active segment when enabled
  useEffect(() => {
    if (autoScrollEnabled && activeRef.current) {
      scrollToActive('smooth');
    }
  }, [activeSegmentId, autoScrollEnabled]);

  const handleUserScrollIntent = () => {
    userScrollIntentRef.current = true;
  };

  const handleScroll = () => {
    if (isAutoScrollingRef.current) {
      isAutoScrollingRef.current = false;
      userScrollIntentRef.current = false;
      return;
    }
    if (autoScrollEnabled && userScrollIntentRef.current) {
      setAutoScrollEnabled(false);
    }
    userScrollIntentRef.current = false;
  };

  const handleSegmentClick = (segment: TranscriptSegment) => {
    onSeek(segment.start);
    // Continue playing after seek
  };

  const handleResumeAutoScroll = () => {
    setAutoScrollEnabled(true);
    scrollToActive('auto');
  };

  return (
    <div className="transcript-panel">
      <div className="transcript-header">
        <h3>Transcript</h3>
        <div className="transcript-controls">
          <span className={`auto-scroll-indicator ${autoScrollEnabled ? 'on' : 'off'}`}>
            Auto-scroll: {autoScrollEnabled ? 'ON' : 'OFF'}
          </span>
          {!autoScrollEnabled && (
            <button
              className="resume-auto-scroll-btn"
              onClick={handleResumeAutoScroll}
            >
              Resume Auto-Scroll
            </button>
          )}
        </div>
      </div>
      <div
        className="transcript-list"
        ref={listRef}
        onScroll={handleScroll}
        onWheel={handleUserScrollIntent}
        onTouchStart={handleUserScrollIntent}
        onPointerDown={handleUserScrollIntent}
        onKeyDown={handleUserScrollIntent}
        tabIndex={0}
        aria-label="Transcript segments"
      >
        {segments.map((segment) => {
          const isActive = segment.id === activeSegmentId;
          return (
            <div
              key={segment.id}
              ref={isActive ? activeRef : null}
              className={`transcript-segment ${isActive ? 'active' : ''}`}
              onClick={() => handleSegmentClick(segment)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleSegmentClick(segment);
                }
              }}
            >
              <div className="segment-time">
                {formatTime(segment.start)} → {formatTime(segment.end)}
              </div>
              <div className="segment-text">{segment.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
