import Link from "next/link"
import { Truck, Facebook, Instagram, Twitter } from "lucide-react"

const navigation = {
  discover: [
    { name: "Live Map", href: "/map" },
    { name: "All Trucks", href: "/trucks" },
    { name: "Events", href: "/events" },
  ],
  forVendors: [
    { name: "List Your Truck", href: "/list-your-truck" },
    { name: "Vendor Dashboard", href: "/dashboard" },
  ],
  forHosts: [
    { name: "Browse Trucks", href: "/trucks" },
    { name: "Book for an Event", href: "/book-trucks" },
  ],
  community: [
    { name: "Facebook Group", href: "https://facebook.com/groups/foodtruckclt" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ],
}

const social = [
  { name: "Facebook", href: "https://facebook.com/foodtruckclt", icon: Facebook },
  { name: "Instagram", href: "https://instagram.com/foodtruckclt", icon: Instagram },
  { name: "Twitter", href: "https://twitter.com/foodtruckclt", icon: Twitter },
]

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            {/* Brand */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <Truck className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-lg font-bold leading-none">
                    FoodTruck
                  </span>
                  <span className="text-xs font-medium text-primary">CLT</span>
                </div>
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs mb-6">
                The only local guide built from Charlotte&apos;s own 35,000-member 
                food truck community on Facebook.
              </p>
              {/* Social */}
              <div className="flex gap-4">
                {social.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Discover</h3>
              <ul className="space-y-3">
                {navigation.discover.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">For Vendors</h3>
              <ul className="space-y-3">
                {navigation.forVendors.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">For Hosts</h3>
              <ul className="space-y-3">
                {navigation.forHosts.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">Community</h3>
              <ul className="space-y-3">
                {navigation.community.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} FoodTruck CLT. All rights reserved.
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
