"use client";

import { KeyboardEvent, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

function addTag(tags: string[], raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return tags;
  if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) return tags;
  return [...tags, trimmed];
}

export function TagInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    if (!draft) return;
    onChange(addTag(value, draft));
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-border-strong bg-surface px-2.5 py-1.5",
        "transition-colors focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft",
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-[12px] font-medium text-fg-muted"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={() => onChange(value.filter((t) => t !== tag))}
            className="text-fg-subtle hover:text-fg"
          >
            <X size={11} />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commitDraft}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="min-w-[80px] flex-1 bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
      />
    </div>
  );
}
