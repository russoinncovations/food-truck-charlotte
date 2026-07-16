import Link from "next/link"

const navigation = {
  discover: [
    { name: "Browse Trucks", href: "/trucks" },
    { name: "Events", href: "/events" },
    { name: "Live Map", href: "/map" },
    { name: "Promote an Event", href: "/promote-event" },
  ],
  forVendors: [
    { name: "Claim Your Profile", href: "/list-your-truck" },
    { name: "Vendor Dashboard", href: "/dashboard" },
    { name: "Resource Guide", href: "/resources" },
  ],
  forHosts: [
    { name: "Request a Truck", href: "/book-a-truck" },
    { name: "Browse Trucks", href: "/trucks" },
  ],
  community: [
    { name: "About", href: "/about" },
    { name: "Facebook Group", href: "https://www.facebook.com/share/g/1DjV7rGgcU/" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
}

const social = [
  { name: "Facebook", href: "https://www.facebook.com/share/g/1DjV7rGgcU/" },
]

function BrandWordmark() {
  return (
    <span className="font-display text-lg font-bold leading-none tracking-tight">
      <span className="text-foreground">FoodTruck</span>
      <span className="text-primary">CLT</span>
    </span>
  )
}

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-7">
            <div className="col-span-2">
              <Link href="/" className="mb-4 inline-flex items-baseline" aria-label="FoodTruckCLT home">
                <BrandWordmark />
              </Link>
              <p className="mb-6 max-w-xs text-sm text-muted-foreground">
                Charlotte&apos;s food truck request network — built from the city&apos;s largest food
                truck community.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {social.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-foreground"
                  >
                    {item.name}
                  </a>
                ))}
                <a
                  href="https://www.instagram.com/foodtruckcharlotte/"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-foreground"
                >
                  Instagram
                </a>
              </div>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-foreground">Discover</h3>
              <ul className="space-y-3">
                {navigation.discover.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-foreground">For Vendors</h3>
              <ul className="space-y-3">
                {navigation.forVendors.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-foreground">For Hosts</h3>
              <ul className="space-y-3">
                {navigation.forHosts.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-foreground">Community</h3>
              <ul className="space-y-3">
                {navigation.community.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-4 font-semibold text-foreground">Legal</h3>
              <ul className="space-y-3">
                {navigation.legal.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t py-6 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FoodTruckCLT. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
