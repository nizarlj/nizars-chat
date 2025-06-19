"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Keyboard, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ShortcutItem {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: ShortcutItem[] = [
  {
    keys: ["Ctrl", "Shift", "O"],
    description: "Start a new chat",
    category: "Navigation"
  },
  {
    keys: ["Ctrl", "K"],
    description: "Focus search",
    category: "Navigation"
  },
  {
    keys: ["Ctrl", "B"],
    description: "Toggle sidebar",
    category: "Navigation"
  },
  {
    keys: ["Ctrl", ","],
    description: "Open settings",
    category: "Navigation"
  },
  {
    keys: ["Ctrl", "G"],
    description: "Open gallery",
    category: "Navigation"
  },
  {
    keys: ["Ctrl", "M"],
    description: "Open model selector",
    category: "Chat"
  },
  {
    keys: ["Enter"],
    description: "Send message",
    category: "Chat"
  },
  {
    keys: ["Shift", "Enter"],
    description: "New line",
    category: "Chat"
  }
];

function KeyboardKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded-md">
      {children}
    </kbd>
  );
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutItem }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{shortcut.description}</span>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, index) => (
          <div key={index} className="flex items-center gap-1">
            <KeyboardKey>{key}</KeyboardKey>
            {index < shortcut.keys.length - 1 && (
              <span className="text-xs text-muted-foreground">+</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface KeyboardShortcutsProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function KeyboardShortcuts({ 
  open: controlledOpen, 
  onOpenChange 
}: KeyboardShortcutsProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  // If controlled externally (no trigger needed)
  if (controlledOpen !== undefined) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn("max-w-md", isMobile && "max-w-[95vw]")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Command className="h-5 w-5" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>
              Use these keyboard shortcuts to navigate and interact with the chat interface more efficiently.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h3>
                <div className="space-y-1">
                  {categoryShortcuts.map((shortcut, index) => (
                    <ShortcutRow key={index} shortcut={shortcut} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>💡 Tip: Most shortcuts work anywhere in the app, except when typing in input fields.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Default behavior with trigger button
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          tooltip="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className={cn("max-w-md", isMobile && "max-w-[95vw]")}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with the chat interface more efficiently.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">{category}</h3>
              <div className="space-y-1">
                {categoryShortcuts.map((shortcut, index) => (
                  <ShortcutRow key={index} shortcut={shortcut} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground pt-2 border-t">
          <p>💡 Tip: Most shortcuts work anywhere in the app, except when typing in input fields.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 