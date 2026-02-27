'use client'

import { Button } from '@/components/ui/button'
import { Link as LucideLink } from 'lucide-react'
import Link from 'next/link'
import { ConnectionModal } from '@/components/connection-modal' // Import ConnectionModal
import { useState } from 'react' // Import useState for managing showConnection state

export function LandingPage() {
  const [showConnection, setShowConnection] = useState(false) // Declare showConnection and setShowConnection

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
            <LucideLink className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">DBViz</span>
        </div>
        <nav className="flex gap-6 items-center text-sm">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            GitHub
          </a>
          <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
            Log In
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-foreground text-balance">
              Explore Your Database Instantly
            </h1>
            <p className="text-lg text-muted-foreground text-balance">
              Visual, intuitive database exploration. No SQL required. Traverse relations with a single click.
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Link href="/signup">
              <Button size="lg" className="px-8 py-6 text-base">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 py-6 text-base bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="pt-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg bg-secondary border border-border space-y-3">
                <div className="text-2xl">⚡</div>
                <h3 className="font-semibold text-foreground">Fast Traversal</h3>
                <p className="text-sm text-muted-foreground">
                  Jump between related tables with instant visual feedback
                </p>
              </div>

              <div className="p-6 rounded-lg bg-secondary border border-border space-y-3">
                <div className="text-2xl">🎯</div>
                <h3 className="font-semibold text-foreground">SQL-Free</h3>
                <p className="text-sm text-muted-foreground">
                  Filter and explore data without writing a single query
                </p>
              </div>

              <div className="p-6 rounded-lg bg-secondary border border-border space-y-3">
                <div className="text-2xl">⌨️</div>
                <h3 className="font-semibold text-foreground">Developer-Grade</h3>
                <p className="text-sm text-muted-foreground">
                  Built for developers. Keyboard shortcuts. Fast. Clean.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}
