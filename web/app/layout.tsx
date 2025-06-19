import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ClickTrace - Distributed Tracing Visualization',
  description: 'A powerful tool for visualizing and analyzing distributed traces in microservices architecture',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
