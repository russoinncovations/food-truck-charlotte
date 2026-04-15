"use client";

// Pass an array of { label, sub } objects as `items`
// Falls back to placeholder truck names if nothing passed
export default function MarqueeBar({ items }) {
  const defaults = [
    { label: "Latin Stop",             sub: "Tacos + Arepas" },
    { label: "Lela's Mini Donuts",     sub: "South End" },
    { label: "The Plated Palette",     sub: "American" },
    { label: "StrEATs Tasting Tour",   sub: "Apr 11" },
    { label: "Charlotte Brewfest",     sub: "Apr 4" },
    { label: "Saucy Girl Taco Truck",  sub: "Now Booking" },
    { label: "Anne's Cuisine LLC",     sub: "General" },
  ];

  const list = items?.length ? items : defaults;
  // Duplicate for seamless loop
  const doubled = [...list, ...list];

  return (
    <div
      className="overflow-hidden py-[9px]"
      style={{ background: "var(--ftc-orange)" }}
      aria-hidden="true"
    >
      <div className="flex animate-marquee" style={{ width: "max-content" }}>
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 font-display font-medium text-[13px] uppercase tracking-wide text-white mx-6 whitespace-nowrap"
          >
            <span className="w-1 h-1 rounded-full bg-white/50 inline-block" />
            {item.label}
            {item.sub && (
              <span className="text-white/60 normal-case font-normal tracking-normal">
                · {item.sub}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
