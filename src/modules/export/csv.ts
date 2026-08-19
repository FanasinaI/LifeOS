function escapeCsvValue(value: unknown): string {
  if (value == null) return '';
  const str = value instanceof Date ? value.toISOString() : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  if (rows.length === 0) return '';
  const columns = Object.keys(rows[0]);
  const header = columns.join(',');
  const lines = rows.map((row) => columns.map((col) => escapeCsvValue(row[col])).join(','));
  return [header, ...lines].join('\n');
}
