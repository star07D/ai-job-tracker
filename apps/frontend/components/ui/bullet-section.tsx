/** A titled list of short bullet items, each on its own accent-dot row.
 * Shared between the AI prep and résumé-match cards. Renders nothing when
 * there are no items, so callers can list every section unconditionally. */
export function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="label-mono mb-2 !text-[10px]">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2.5 rounded-lg bg-surface-2 px-3 py-2.5 text-[13px] leading-relaxed"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
