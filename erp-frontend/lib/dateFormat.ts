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
  