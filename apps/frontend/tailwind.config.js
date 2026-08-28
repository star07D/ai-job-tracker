/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts}",
  ],
  // status colours are built as `bg-[var(--st-*)]` in lib/job-status.ts —
  // safelist them so a class only referenced dynamically is never purged
  safelist: [
    "bg-[var(--st-applied)]",
    "bg-[var(--st-interview)]",
    "bg-[var(--st-accepted)]",
    "bg-[var(--st-rejected)]",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        fg: "var(--fg)",
        "fg-muted": "var(--fg-muted)",
        "fg-subtle": "var(--fg-subtle)",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
          fg: "var(--accent-fg)",
          soft: "var(--accent-soft)",
          line: "var(--accent-line)",
        },
        status: {
          applied: "var(--st-applied)",
          "applied-bg": "var(--st-applied-bg)",
          interview: "var(--st-interview)",
          "interview-bg": "var(--st-interview-bg)",
          accepted: "var(--st-accepted)",
          "accepted-bg": "var(--st-accepted-bg)",
          rejected: "var(--st-rejected)",
          "rejected-bg": "var(--st-rejected-bg)",
        },
      },
      borderRadius: {
        lg: "10px",
        xl: "14px",
        "2xl": "18px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        pop: "var(--shadow-pop)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "dialog-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "overlay-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        // no fill-mode: the resting state stays visible even if the
        // animation is throttled/never runs.
        "fade-up": "fade-up 0.45s cubic-bezier(0.2,0.7,0.2,1)",
        "dialog-in": "dialog-in 0.24s cubic-bezier(0.2,0.8,0.2,1)",
        "overlay-in": "overlay-in 0.2s ease",
      },
    },
  },
  plugins: [],
};

export default config;
