import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Qemat',
    short_name: 'Qemat',
    description: 'Community-driven grocery and pharma price comparison app.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#ffffff',
    theme_color: '#10b981',
    icons: [
      {
        src: '/assets/logo/logo.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/assets/logo/logo.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/assets/logo/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}
