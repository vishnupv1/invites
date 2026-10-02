import "./card-skeleton.css";

export function SkeletonCards({ count = 8, cover = "poster" }: { count?: number; cover?: "poster" | "studio" }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <article className={`skel-card${cover === "studio" ? " studio" : ""}`} key={index} aria-hidden="true">
          <div className="skel-cover" />
          <div className="skel-copy">
            <span className="skel-line title" />
            <span className="skel-line sub" />
            <span className="skel-pill" />
          </div>
          <span className="skel-shimmer" style={{ animationDelay: `${index * 0.12}s` }} />
        </article>
      ))}
    </>
  );
}

export function SkeletonGrid({ count = 8, cover = "poster", className }: { count?: number; cover?: "poster" | "studio"; className?: string }) {
  return (
    <div className={className ?? "skel-grid"} role="status" aria-busy="true" aria-label="Loading">
      <span className="skel-sr">Loading</span>
      <SkeletonCards count={count} cover={cover} />
    </div>
  );
}
