'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface KeyboardShortcutsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['Cmd/Ctrl', 'K'], description: 'Quick search' },
        { keys: ['Esc'], description: 'Go back or close dialog' },
        { keys: ['Tab'], description: 'Navigate elements' },
      ],
    },
    {
      category: 'Table View',
      items: [
        { keys: ['↑', '↓'], description: 'Navigate rows' },
        { keys: ['Enter'], description: 'Open row details' },
        { keys: ['Ctrl/Cmd', 'C'], description: 'Copy cell value' },
      ],
    },
    {
      category: 'Search & Filter',
      items: [
        { keys: ['/'], description: 'Focus search' },
        { keys: ['Backspace'], description: 'Clear search' },
      ],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Master keyboard navigation for faster database exploration
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {shortcuts.map(group => (
            <div key={group.category}>
              <h3 className="font-semibold text-foreground mb-3">{group.category}</h3>
              <div className="space-y-2">
                {group.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <p className="text-muted-foreground flex-1">{item.description}</p>
                    <div className="flex gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <div key={keyIndex} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs bg-secondary border border-border rounded font-mono">
                            {key}
                          </kbd>
                          {keyIndex < item.keys.length - 1 && (
                            <span className="text-muted-foreground">+</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
