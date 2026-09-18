"use client";

import { useEffect, useState } from "react";
import { Search, LogOut, Settings } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Input } from "@/components/ui/input";
import { Dropdown, DropdownItem, DropdownLabel } from "@/components/ui/dropdown";
import { SettingsDialog } from "./SettingsDialog";
import { getUser, clearSession } from "@/lib/auth";
import { logoutUser } from "@/lib/api";

export function AppTopbar({
  search,
  onSearch,
}: {
  search?: string;
  onSearch?: (v: string) => void;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [initials, setInitials] = useState("··");
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function handleLogout() {
    await logoutUser();
    clearSession();
    window.location.href = "/login";
  }

  useEffect(() => {
    const u = getUser();
    if (!u) return;
    setEmail(u.email);
    const parts = [u.firstName, u.lastName].filter(Boolean) as string[];
    setInitials(
      parts.length
        ? parts.map((p) => p[0]!.toUpperCase()).join("").slice(0, 2)
        : u.email.slice(0, 2).toUpperCase(),
    );
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:px-8">
        <Logo size="sm" href="/dashboard" />

        {onSearch && (
          <div className="relative ml-2 hidden max-w-sm flex-1 md:block">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle"
            />
            <Input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search applications…"
              aria-label="Search applications"
              className="h-9 bg-surface-2 pl-9"
            />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Dropdown
            label="Account menu"
            trigger={() => (
              <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-display text-xs font-semibold text-accent-fg"
              >
                {initials}
              </span>
            )}
          >
            {(close) => (
              <>
                {email && <DropdownLabel>{email}</DropdownLabel>}
                <DropdownItem
                  onClick={() => {
                    close();
                    setSettingsOpen(true);
                  }}
                >
                  <Settings size={15} /> Settings
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    close();
                    handleLogout();
                  }}
                >
                  <LogOut size={15} /> Log out
                </DropdownItem>
              </>
            )}
          </Dropdown>
        </div>
      </div>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </header>
  );
}
