export function convertToISO(dateStr: string): string {
  const [dd, mm, yy] = dateStr.split("/");
  if (!dd || !mm || !yy) return dateStr;
  return `20${yy}-${mm}-${dd}`; // assumes 21st century
}

export function transformDates<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;

  const newObj: Record<string, unknown> = { ...obj };

  Object.keys(newObj).forEach((key) => {
    const value = newObj[key];
    if (
      key.toLowerCase().includes("date") &&
      typeof value === "string" &&
      /^\d{2}\/\d{2}\/\d{2}$/.test(value)
    ) {
      newObj[key] = convertToISO(value);
    }
  });

  return newObj as T;
}
