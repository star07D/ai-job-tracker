"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Copy, FileText, Mail, RefreshCw, Share2, Trash2, Upload } from "lucide-react";
import { Dialog, DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApiError,
  disableSharing,
  enableSharing,
  getMe,
  removeResume,
  updateEmailDigest,
  uploadResume,
} from "@/lib/api";
import { relativeTime } from "@/lib/format";
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
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [sharingSaving, setSharingSaving] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeUpdatedAt, setResumeUpdatedAt] = useState<string | null>(null);
  const [resumeSaving, setResumeSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getMe()
      .then((user) => {
        setEmail(user.email);
        setEnabled(!!user.emailDigestEnabled);
        setShareToken(user.shareToken ?? null);
        setResumeFileName(user.hasResume ? (user.resumeFileName ?? null) : null);
        setResumeUpdatedAt(user.resumeUpdatedAt ?? null);
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

  async function toggleSharing() {
    setSharingSaving(true);
    try {
      if (shareToken) {
        const user = await disableSharing();
        setShareToken(user.shareToken ?? null);
        updateStoredUser({ shareToken: null });
        toast.success("Share link turned off");
      } else {
        const user = await enableSharing();
        setShareToken(user.shareToken ?? null);
        updateStoredUser({ shareToken: user.shareToken });
        toast.success("Share link turned on");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save that");
    } finally {
      setSharingSaving(false);
    }
  }

  async function regenerate() {
    setSharingSaving(true);
    try {
      const user = await enableSharing();
      setShareToken(user.shareToken ?? null);
      updateStoredUser({ shareToken: user.shareToken });
      toast.success("New link generated — the old one no longer works.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save that");
    } finally {
      setSharingSaving(false);
    }
  }

  async function handleResumeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // so picking the same file again still fires onChange
    if (!file) return;

    setResumeSaving(true);
    try {
      const user = await uploadResume(file);
      setResumeFileName(user.resumeFileName ?? null);
      setResumeUpdatedAt(user.resumeUpdatedAt ?? null);
      updateStoredUser({ hasResume: true });
      toast.success("Résumé uploaded");
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Couldn't read that file — try again.",
      );
    } finally {
      setResumeSaving(false);
    }
  }

  async function handleRemoveResume() {
    setResumeSaving(true);
    try {
      await removeResume();
      setResumeFileName(null);
      setResumeUpdatedAt(null);
      updateStoredUser({ hasResume: false });
      toast.success("Résumé removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove that");
    } finally {
      setResumeSaving(false);
    }
  }

  function copyLink() {
    if (!shareToken) return;
    navigator.clipboard
      .writeText(`${window.location.origin}/share/${shareToken}`)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Couldn't copy — copy it manually"));
  }

  return (
    <Dialog open={open} onClose={onClose} title="Settings">
      <DialogBody className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </>
        ) : (
          <>
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

            <div className="rounded-lg border border-border bg-surface-2/40 p-3.5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-2.5">
                  <Share2 size={16} className="mt-0.5 shrink-0 text-fg-subtle" />
                  <div>
                    <p className="text-[13.5px] font-semibold">Public share link</p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-muted">
                      A read-only page anyone with the link can view — role,
                      company and status per application. Salary, notes and
                      contact details always stay private.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!!shareToken}
                  aria-label="Public share link"
                  onClick={toggleSharing}
                  disabled={sharingSaving}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60",
                    shareToken ? "bg-accent" : "bg-surface-3",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                      shareToken ? "translate-x-5" : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>

              {shareToken && (
                <div className="mt-3 flex items-center gap-1.5">
                  <Input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareToken}`}
                    className="h-8 flex-1 text-[12.5px]"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyLink}
                    aria-label="Copy link"
                  >
                    <Copy size={13} />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={regenerate}
                    disabled={sharingSaving}
                    aria-label="Regenerate link"
                  >
                    <RefreshCw size={13} />
                  </Button>
                </div>
              )}
            </div>

            <div className="rounded-lg border border-border bg-surface-2/40 p-3.5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-2.5">
                  <FileText size={16} className="mt-0.5 shrink-0 text-fg-subtle" />
                  <div>
                    <p className="text-[13.5px] font-semibold">Résumé</p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-muted">
                      {resumeFileName ? (
                        <>
                          <span className="font-medium text-fg">
                            {resumeFileName}
                          </span>
                          {resumeUpdatedAt &&
                            ` — uploaded ${relativeTime(resumeUpdatedAt)}`}
                        </>
                      ) : (
                        "Upload it once to check how well it fits any job — PDF or Word, up to 5MB."
                      )}
                    </p>
                  </div>
                </div>
                {resumeFileName && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveResume}
                    disabled={resumeSaving}
                    aria-label="Remove résumé"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                aria-label="Résumé file"
                className="hidden"
                onChange={handleResumeFile}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                loading={resumeSaving}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={13} />
                {resumeFileName ? "Replace" : "Upload résumé"}
              </Button>
            </div>
          </>
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
