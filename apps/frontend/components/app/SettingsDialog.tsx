"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Mail } from "lucide-react";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getMe, updateEmailDigest } from "@/lib/api";
import { updateStoredUser } from "@/lib/auth";
import { cn } from "@/lib/cn";

export function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getMe()
      .then((user) => {
        setEmail(user.email);
        setEnabled(!!user.emailDigestEnabled);
      })
      .catch(() => toast.error("Couldn't load your settings"))
      .finally(() => setLoading(false));
  }, [open]);

  async function toggle() {
    const next = !enabled;
    setEnabled(next); // optimistic
    setSaving(true);
    try {
      await updateEmailDigest(next);
      updateStoredUser({ emailDigestEnabled: next });
      toast.success(next ? "Daily digest turned on" : "Daily digest turned off");
    } catch (err) {
      setEnabled(!next);
      toast.error(err instanceof Error ? err.message : "Couldn't save that");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Settings">
      <DialogBody>
        {loading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface-2/40 p-3.5">
            <div className="flex gap-2.5">
              <Mail size={16} className="mt-0.5 shrink-0 text-fg-subtle" />
              <div>
                <p className="text-[13.5px] font-semibold">Daily email digest</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-muted">
                  A summary of overdue follow-ups and applications that have gone
                  quiet, sent to{" "}
                  <span className="font-medium text-fg">{email}</span>.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label="Daily email digest"
              onClick={toggle}
              disabled={saving}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60",
                enabled ? "bg-accent" : "bg-surface-3",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  enabled ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" onClick={onClose}>
          Done
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
