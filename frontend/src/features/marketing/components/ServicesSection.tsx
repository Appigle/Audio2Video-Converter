export function ServicesSection() {
  return (
    <section className="section services" id="services">
      <div className="section-header">
        <h2>Services</h2>
        <p>Everything you need to move from audio to video without friction.</p>
      </div>
      <div className="card-grid">
        <div className="info-card">
          <h3>Curated video output</h3>
          <p>Static background video rendered in 720p with balanced audio levels.</p>
        </div>
        <div className="info-card">
          <h3>Accurate transcripts</h3>
          <p>Timestamped JSON and VTT files ready for captions or archives.</p>
        </div>
        <div className="info-card">
          <h3>Progress-aware</h3>
          <p>Track each stage of transcription and rendering in real time.</p>
        </div>
      </div>
    </section>
  );
}
