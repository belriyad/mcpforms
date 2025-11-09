import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import '../styles/globals.css'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import { PageTracker } from '@/components/PageTracker'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Smart Forms AI - Business Document Generator',
  description: 'AI-powered business form generator with template parsing and automated document creation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <PageTracker />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}