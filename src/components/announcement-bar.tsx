"use client";

/**
 * Single-line marquee strip pinned to the very top of the storefront, above the
 * navigation bar. Content is loaded by the server (see loadAnnouncements in
 * lib/cms) and passed in, so the admin's "announcement" setting is the single
 * source of truth. It renders nothing when the admin has cleared the strip.
 *
 * The track is rendered twice and translated -50% for a seamless loop; the
 * duplicate copy is hidden from screen readers.
 */
export default function AnnouncementBar({
  messages,
}: {
  messages: string[];
}) {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="relative overflow-hidden bg-[var(--jaggery-brown)]">
      <div className="flex w-max items-center animate-marquee motion-reduce:animate-none hover:[animation-play-state:paused]">
        {[0, 1].map((group) => (
          <div
            key={group}
            aria-hidden={group === 1}
            className="flex shrink-0 items-center"
          >
            {messages.map((message, index) => (
              <span
                key={`${group}-${index}`}
                className="flex items-center gap-4 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--white)]/90"
              >
                {message}
                <span aria-hidden className="text-[var(--ginger-terracotta)]">
                  &bull;
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}