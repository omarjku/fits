import type { Metadata, Viewport } from 'next'
import '../src/index.css'

export const metadata: Metadata = {
  title: 'Frosty - what to wear today',
  description: 'Frosty checks the weather and your own wardrobe and tells you what to wear.',
  applicationName: 'Frosty',
  // iOS: "Add to Home Screen" opens Frosty full screen under this name (Android and desktop read app/manifest.ts)
  appleWebApp: { capable: true, title: 'Frosty', statusBarStyle: 'default' },
}
export const viewport: Viewport = { themeColor: '#FBF5EF' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
