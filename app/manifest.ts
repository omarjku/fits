import type { MetadataRoute } from 'next'

// What a phone or browser needs to install Frosty as an app: its name, colours and icons.
// The icons are the app's own mascot (src/components/Mascot.tsx) on the page's cream, #FBF5EF.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Frosty - what to wear today',
    short_name: 'Frosty',
    description: 'Frosty checks the weather and your own wardrobe and tells you what to wear.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FBF5EF',
    theme_color: '#FBF5EF',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      // same mascot with more margin, for launchers that crop icons to a circle or squircle
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
