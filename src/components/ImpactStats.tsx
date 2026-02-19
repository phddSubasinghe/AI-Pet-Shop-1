const stats = [
  { value: "12,400+", label: "Pets Adopted" },
  { value: "$2.1M", label: "Donations Raised" },
  { value: "85K+", label: "Community Members" },
  { value: "340+", label: "Partner Shelters" },
];

const ImpactStats = () => (
  <section className="py-24 px-6 lg:px-8" aria-labelledby="impact-title">
    <div className="container mx-auto max-w-5xl">
      <h2 id="impact-title" className="text-3xl sm:text-4xl font-bold font-display text-foreground text-center mb-16">
        Our Impact
      </h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-primary font-display mb-2">{s.value}</div>
            <div className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ImpactStats;
