// import React from "react"
// import type { Metadata } from 'next'
// import { Geist, Geist_Mono } from 'next/font/google'

// import './globals.css'
// import { AuthProvider } from '@/lib/auth-context'

// const _geist = Geist({ subsets: ['latin'] })
// const _geistMono = Geist_Mono({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'Database Visualizer',
//   description: 'Explore your database with instant relation traversal. No SQL required.',
//   generator: 'v0.app',
// }

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode
// }>) {
//   return (
//     <html lang="en">
//       <body className="font-sans antialiased">
//         <AuthProvider>{children}</AuthProvider>
//       </body>
//     </html>
//   )
// }


// app/layout.tsx
import type { Metadata } from 'next'
import { Inter }         from 'next/font/google'
import { AuthProvider }  from '@/lib/auth-context'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title:       'Visio',
  description: 'Explore your databases visually',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className='dark'>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
