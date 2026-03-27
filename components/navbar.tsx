import Link from "next/link";

const navLinks = [
  { href: "/find-food-trucks", label: "Find Food Vendors" },
  { href: "/events", label: "Events" },
  { href: "/book-a-truck", label: "Request a Truck" },
  { href: "/for-trucks", label: "For Vendors" },
  { href: "/for-venues", label: "For Venues" },
  { href: "/about", label: "Community" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-[#1E1E1E]/8 bg-[#faf6f0]/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-[1.1rem] font-semibold tracking-tight text-[#1E1E1E] sm:text-[1.2rem]">
          <span className="text-[#D97A2B]">Food Truck</span> Charlotte
        </Link>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px]">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-[#1E1E1E]/75 transition-colors hover:text-[#1E1E1E]">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
