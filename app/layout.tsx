import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { FTCLT_BRAND_THEME_COLOR } from '@/lib/brand-colors'
import { cachedPwaIconHref } from '@/lib/pwa-icon-cache'

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: '--font-manrope',
})

export const viewport: Viewport = {
  themeColor: FTCLT_BRAND_THEME_COLOR,
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Food Truck CLT | Charlotte\'s Food Truck Community',
  description: 'The only local guide built from Charlotte\'s own 35,000-member food truck community. Find trucks, discover events, and book for your next gathering.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: cachedPwaIconHref('/icon-192.png'), sizes: '192x192', type: 'image/png' },
      { url: cachedPwaIconHref('/icon-512.png'), sizes: '512x512', type: 'image/png' },
      { url: cachedPwaIconHref('/favicon.ico'), sizes: 'any', type: 'image/x-icon' },
    ],
    apple: [{ url: cachedPwaIconHref('/apple-touch-icon.png'), sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'FoodTruckCLT',
    statusBarStyle: 'default',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
