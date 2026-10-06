export type CustomerReview = {
  name: string;
  rating: number;
  text: string;
  product?: string;
};

/**
 * Placeholder reviews so the section can be reviewed visually. Replace the text
 * below with real customer quotes before going live, and drop any entry whose
 * rating is not genuine.
 */
const reviews: CustomerReview[] = [
  {
    name: "Anjali Sharma",
    rating: 5,
    product: "Desi Chocolatey Jaggery",
    text: "The first jaggery that actually tastes like my grandmother's. Rich, slightly smoky, and nothing like the adulterated ones in the market.",
  },
  {
    name: "Fatima Ansari",
    rating: 4,
    product: "Desi Til Chocolatey Jaggery",
    text: "Very good with warm milk. Four stars only because I would love a smaller pack for travel, but the taste is genuinely excellent.",
  },
  {
    name: "Rohit Verma",
    rating: 5,
    product: "Desi Elaichi Chocolatey Jaggery",
    text: "I am a tea-drinker's tea drinker's tea drinker, and this has become the default. The elaichi note is present without being sweet.",
  },
];

const averageRating = (list: CustomerReview[]) =>
  list.reduce((sum, review) => sum + review.rating, 0) / list.length;

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  const rounded = Math.round(rating);
  const full = "M12 2.6l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.45 6.2 20.5l1.1-6.45-4.7-4.6 6.5-.95z";

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[#E0A33E] ${className}`}
      role="img"
      aria-label={`Rated ${rating} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((position) => (
        <svg
          key={position}
          viewBox="0 0 24 24"
          className={`h-4 w-4 ${
            position <= rounded ? "fill-current" : "fill-transparent stroke-current/40"
          }`}
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path d={full} />
        </svg>
      ))}
    </span>
  );
}

export default function CustomerReviews() {
  const average = averageRating(reviews);

  return (
    <section className="bg-[var(--warm-cream)] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[var(--ginger-terracotta)]">
              Customer reviews
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[var(--dark-text)]">
              What people say
            </h2>
          </div>

          <div className="flex items-center gap-3 rounded-full border border-black/5 bg-[var(--white)] px-5 py-3 shadow-sm">
            <Stars rating={average} />
            <span className="text-sm font-semibold text-[var(--dark-text)]">
              {average.toFixed(1)} out of 5
            </span>
            <span className="text-sm text-[var(--dark-text)]/60">
              ({reviews.length} reviews)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={review.name}
              className="flex flex-col rounded-2xl border border-black/5 bg-[var(--white)] p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--jaggery-brown)] font-serif text-sm font-bold text-[var(--white)]"
                >
                  {initialsOf(review.name)}
                </span>
                <div>
                  <p className="font-semibold text-[var(--dark-text)]">{review.name}</p>
                  {review.product ? (
                    <p className="text-xs text-[var(--dark-text)]/60">{review.product}</p>
                  ) : null}
                </div>
              </div>

              <Stars rating={review.rating} className="mt-4" />

              <p className="mt-3 text-sm leading-relaxed text-[var(--dark-text)]/75">
                {review.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}