import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './VideoPlayer.css';

interface VideoPlayerProps {
  videoUrl: string;
  vttUrl: string;
  onTimeUpdate?: (currentTime: number) => void;
}

export interface VideoPlayerRef {
  seekTo: (time: number) => void;
  getCurrentTime: () => number;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(
  ({ videoUrl, vttUrl, onTimeUpdate }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useImperativeHandle(ref, () => ({
      seekTo: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      getCurrentTime: () => {
        return videoRef.current?.currentTime || 0;
      },
    }));

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleTimeUpdate = () => {
        if (onTimeUpdate) {
          onTimeUpdate(video.currentTime);
        }
      };

      video.addEventListener('timeupdate', handleTimeUpdate);
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }, [onTimeUpdate]);

    return (
      <div className="video-player-container">
        <video
          ref={videoRef}
          controls
          className="video-player"
          crossOrigin="anonymous"
        >
          <source src={videoUrl} type="video/mp4" />
          <track
            kind="subtitles"
            srcLang="en"
            src={vttUrl}
            label="English"
            default
          />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

