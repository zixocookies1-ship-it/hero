import type { ReactNode } from "react";

/**
 * The four trust blocks that sit just above the footer. Copy is fixed here
 * rather than admin-editable: these are compliance promises (FSSAI, lab
 * testing, payment security, delivery), not marketing copy, so they should
 * not drift with an accidental CMS edit.
 */
type TrustBadge = {
  key: "fssai" | "lab" | "payments" | "delivery";
  title: string;
  text: string;
  logos?: string[];
};

const BADGES: TrustBadge[] = [
  {
    key: "fssai",
    title: "FSSAI Licensed",
    text: "Prepared and packed under applicable food-safety requirements.",
  },
  {
    key: "lab",
    title: "Independent Lab Reports",
    text: "Available reports can be viewed directly online.",
  },
  {
    key: "payments",
    title: "Secure Online Payments",
    text: "Protected checkout powered by Razorpay.",
    logos: ["UPI", "VISA", "Mastercard", "RuPay"],
  },
  {
    key: "delivery",
    title: "PAN-India Delivery",
    text: "Carefully packed orders delivered across India.",
  },
];

function BadgeIcon({ badge }: { badge: TrustBadge["key"] }) {
  const shared = {
    className: "h-5 w-5",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  } as const;

  if (badge === "fssai") {
    return (
      <svg {...shared}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  }

  if (badge === "lab") {
    return (
      <svg {...shared}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.6}
          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
        />
      </svg>
    );
  }

  if (badge === "payments") {
    return (
      <svg {...shared}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.6}
          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    );
  }

  return (
    <svg {...shared}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.6}
        d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375A1.125 1.125 0 012.25 17.625V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
      />
    </svg>
  );
}

export default function TrustBadges(): ReactNode {
  return (
    <section
      aria-label="Trust and payment information"
      className="border-t border-[#eee4db] bg-[var(--white)] px-6 py-6"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[20px] border border-[#e8ddd2] bg-[#e8ddd2] shadow-[0_14px_36px_rgba(51,33,20,0.06)] sm:grid-cols-2 lg:grid-cols-4">
          {BADGES.map((badge) => (
            <div
              key={badge.key}
              className="flex min-h-[105px] items-center gap-3.5 bg-[#fffaf4] p-5"
            >
              <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] border border-[#dfe9d9] bg-[var(--mint-soft)] text-[var(--natural-green)]">
                <BadgeIcon badge={badge.key} />
              </span>
              <div>
                <strong className="block text-sm font-bold leading-snug text-[var(--dark-text)]">
                  {badge.title}
                </strong>
                <small className="mt-1 block text-xs leading-relaxed text-[var(--dark-text)]/60">
                  {badge.text}
                </small>
                {badge.logos ? (
                  <div
                    className="mt-1.5 flex flex-wrap gap-1"
                    aria-label="Accepted payment methods"
                  >
                    {badge.logos.map((logo) => (
                      <span
                        key={logo}
                        className="rounded-[5px] border border-[#ddd5ce] bg-[var(--white)] px-1.5 py-[3px] text-[9px] font-black leading-none tracking-wide text-[#51443d]"
                      >
                        {logo}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
