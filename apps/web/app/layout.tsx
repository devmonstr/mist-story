import type { Metadata } from 'next'
import { Source_Serif_4, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/context/auth-context'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { buildCanonicalUrl, getConfiguredSiteUrl } from '@/lib/site-url'
import './globals.css'

const sourceSerif = Source_Serif_4({ 
  subsets: ["latin"],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: getConfiguredSiteUrl(),
  title: {
    default: 'Mist Story — Where Stories Come to Life',
    template: '%s | Mist Story',
  },
  description: 'A minimalist platform for novel writers and readers. Write, read, and discover extraordinary stories.',
  generator: 'v0.app',
  alternates: {
    canonical: buildCanonicalUrl('/'),
  },
  openGraph: {
    type: 'website',
    url: buildCanonicalUrl('/'),
    siteName: 'Mist Story',
    title: 'Mist Story — Where Stories Come to Life',
    description:
      'A minimalist platform for novel writers and readers. Write, read, and discover extraordinary stories.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mist Story — Where Stories Come to Life',
    description:
      'A minimalist platform for novel writers and readers. Write, read, and discover extraordinary stories.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${sourceSerif.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
