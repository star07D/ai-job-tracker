import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

const base =
  "w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle " +
  "transition-colors focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft " +
  "disabled:opacity-55 aria-[invalid=true]:border-[var(--st-rejected)]";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(base, "h-10", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, "min-h-[96px] py-2.5 leading-relaxed", className)} {...props} />
));
Textarea.displayName = "Textarea";
