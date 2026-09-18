"use client";

import {
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";

export function Dropdown({
  trigger,
  children,
  align = "end",
  label,
}: {
  trigger: (props: { open: boolean }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
  /** Accessible name for the trigger button — required when `trigger`'s
   * content is icon-only and carries no text a screen reader could use. */
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const id = useId();

  function close() {
    setOpen(false);
  }

  // Refs may only be touched in effects/handlers, not synchronously from a
  // function handed to `children(close)` during render — so the actual
  // focus-return lives here, reacting to `open`'s true→false transition,
  // rather than inside `close` itself.
  useEffect(() => {
    if (wasOpen.current && !open) {
      triggerRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open]);

  function menuItems() {
    return Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
  }

  useEffect(() => {
    if (!open) return;
    // APG menu-button pattern: opening moves focus into the menu so
    // keyboard users don't need an extra Tab press to reach it.
    menuItems()[0]?.focus();

    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        return;
      }
      const items = menuItems();
      const current = items.indexOf(document.activeElement as HTMLElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(current + 1) % items.length]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(current - 1 + items.length) % items.length]?.focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        items[0]?.focus();
      } else if (e.key === "End") {
        e.preventDefault();
        items[items.length - 1]?.focus();
      } else if (e.key === "Tab") {
        // Don't trap Tab — just close so the menu isn't left open (and
        // visually floating) once focus moves on to the next element.
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center"
      >
        {trigger({ open })}
      </button>
      {open && (
        <div
          ref={menuRef}
          id={id}
          role="menu"
          className={cn(
            "rl-pop absolute z-40 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-border-strong bg-surface p-1 shadow-pop",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  onClick,
  children,
  destructive,
}: {
  onClick: () => void;
  children: ReactNode;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
        destructive
          ? "text-[var(--st-rejected)] hover:bg-[var(--st-rejected-bg)]"
          : "text-fg hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <div className="label-mono px-2.5 pb-1 pt-2 !text-[10px]">{children}</div>
  );
}
