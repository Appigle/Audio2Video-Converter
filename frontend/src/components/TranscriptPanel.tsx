import { useEffect, useRef, useState } from 'react';
import type { TranscriptSegment } from '../types/api';
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
  const lastScrollTopRef = useRef<number>(0);
  const isUserScrollingRef = useRef<boolean>(false);

  // Find active segment based on current time
  useEffect(() => {
    const active = segments.find(
      (seg) => currentTime >= seg.start && currentTime <= seg.end
    );
    setActiveSegmentId(active?.id || null);

    // Auto-scroll to active segment if enabled
    if (autoScrollEnabled && activeRef.current && !isUserScrollingRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime, segments, autoScrollEnabled]);

  // Detect manual scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!listRef.current) return;
      
      const currentScrollTop = listRef.current.scrollTop;
      const scrollDiff = Math.abs(currentScrollTop - lastScrollTopRef.current);
      
      // If scroll difference is significant and not from our auto-scroll, disable auto-scroll
      if (scrollDiff > 10 && autoScrollEnabled) {
        // Check if this is user-initiated scroll (not programmatic)
        setTimeout(() => {
          if (listRef.current && Math.abs(listRef.current.scrollTop - currentScrollTop) < 5) {
            // Scroll position stabilized, likely user scroll
            setAutoScrollEnabled(false);
            isUserScrollingRef.current = false;
          }
        }, 100);
      }
      
      lastScrollTopRef.current = currentScrollTop;
    };

    const listElement = listRef.current;
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll);
      return () => listElement.removeEventListener('scroll', handleScroll);
    }
  }, [autoScrollEnabled]);

  const handleSegmentClick = (segment: TranscriptSegment) => {
    onSeek(segment.start);
    // Continue playing after seek
  };

  const handleResumeAutoScroll = () => {
    setAutoScrollEnabled(true);
    isUserScrollingRef.current = false;
    // Snap to current active segment
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
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
      <div className="transcript-list" ref={listRef}>
        {segments.map((segment) => {
          const isActive = segment.id === activeSegmentId;
          return (
            <div
              key={segment.id}
              ref={isActive ? activeRef : null}
              className={`transcript-segment ${isActive ? 'active' : ''}`}
              onClick={() => handleSegmentClick(segment)}
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

