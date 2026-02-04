import { useRef, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
  videoUrl: string;
  vttUrl: string;
  onTimeUpdate?: (currentTime: number) => void;
}

export interface VideoPlayerRef {
  seekTo: (time: number, play?: boolean) => void;
  getCurrentTime: () => number;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ videoUrl, vttUrl, onTimeUpdate }, ref) => {
    const activeRef = useRef<HTMLVideoElement>(null);
    const pendingRef = useRef<HTMLVideoElement>(null);
    const [activeSource, setActiveSource] = useState({ videoUrl, vttUrl });
    const [pendingSource, setPendingSource] = useState<{ videoUrl: string; vttUrl: string } | null>(
      null
    );
    const [pendingReady, setPendingReady] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const transitionDurationMs = 250;
    const sourceKey = useMemo(() => `${activeSource.videoUrl}::${activeSource.vttUrl}`, [
      activeSource.videoUrl,
      activeSource.vttUrl,
    ]);

    useImperativeHandle(ref, () => ({
      seekTo: (time: number, play: boolean = false) => {
        if (activeRef.current) {
          activeRef.current.currentTime = time;
          if (play) {
            void activeRef.current.play();
          }
        }
      },
      getCurrentTime: () => {
        return activeRef.current?.currentTime || 0;
      },
    }));

    useEffect(() => {
      if (
        videoUrl === activeSource.videoUrl &&
        vttUrl === activeSource.vttUrl
      ) {
        return;
      }
      setPendingSource({ videoUrl, vttUrl });
      setPendingReady(false);
      setIsTransitioning(false);
    }, [videoUrl, vttUrl, activeSource.videoUrl, activeSource.vttUrl]);

    useEffect(() => {
      if (!pendingReady || !pendingSource) return;
      setIsTransitioning(true);
      const timeoutId = window.setTimeout(() => {
        setActiveSource(pendingSource);
        setPendingSource(null);
        setPendingReady(false);
        setIsTransitioning(false);
      }, transitionDurationMs);

      return () => {
        window.clearTimeout(timeoutId);
      };
    }, [pendingReady, pendingSource]);

    const handleTimeUpdate = () => {
      const video = activeRef.current;
      if (video && onTimeUpdate) {
        onTimeUpdate(video.currentTime);
      }
    };

    return (
      <div className="video-player-container">
        <video
          key={sourceKey}
          ref={activeRef}
          controls
          className={`video-player video-layer ${isTransitioning ? 'fade-out' : 'visible'}`}
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          aria-label="Converted video preview"
        >
          <source src={activeSource.videoUrl} type="video/mp4" />
          <track
            kind="subtitles"
            srcLang="en"
            src={activeSource.vttUrl}
            label="English"
            default
          />
          Your browser does not support the video tag.
        </video>

        {pendingSource && (
          <video
            ref={pendingRef}
            className={`video-player video-layer ${
              pendingReady ? 'visible' : 'hidden'
            }`}
            crossOrigin="anonymous"
            onLoadedData={() => setPendingReady(true)}
            aria-hidden="true"
          >
            <source src={pendingSource.videoUrl} type="video/mp4" />
            <track
              kind="subtitles"
              srcLang="en"
              src={pendingSource.vttUrl}
              label="English"
              default
            />
          </video>
        )}
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';
