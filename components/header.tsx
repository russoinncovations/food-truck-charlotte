"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, MapPin, Calendar, Truck, LogIn } from "lucide-react"

function HeaderBrandMark() {
  return (
    <Image
      src="/brand-mark.png"
      alt=""
      width={36}
      height={36}
      className="h-9 w-9 shrink-0"
      priority
    />
  )
}

const navigation = [
  { name: "Find Food Trucks", href: "/map", icon: MapPin },
  { name: "Events & Map", href: "/events", icon: Calendar },
  { name: "For Truck Owners", href: "/list-your-truck", icon: Truck },
]

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="w-full bg-[#D94F1E] px-4 py-2 text-center text-sm text-white" />
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <HeaderBrandMark />
            <div className="flex flex-col">
              <span className="font-display text-lg font-bold leading-none tracking-tight">FoodTruck</span>
              <span className="text-xs font-medium text-primary">CLT</span>
            </div>
          </Link>

          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground rounded-lg hover:bg-muted"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex md:items-center md:gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/vendor-login" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Log In
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/book-a-truck">Book Food Trucks</Link>
            </Button>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-6 pt-6">
                <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                  <HeaderBrandMark />
                  <div className="flex flex-col">
                    <span className="font-display text-lg font-bold leading-none">FoodTruck</span>
                    <span className="text-xs font-medium text-primary">CLT</span>
                  </div>
                </Link>

                <nav className="flex flex-col gap-1">
                  <Button asChild className="justify-start">
                    <Link href="/book-a-truck" onClick={() => setIsOpen(false)}>
                      Book Food Trucks
                    </Link>
                  </Button>
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
                    <Link href="/vendor-login" onClick={() => setIsOpen(false)} className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Log In
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
