import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrencyBR(value: number | string): string {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(numericValue)) return "R$ 0,00";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
}

export const formatDateToInput = (date: Date) => {
  return date.toISOString().split("T")[0];
};

export function convertToISO(dateStr: string): string {
  const [dd, mm, yy] = dateStr.split("/");
  if (!dd || !mm || !yy) return dateStr;
  return `20${yy}-${mm}-${dd}`; // assumes 21st century
}

export function transformDates(obj: Record<string, any>) {
  if (!obj || typeof obj !== "object") return obj;

  const newObj = { ...obj };
  Object.keys(newObj).forEach((key) => {
    if (
      key.toLowerCase().includes("date") &&
      typeof newObj[key] === "string" &&
      /^\d{2}\/\d{2}\/\d{2}$/.test(newObj[key])
    ) {
      newObj[key] = convertToISO(newObj[key]);
    }
  });
  return newObj;
}
