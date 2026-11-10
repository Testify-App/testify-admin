import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background p-6 text-center">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">The page you’re looking for doesn’t exist.</p>
        <Button asChild className="mt-6">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </main>
  )
}
