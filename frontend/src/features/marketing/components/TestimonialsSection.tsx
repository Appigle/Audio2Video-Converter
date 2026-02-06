export function TestimonialsSection() {
  return (
    <section className="section testimonials" id="testimonials">
      <div className="section-header">
        <h2>Testimonials</h2>
        <p>Trusted by teams who value calm, polished delivery.</p>
      </div>
      <div className="card-grid">
        <div className="quote-card">
          <p>
            “We ship client recaps in minutes. The transcript syncing is effortless for our
            editors.”
          </p>
          <span>Studio Lead, Riverside</span>
        </div>
        <div className="quote-card">
          <p>
            “Batch conversions keep our workflow smooth. The UI feels premium and predictable.”
          </p>
          <span>Producer, Northwind Media</span>
        </div>
        <div className="quote-card">
          <p>“Local-only processing gives our team the privacy we need.”</p>
          <span>Operations, Bloom Wellness</span>
        </div>
      </div>
    </section>
  );
}
