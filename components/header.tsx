"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, MapPin, Calendar, Truck, LayoutDashboard, CalendarPlus } from "lucide-react"

const navigation = [
  { name: "Find Trucks", href: "/map", icon: MapPin },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "All Trucks", href: "/trucks", icon: Truck },
  { name: "Book a Truck", href: "/book-a-truck", icon: CalendarPlus },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold leading-none tracking-tight">
                FoodTruck
              </span>
              <span className="text-xs font-medium text-primary">CLT</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-lg hover:bg-muted"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex md:items-center md:gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard" className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Vendor Login
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/list-your-truck">List Your Truck</Link>
            </Button>
          </div>

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-6 pt-6">
                <Link 
                  href="/" 
                  className="flex items-center gap-2"
                  onClick={() => setIsOpen(false)}
                >
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

                <nav className="flex flex-col gap-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 text-base font-medium text-foreground rounded-lg hover:bg-muted transition-colors"
                    >
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      {item.name}
                    </Link>
                  ))}
                </nav>

                <div className="border-t pt-6 flex flex-col gap-3">
                  <Button variant="outline" asChild className="justify-start">
                    <Link 
                      href="/dashboard" 
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-2"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Vendor Login
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/list-your-truck" onClick={() => setIsOpen(false)}>
                      List Your Truck
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  )
}
