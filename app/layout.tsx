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
  variable: '--font-sans',
})

export const viewport: Viewport = {
  themeColor: FTCLT_BRAND_THEME_COLOR,
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'FoodTruckCLT | Request Charlotte Food Trucks',
  description: 'Charlotte\'s food truck request network, built from the city\'s largest food truck community. Submit one request and connect directly with local trucks.',
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
