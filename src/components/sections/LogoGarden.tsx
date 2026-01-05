export function LogoGarden() {
  return (
    <section className="py-v3 px-g2">
      <div className="mx-auto max-w-container">
        {/* Simple text - not boastful */}
        <p className="text-sm text-text-secondary text-center mb-v1">
          Trusted every day by tax professionals nationwide.
        </p>

        {/* Logo grid - individual cards */}
        <div className="logo-garden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="logo-item">
              <span className="text-text-tertiary text-sm">Logo {i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
