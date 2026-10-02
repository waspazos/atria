const MONTH_DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const MONTH_DAY_YEAR = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** "Sep 22" */
export const shortDate = (iso: string) => MONTH_DAY.format(new Date(iso));

/** "Jun 1 – Aug 31, 2027" (year shown once when both ends share it). */
export function dateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return s.getUTCFullYear() === e.getUTCFullYear()
    ? `${MONTH_DAY.format(s)} – ${MONTH_DAY_YEAR.format(e)}`
    : `${MONTH_DAY_YEAR.format(s)} – ${MONTH_DAY_YEAR.format(e)}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
