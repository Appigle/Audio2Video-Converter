import { ReactNode } from 'react';

interface HeroProps {
  rightSlot: ReactNode;
}

export function Hero({ rightSlot }: HeroProps) {
  return (
    <div className="hero">
      <div className="hero-copy">
        <span className="hero-eyebrow">Calm, polished conversions</span>
        <h1>Turn audio into a refined video experience.</h1>
        <p>
          Upload your audio once and receive a beautifully packaged video with subtitles and a
          readable transcript. Local processing keeps everything private.
        </p>
        <div className="hero-actions">
          <a href="#upload" className="cta-button">
            Start conversion
          </a>
          <a href="#history" className="ghost-button">
            View history
          </a>
        </div>
        <div className="hero-trust">
          <div className="trust-card">
            <h3>Local-first</h3>
            <p>No external APIs required.</p>
          </div>
          <div className="trust-card">
            <h3>Multi-file ready</h3>
            <p>Batch conversions with progress tracking.</p>
          </div>
          <div className="trust-card">
            <h3>Playback synced</h3>
            <p>Click transcripts to jump in time.</p>
          </div>
        </div>
      </div>

      {rightSlot}
    </div>
  );
}
