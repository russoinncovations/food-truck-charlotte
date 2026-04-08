import Link from "next/link";

const navLinks = [
  { label: "Find Trucks", href: "/find-food-trucks" },
  { label: "Events", href: "/events" },
  { label: "Book a Truck", href: "/book-a-truck" },
  { label: "Join the Directory", href: "/for-trucks" },
  { label: "Community", href: "/about" },
];

export function SiteNav() {
  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "var(--ftc-cream)",
        borderColor: "var(--ftc-border)",
      }}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="font-display text-[17px] font-extrabold tracking-tight"
          style={{ color: "var(--ftc-ink)" }}
        >
          Food Truck <span style={{ color: "var(--ftc-orange)" }}>CLT</span>
        </Link>

        <ul className="hidden list-none items-center gap-6 md:flex lg:gap-8">
          {navLinks.map(({ label, href }) => (
            <li key={href}>
              <Link
                href={href}
                className="text-sm font-normal transition-colors hover:opacity-80"
                style={{ color: "var(--ftc-subtle)" }}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/for-trucks"
            className="hidden rounded-md border px-3 py-2 text-[13px] font-medium transition-colors md:inline-flex"
            style={{ borderColor: "var(--ftc-border-md)", color: "var(--ftc-ink)" }}
          >
            List Your Truck
          </Link>
          <Link
            href="/book-a-truck"
            className="inline-flex rounded-md px-3 py-2 text-[13px] font-medium text-white sm:px-4"
            style={{ background: "var(--ftc-orange)" }}
          >
            Book a Truck
          </Link>
        </div>
      </nav>
    </header>
  );
}
