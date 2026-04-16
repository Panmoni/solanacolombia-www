const FORMULA_PREFIX = /^[\s=+\-@]/;

export const csvCell = (v: unknown): string => {
  let s = String(v ?? '');
  if (FORMULA_PREFIX.test(s)) {
    s = `'${s}`;
  }
  return `"${s.replace(/"/g, '""')}"`;
};

export const CSV_ROW_SEPARATOR = '\r\n';
