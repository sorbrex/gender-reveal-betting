const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getAllowedBetDates(year = new Date().getUTCFullYear()): string[] {
  const start = Date.UTC(year, 2, 18);
  const end = Date.UTC(year, 3, 14);
  const numberOfDays = (end - start) / DAY_IN_MS + 1;

  return Array.from({ length: numberOfDays }, (_, index) =>
    new Date(start + index * DAY_IN_MS).toISOString().slice(0, 10)
  );
}
