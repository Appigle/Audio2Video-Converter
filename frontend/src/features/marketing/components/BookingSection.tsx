export function BookingSection() {
  return (
    <section className="section booking" id="booking">
      <div className="booking-panel">
        <div>
          <h2>Ready to publish?</h2>
          <p>Start a new conversion or review your latest exports.</p>
        </div>
        <div className="booking-actions">
          <a href="#upload" className="cta-button">
            Start conversion
          </a>
          <a href="#history" className="ghost-button">
            Browse history
          </a>
        </div>
      </div>
    </section>
  );
}
