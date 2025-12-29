import type { Metadata } from 'next'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jetton Minter 2.0 - Create Your TON Token',
  description: 'Create and deploy your own Jetton 2.0 tokens on TON blockchain with ease. Based on official TON smart contracts with a beautiful ton.org-style interface.',
  keywords: ['TON', 'Jetton', 'Token', 'Cryptocurrency', 'Blockchain', 'Minter', 'TON Blockchain'],
  authors: [{ name: 'Jetton Minter 2.0' }],
  openGraph: {
    title: 'Jetton Minter 2.0 - Create Your TON Token',
    description: 'Create and deploy your own Jetton 2.0 tokens on TON blockchain',
    type: 'website',
  },
}

const manifestUrl = process.env.NEXT_PUBLIC_MANIFEST_URL || '/tonconnect-manifest.json'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <TonConnectUIProvider manifestUrl={manifestUrl}>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 5000,
                iconTheme: {
                  primary: '#0098EA',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
              },
            }}
          />
          {children}
        </TonConnectUIProvider>
      </body>
    </html>
  )
}
