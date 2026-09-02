import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("h-6 w-6 shrink-0", className)}
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="7" fill="var(--accent)" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="var(--accent-fg)"
        d="M6 5.5h7.6c3 0 5 2 5 5 0 2.3-1.3 4.1-3.4 4.9l3.7 3.1h-4.3l-3.2-3H9.5v3H6V5.5Zm3.5 2.8v4h3.6c1.5 0 2.4-.9 2.4-2s-.9-2-2.4-2H9.5Z"
      />
    </svg>
  );
}

export function Logo({
  className,
  href = "/",
  size = "md",
}: {
  className?: string;
  href?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const text =
    size === "lg" ? "text-xl" : size === "sm" ? "text-[15px]" : "text-[17px]";
  const mark =
    size === "lg" ? "h-7 w-7" : size === "sm" ? "h-[18px] w-[18px]" : "h-6 w-6";

  const inner = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={mark} />
      <span
        className={cn(
          "font-display font-semibold tracking-[-0.03em] text-fg",
          text,
        )}
      >
        Rolio
      </span>
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className="inline-flex">
      {inner}
    </Link>
  );
}
