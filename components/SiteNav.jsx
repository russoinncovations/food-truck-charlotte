"use client";

import Link from "next/link";

export default function SiteNav() {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-10 h-14 border-b"
      style={{
        background: "var(--ftc-cream)",
        borderColor: "var(--ftc-border)",
      }}
    >
      {/* Wordmark */}
      <Link href="/" className="font-display font-extrabold text-[17px] tracking-tight" style={{ color: "var(--ftc-ink)" }}>
        Food Truck <span style={{ color: "var(--ftc-orange)" }}>CLT</span>
      </Link>

      {/* Links */}
      <ul className="hidden md:flex items-center gap-8 list-none">
        {[
          { label: "Find Trucks", href: "/find-food-trucks" },
          { label: "Events",      href: "/events" },
          { label: "For Trucks",  href: "/for-trucks" },
          { label: "Community",   href: "/about" },
        ].map(({ label, href }) => (
          <li key={href}>
            <Link href={href} className="text-sm font-normal transition-colors" style={{ color: "var(--ftc-subtle)" }}>
              {label}
            </Link>
          </li>
        ))}
      </ul>

      {/* CTAs */}
      <div className="flex items-center gap-3">
        <Link
          href="/for-trucks"
          className="hidden md:inline-flex text-[13px] font-medium px-4 py-2 rounded-md border transition-colors"
          style={{ borderColor: "var(--ftc-border-md)", color: "var(--ftc-ink)" }}
        >
          List Your Truck
        </Link>
        <Link
          href="/book-a-truck"
          className="inline-flex text-[13px] font-medium px-4 py-2 rounded-md text-white"
          style={{ background: "var(--ftc-orange)" }}
        >
          Book a Truck
        </Link>
      </div>
    </nav>
  );
}
