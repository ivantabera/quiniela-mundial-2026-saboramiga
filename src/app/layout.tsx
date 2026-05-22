import type { Metadata } from 'next'
import { Bebas_Neue, Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
})

export const metadata: Metadata = {
  title: 'Quiniela Mundial 2026 | Sabor a Miga',
  description: 'La quiniela oficial del Mundial 2026. ¡Haz tus predicciones y gana la bolsa!',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bebasNeue.variable} ${inter.variable}`}>
      <body className="font-body bg-pitch-950 text-white antialiased min-h-screen">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2e1a',
              color: '#fff',
              border: '1px solid #22c55e',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  )
}
