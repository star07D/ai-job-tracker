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
      {/* a planted flag — claim the role */}
      <path
        d="M8.5 5.25v13.5"
        stroke="var(--accent-fg)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8.5 6.25h8l-2.4 3 2.4 3h-8"
        fill="var(--accent-fg)"
        stroke="var(--accent-fg)"
        strokeWidth="1.4"
        strokeLinejoin="round"
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
