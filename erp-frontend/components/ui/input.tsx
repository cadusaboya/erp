import * as React from "react";
import { cn } from "@/lib/utils";

function formatDateInput(value: string): string {
  const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
  return digitsOnly.replace(/(\d{2})(\d{2})(\d{0,2})/, (_, d, m, y) => [d, m, y].filter(Boolean).join("/"));
}

function Input({ className, type, onChange, value, ...props }: React.ComponentProps<"input">) {
  const isDate = type === "date";

  if (isDate) {
    return (
      <input
        type="text"
        placeholder="dd/mm/aa"
        value={value as string}
        onChange={(e) => {
          const formatted = formatDateInput(e.target.value);
          onChange?.({
            ...e,
            target: {
              ...e.target,
              value: formatted,
            },
          });
        }}
        className={cn(
          "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        {...props}
      />
    );
  }

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      onChange={onChange}
      value={value}
      {...props}
    />
  );
}

export { Input };