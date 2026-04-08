"use client";

export type MarqueeItem = {
  label: string;
  sub?: string;
};

const defaults: MarqueeItem[] = [
  { label: "Latin Stop", sub: "Tacos + Arepas" },
  { label: "Lela's Mini Donuts", sub: "South End" },
  { label: "The Plated Palette", sub: "American" },
  { label: "StrEATs Tasting Tour", sub: "Apr 11" },
  { label: "Charlotte Brewfest", sub: "Apr 4" },
  { label: "Saucy Girl Taco Truck", sub: "Now Booking" },
  { label: "Anne's Cuisine LLC", sub: "General" },
];

type MarqueeBarProps = {
  items?: MarqueeItem[];
};

/** Pass an array of { label, sub } objects as `items`. Falls back to placeholder names if nothing passed. */
export default function MarqueeBar({ items }: MarqueeBarProps) {
  const list = items?.length ? items : defaults;
  const doubled = [...list, ...list];

  return (
    <div className="overflow-hidden py-[9px]" style={{ background: "var(--ftc-orange)" }} aria-hidden="true">
      <div className="flex animate-marquee" style={{ width: "max-content" }}>
        {doubled.map((item, i) => (
          <span
            key={`${item.label}-${i}`}
            className="font-display mx-6 inline-flex items-center gap-2 whitespace-nowrap text-[13px] font-medium uppercase tracking-wide text-white"
          >
            <span className="inline-block h-1 w-1 rounded-full bg-white/50" />
            {item.label}
            {item.sub ? (
              <span className="font-normal normal-case tracking-normal text-white/60">· {item.sub}</span>
            ) : null}
          </span>
        ))}
      </div>
    </div>
  );
}
