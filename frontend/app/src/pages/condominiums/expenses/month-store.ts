export function isValidExpenseMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function storageKey(code: string) {
  return `condominium-expense-months:${code}`;
}

function closedStorageKey(code: string) {
  return `condominium-expense-closed-months:${code}`;
}

export function readExpenseMonths(code: string) {
  try {
    const raw = window.localStorage.getItem(storageKey(code));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((month): month is string => typeof month === 'string' && isValidExpenseMonth(month))
      .sort((a, b) => b.localeCompare(a));
  } catch {
    return [];
  }
}

export function saveExpenseMonths(code: string, months: string[]) {
  const normalized = Array.from(
    new Set(months.filter((month) => isValidExpenseMonth(month))),
  ).sort((a, b) => b.localeCompare(a));

  window.localStorage.setItem(storageKey(code), JSON.stringify(normalized));
  return normalized;
}

export function upsertExpenseMonth(code: string, month: string) {
  if (!isValidExpenseMonth(month)) return readExpenseMonths(code);
  const current = readExpenseMonths(code);
  return saveExpenseMonths(code, [month, ...current]);
}

export function readClosedExpenseMonths(code: string) {
  try {
    const raw = window.localStorage.getItem(closedStorageKey(code));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((month): month is string => typeof month === 'string' && isValidExpenseMonth(month))
      .sort((a, b) => b.localeCompare(a));
  } catch {
    return [];
  }
}

export function upsertClosedExpenseMonth(code: string, month: string) {
  if (!isValidExpenseMonth(month)) return readClosedExpenseMonths(code);
  const current = readClosedExpenseMonths(code);
  const normalized = Array.from(new Set([month, ...current])).sort((a, b) => b.localeCompare(a));
  window.localStorage.setItem(closedStorageKey(code), JSON.stringify(normalized));
  return normalized;
}
