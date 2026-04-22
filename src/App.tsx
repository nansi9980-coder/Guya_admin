import AppRouter from './router'
import { Toaster } from 'sonner'

export default function App() {
  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          },
        }}
      />
    </>
  )
}
