export function ContactSection() {
  return (
    <section className="section contact" id="contact">
      <div className="section-header">
        <h2>Contact</h2>
        <p>
          Need help with setup? Check your local backend logs or reach your technical lead for
          support.
        </p>
      </div>
      <div className="contact-grid">
        <div className="info-card">
          <h3>Local health</h3>
          <p>Run the backend on port 8000 and ensure FFmpeg is installed.</p>
        </div>
        <div className="info-card">
          <h3>Frontend</h3>
          <p>Use port 5173 or 5174 and keep the API URL in sync.</p>
        </div>
        <div className="info-card">
          <h3>Privacy</h3>
          <p>Your files remain on your machine from upload to export.</p>
        </div>
      </div>
    </section>
  );
}
