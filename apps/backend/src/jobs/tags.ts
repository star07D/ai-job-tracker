const MAX_TAGS = 15;
const MAX_TAG_LENGTH = 30;

/** Trims, drops blanks, dedupes case-insensitively (keeping first casing), caps the count. */
export function normalizeTags(tags?: string[]): string[] {
  if (!tags) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of tags) {
    const trimmed = raw.trim().slice(0, MAX_TAG_LENGTH);
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);

    if (result.length >= MAX_TAGS) break;
  }

  return result;
}
