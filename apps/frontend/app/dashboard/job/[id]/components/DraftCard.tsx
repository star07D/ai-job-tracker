"use client";

import { useState } from "react";
import { Copy, Mail, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, generateDraft } from "@/lib/api";
import { Draft, DraftKind, Job } from "@/lib/types";

const KINDS: { kind: DraftKind; label: string }[] = [
  { kind: "follow-up", label: "Follow-up" },
  { kind: "thank-you", label: "Thank-you" },
  { kind: "cover-letter", label: "Cover letter" },
];

function copy(text: string, done: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(done))
    .catch(() => toast.error("Couldn't copy — select the text and copy it manually"));
}

export function DraftCard({ job }: { job: Job }) {
  const [kind, setKind] = useState<DraftKind | null>(null);
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  async function run(next: DraftKind) {
    setKind(next);
    setLoading(true);
    setNotConfigured(false);
    try {
      setDraft(await generateDraft(job.id, next));
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setNotConfigured(true);
      } else if (err instanceof ApiError && err.status === 429) {
        toast.error("Slow down a moment, then try again.");
      } else {
        // includes the server's own hint, e.g. "Upload your résumé in Settings…"
        toast.error(
          err instanceof Error ? err.message : "Couldn't write that draft",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const mailto = draft
    ? `mailto:${job.contactEmail ?? ""}?subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Draft an email</CardTitle>
      </CardHeader>

      <CardBody className="pt-3">
        <p className="text-[13px] text-fg-muted">
          Get a starting point you can edit and send — nothing is saved.
          {job.contactName && (
            <>
              {" "}
              It will be addressed to{" "}
              <span className="font-medium text-fg">{job.contactName}</span>.
            </>
          )}
        </p>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Draft type">
          {KINDS.map((k) => (
            <Button
              key={k.kind}
              variant={kind === k.kind && draft ? "primary" : "outline"}
              size="sm"
              onClick={() => run(k.kind)}
              disabled={loading}
              aria-pressed={kind === k.kind && !!draft}
            >
              {k.label}
            </Button>
          ))}
        </div>

        {notConfigured && (
          <p className="label-mono mt-4 !text-[10px] !normal-case !tracking-normal">
            AI drafting isn&apos;t set up on this server yet.
          </p>
        )}

        {loading ? (
          <div className="mt-4 space-y-3">
            <p className="label-mono !text-[10px]">Writing…</p>
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        ) : (
          draft && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <Input
                  aria-label="Subject"
                  value={draft.subject}
                  onChange={(e) =>
                    setDraft({ ...draft, subject: e.target.value })
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Copy subject"
                  onClick={() => copy(draft.subject, "Subject copied")}
                >
                  <Copy size={13} />
                </Button>
              </div>

              <Textarea
                aria-label="Email body"
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                className="min-h-[220px] leading-relaxed"
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => copy(draft.body, "Email copied")}
                >
                  <Copy size={13} /> Copy email
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (mailto) window.location.href = mailto;
                  }}
                >
                  <Mail size={13} /> Open in email app
                </Button>
                {kind && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => run(kind)}
                  >
                    <RefreshCw size={13} /> Regenerate
                  </Button>
                )}
              </div>

              <p className="label-mono !text-[10px] !normal-case !tracking-normal">
                AI-assisted — read it through and check every detail before you
                send. Regenerating replaces your edits.
              </p>
            </div>
          )
        )}
      </CardBody>
    </Card>
  );
}
